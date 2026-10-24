import { SignJWT, jwtVerify, importPKCS8 } from 'jose';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // Cloudflare Access puede enviar application/x-www-form-urlencoded o application/json
  const body = req.body || {};

  // 1. Validar autenticación de cliente (Basic Auth o parámetros de body)
  const authHeader = req.headers.authorization || '';
  const expectedClientId = process.env.CF_CLIENT_ID || 'cloudflare-access-crisomg';
  const expectedSecret = process.env.CF_CLIENT_SECRET;

  let clientId = body.client_id;
  let clientSecret = body.client_secret;

  if (authHeader.startsWith('Basic ')) {
    try {
      const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString('utf8');
      const [u, p] = decoded.split(':');
      clientId = clientId || u;
      clientSecret = clientSecret || p;
    } catch (e) {}
  }

  if (expectedSecret && (clientId !== expectedClientId || clientSecret !== expectedSecret)) {
    return res.status(401).json({ error: 'invalid_client', error_description: 'Client credentials invalid' });
  }

  // 2. Extraer y verificar el código temporal de autorización
  const code = body.code;
  if (!code) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Missing code parameter' });
  }

  const privateKeyPem = process.env.OIDC_PRIVATE_KEY;
  if (!privateKeyPem) {
    return res.status(500).json({ error: 'server_error', error_description: 'OIDC_PRIVATE_KEY not configured' });
  }

  try {
    const parsedPem = typeof privateKeyPem === 'string' ? JSON.parse(privateKeyPem) : privateKeyPem;
    const privateKey = await importPKCS8(parsedPem, 'RS256');

    // Verificar firma y expiración del código
    const { payload } = await jwtVerify(code, privateKey);

    // 3. CANDADO INNEGOCIABLE: Solo emitir token si fue validado con 2FA
    if (!payload.totp_verified) {
      return res.status(403).json({
        error: 'access_denied',
        error_description: 'Autorización 2FA de Google Authenticator no confirmada',
      });
    }

    const email = payload.email || 'cristiancaraballo112@gmail.com';
    const issuer = process.env.OIDC_ISSUER || 'https://www.crisomg.link';

    // 4. Firmar el ID Token OIDC que Cloudflare Access consumirá
    const idToken = await new SignJWT({
      email,
      email_verified: true,
      name: 'Cristian Caraballo',
      preferred_username: 'crisomg',
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'crisomg-key-1', typ: 'JWT' })
      .setIssuer(issuer)
      .setSubject(email)
      .setAudience(expectedClientId)
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(privateKey);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');

    return res.status(200).json({
      access_token: code,
      token_type: 'Bearer',
      expires_in: 43200, // 12 horas
      id_token: idToken,
    });
  } catch (err) {
    console.error('Error canjeando token OIDC:', err);
    return res.status(400).json({
      error: 'invalid_grant',
      error_description: 'Código de autorización inválido o expirado',
    });
  }
}
