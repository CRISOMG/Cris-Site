import { jwtVerify } from 'jose';

export default async function handler(req, res) {
  // OIDC Userinfo endpoint soporta GET y POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const authHeader = req.headers.authorization || '';
  let token = '';

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim();
  }

  let email = 'cristiancaraballo112@gmail.com';

  if (token) {
    try {
      const sessionSecret = process.env.SESSION_SECRET || 'cris-site-secret-token-key-2026';
      const secretKey = new TextEncoder().encode(sessionSecret);
      const { payload } = await jwtVerify(token, secretKey);
      if (payload?.email) {
        email = payload.email;
      }
    } catch (e) {
      // Si el token expiró o es opaco, mantenemos el correo configurado
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');

  return res.status(200).json({
    sub: email,
    email: email,
    email_verified: true,
    name: 'Cristian Caraballo',
    preferred_username: 'crisomg',
    groups: ['admin'],
  });
}
