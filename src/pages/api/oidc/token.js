import { SignJWT, jwtVerify, importPKCS8 } from 'jose';
import querystring from 'querystring';

function cleanStr(val) {
  if (!val) return '';
  let str = String(val).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }
  return str.trim();
}

function parsePrivateKey(raw) {
  if (!raw) return '';
  let str = cleanStr(raw);
  return str.replace(/\\n/g, '\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // 1. Extraer body independientemente de si viene como objeto o como string urlencoded
  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = querystring.parse(body);
    } catch (e) {
      try {
        body = JSON.parse(body);
      } catch (err) {}
    }
  }

  // 2. Extraer y normalizar credenciales del cliente
  const authHeader = req.headers.authorization || '';
  const expectedClientId = cleanStr(process.env.CF_CLIENT_ID || 'cloudflare-access-crisomg');
  const expectedSecret = cleanStr(process.env.CF_CLIENT_SECRET || '');

  let clientId = cleanStr(body.client_id);
  let clientSecret = cleanStr(body.client_secret);

  // Soporte para HTTP Basic Auth
  if (authHeader.startsWith('Basic ')) {
    try {
      const base64Part = authHeader.replace('Basic ', '').trim();
      const decoded = Buffer.from(base64Part, 'base64').toString('utf8');
      const colonIndex = decoded.indexOf(':');
      if (colonIndex !== -1) {
        clientId = clientId || cleanStr(decoded.substring(0, colonIndex));
        clientSecret = clientSecret || cleanStr(decoded.substring(colonIndex + 1));
      }
    } catch (e) {
      console.error('Error decodificando Basic Auth:', e);
    }
  }

  // Si se configuró CF_CLIENT_SECRET, validar coincidencia (tolerante a espacios)
  if (expectedSecret) {
    if (clientSecret !== expectedSecret) {
      console.error('Client secret mismatch en Cloudflare token exchange:', {
        hasReceivedSecret: Boolean(clientSecret),
        receivedLength: clientSecret?.length,
        expectedLength: expectedSecret?.length,
      });
      return res.status(401).json({
        error: 'invalid_client',
        error_description: 'Client secret does not match CF_CLIENT_SECRET',
      });
    }
  }

  // 3. Extraer y verificar el código temporal de autorización (firmado con SESSION_SECRET HS256)
  const code = cleanStr(body.code);
  if (!code) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Missing code parameter' });
  }

  try {
    const sessionSecret = process.env.SESSION_SECRET || 'cris-site-secret-token-key-2026';
    const secretKey = new TextEncoder().encode(sessionSecret);

    const { payload } = await jwtVerify(code, secretKey);

    // Candado estricto: ¿superó el 2FA de Google Authenticator?
    if (!payload.totp_verified) {
      return res.status(403).json({
        error: 'access_denied',
        error_description: 'Autorización 2FA no confirmada',
      });
    }

    // 4. Firmar el ID Token OIDC (RS256) que Cloudflare Access consumirá y verificará con el JWKS
    const privateKeyPem = process.env.OIDC_PRIVATE_KEY;
    if (!privateKeyPem) {
      return res.status(500).json({ error: 'server_error', error_description: 'OIDC_PRIVATE_KEY not configured' });
    }

    const pem = parsePrivateKey(privateKeyPem);
    const privateKey = await importPKCS8(pem, 'RS256');

    const email = payload.email || 'cristiancaraballo112@gmail.com';
    const issuer = process.env.OIDC_ISSUER || 'https://www.crisomg.link';

    const idToken = await new SignJWT({
      email,
      email_verified: true,
      name: 'Cristian Caraballo',
      preferred_username: 'crisomg',
      groups: ['admin'],
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
