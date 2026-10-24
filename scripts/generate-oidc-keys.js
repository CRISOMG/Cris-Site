const { generateKeyPair, exportJWK, exportPKCS8 } = require('jose');
const crypto = require('crypto');

async function main() {
  const { publicKey, privateKey } = await generateKeyPair('RS256', { extractable: true });
  const privateKeyPem = await exportPKCS8(privateKey);
  const publicJwk = {
    ...(await exportJWK(publicKey)),
    kid: 'crisomg-key-1',
    alg: 'RS256',
    use: 'sig',
  };

  console.log('\n==============================================');
  console.log('       GENERADOR DE LLAVES OIDC (RS256)       ');
  console.log('==============================================\n');
  console.log('Agrega estas variables en tu .env local y en Vercel:\n');
  console.log(`OIDC_PRIVATE_KEY=${JSON.stringify(privateKeyPem)}`);
  console.log(`OIDC_PUBLIC_JWK=${JSON.stringify(JSON.stringify(publicJwk))}`);
  console.log(`CF_CLIENT_ID="cloudflare-access-crisomg"`);
  console.log(`CF_CLIENT_SECRET="${crypto.randomBytes(32).toString('hex')}"`);
  console.log(`CF_CALLBACK_URL="https://<tu-team>.cloudflareaccess.com/cdn-cgi/access/callback"`);
  console.log('\n==============================================\n');
}

main().catch(console.error);
