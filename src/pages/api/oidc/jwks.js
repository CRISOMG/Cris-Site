import { importPKCS8, exportJWK } from 'jose';

function parsePrivateKey(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }
  return str.replace(/\\n/g, '\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Derivación automática: Si existe OIDC_PRIVATE_KEY, extraemos la clave pública matemáticamente
    // Esto garantiza 100% que la clave pública coincide con la privada que firmó el id_token
    const privateKeyPem = process.env.OIDC_PRIVATE_KEY;
    if (privateKeyPem) {
      const pem = parsePrivateKey(privateKeyPem);
      const importedKey = await importPKCS8(pem, 'RS256', { extractable: true });
      const jwk = await exportJWK(importedKey);

      const publicJwk = {
        kty: jwk.kty,
        n: jwk.n,
        e: jwk.e,
        kid: 'crisomg-key-1',
        alg: 'RS256',
        use: 'sig',
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      return res.status(200).json({
        keys: [publicJwk],
      });
    }

    // 2. Fallback a OIDC_PUBLIC_JWK
    const rawJwk = process.env.OIDC_PUBLIC_JWK;
    if (!rawJwk) {
      return res.status(500).json({ error: 'No se encontraron claves OIDC en variables de entorno' });
    }

    let publicJwk = rawJwk;
    if (typeof publicJwk === 'string') {
      publicJwk = JSON.parse(publicJwk);
      if (typeof publicJwk === 'string') {
        publicJwk = JSON.parse(publicJwk);
      }
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return res.status(200).json({
      keys: Array.isArray(publicJwk) ? publicJwk : [publicJwk],
    });
  } catch (err) {
    console.error('Error procesando clave pública JWKS:', err);
    return res.status(500).json({ error: 'Error procesando clave pública JWKS', details: err.message });
  }
}
