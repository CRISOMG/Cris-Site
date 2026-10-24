const { generateSecret, generateURI } = require('otplib');
const qrcode = require('qrcode');

const secret = generateSecret();
const user = 'cristian@crisomg.link';
const service = 'CrisOMG Admin & Tunnel 2FA';

const otpauth = generateURI({
  secret,
  label: user,
  issuer: service,
});

console.log('\n==============================================');
console.log('     CONFIGURACIÓN 2FA (GOOGLE AUTHENTICATOR) ');
console.log('==============================================\n');
console.log('1. Guarda este secreto en tu .env local y en Vercel:\n');
console.log(`ADMIN_TOTP_SECRET="${secret}"`);
console.log(`OIDC_TOTP_SECRET="${secret}"\n`);
console.log('----------------------------------------------');
console.log('2. Escanea este código QR con Google Authenticator:\n');

qrcode.toString(otpauth, { type: 'terminal', small: true }, (err, qr) => {
  if (err) {
    console.error('Error generando QR:', err);
    return;
  }
  console.log(qr);
  console.log('O introduce manualmente este código en la app si no usas cámara:');
  console.log(`Clave secreta: ${secret}`);
  console.log(`URI completa:  ${otpauth}`);
  console.log('\n==============================================\n');
});
