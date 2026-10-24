export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawJwk = process.env.OIDC_PUBLIC_JWK;
  if (!rawJwk) {
    return res.status(500).json({ error: 'OIDC_PUBLIC_JWK no configurado en variables de entorno' });
  }

  try {
    const publicJwk = typeof rawJwk === 'string' ? JSON.parse(rawJwk) : rawJwk;
    // OIDC JWKS spec requires returning keys in a keys array
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return res.status(200).json({
      keys: Array.isArray(publicJwk) ? publicJwk : [publicJwk],
    });
  } catch (err) {
    console.error('Error parseando OIDC_PUBLIC_JWK:', err);
    return res.status(500).json({ error: 'Error procesando clave pública JWKS' });
  }
}
