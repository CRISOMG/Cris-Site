import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'cris-site-secret-token-key-2026';

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [base64Data, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Data)
    .digest('hex');

  if (signature !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf8'));
    if (Date.now() > payload.expiresAt) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : req.body?.token || req.query?.token;

  if (!token) {
    return res.status(200).json({ authenticated: false });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return res.status(200).json({ authenticated: false, message: 'Sesión inválida o expirada' });
  }

  return res.status(200).json({
    authenticated: true,
    user: {
      id: session.sub,
      name: session.name,
      role: session.role,
      authMethod: session.authMethod,
    },
    expiresAt: session.expiresAt,
  });
}
