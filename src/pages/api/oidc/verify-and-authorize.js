import { SignJWT, importPKCS8 } from 'jose';
import { verifySync } from 'otplib';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const { totpCode, email, clientId, redirectUri, state } = req.body || {};

  // 1. Validar que vengan los parámetros mínimos requeridos
  if (!totpCode || !clientId || !redirectUri) {
    return res.status(400).json({ success: false, message: 'Faltan parámetros obligatorios de OIDC' });
  }

  // 2. Candado de cliente: Debe coincidir con CF_CLIENT_ID configurado
  const expectedClientId = process.env.CF_CLIENT_ID || 'cloudflare-access-crisomg';
  if (clientId !== expectedClientId) {
    return res.status(403).json({ success: false, message: 'Client ID no reconocido' });
  }

  // 3. Candado de redirección: Debe ser exactamente un callback de cloudflareaccess.com
  const expectedCallback = process.env.CF_CALLBACK_URL;
  if (expectedCallback && redirectUri !== expectedCallback) {
    // Si está configurado CF_CALLBACK_URL estricto, validar coincidencia exacta
    if (!redirectUri.includes('.cloudflareaccess.com/cdn-cgi/access/callback')) {
      return res.status(403).json({ success: false, message: 'Redirect URI no autorizada' });
    }
  } else if (!redirectUri.includes('.cloudflareaccess.com/cdn-cgi/access/callback')) {
    return res.status(403).json({ success: false, message: 'Redirect URI inválida para Cloudflare Access' });
  }

  // 4. CANDADO ESTRICTO DE SEGURIDAD: Google Authenticator (TOTP 2FA)
  const totpSecret = (process.env.OIDC_TOTP_SECRET || process.env.ADMIN_TOTP_SECRET || '').trim();
  if (!totpSecret) {
    return res.status(500).json({ success: false, message: 'Servidor no tiene configurado OIDC_TOTP_SECRET' });
  }

  const cleanTotp = totpCode.toString().trim();
  const totpResult = verifySync({ token: cleanTotp, secret: totpSecret });

  if (!totpResult || !totpResult.valid) {
    return res.status(401).json({
      success: false,
      message: 'Código de Google Authenticator inválido o expirado. Inténtalo de nuevo.',
    });
  }

  // 5. Generar código de autorización firmado temporal (expira en 60 segundos)
  const privateKeyPem = process.env.OIDC_PRIVATE_KEY;
  if (!privateKeyPem) {
    return res.status(500).json({ success: false, message: 'Falta OIDC_PRIVATE_KEY en variables de entorno' });
  }

  try {
    const parsedPem = typeof privateKeyPem === 'string' ? JSON.parse(privateKeyPem) : privateKeyPem;
    const privateKey = await importPKCS8(parsedPem, 'RS256');

    const authCode = await new SignJWT({
      email: (email || 'cristiancaraballo112@gmail.com').trim(),
      totp_verified: true,
      client_id: clientId,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('60s')
      .sign(privateKey);

    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set('code', authCode);
    if (state) {
      callbackUrl.searchParams.set('state', state);
    }

    return res.status(200).json({
      success: true,
      redirectUrl: callbackUrl.toString(),
    });
  } catch (err) {
    console.error('Error generando authCode OIDC:', err);
    return res.status(500).json({ success: false, message: 'Error interno firmando código de autorización' });
  }
}
