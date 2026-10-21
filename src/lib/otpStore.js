import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'cris-site-secret-token-key-2026';
const OTP_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutos de validez

/**
 * Genera un código OTP de 6 dígitos y crea un Challenge Token criptográfico
 * 100% Stateless (sin estado en memoria) diseñado específicamente para Vercel Serverless.
 *
 * El código plano NUNCA se envía al cliente en el challengeToken.
 * Solo viaja un hash HMAC(código + expiración + secret), lo que permite que cualquier
 * instancia efímera de Lambda en Vercel valide el código sin necesidad de base de datos compartida.
 */
export function generateStatelessOtp() {
  // Generar código numérico de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRATION_MS;
  const nonce = crypto.randomBytes(8).toString('hex');

  // Firmar con HMAC-SHA256 usando SESSION_SECRET
  const payloadToSign = `${code}:${expiresAt}:${nonce}`;
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadToSign)
    .digest('hex');

  // Empaquetar solo metadatos públicos y la firma criptográfica
  const challengeData = JSON.stringify({
    sig: signature,
    exp: expiresAt,
    n: nonce,
  });

  const challengeToken = Buffer.from(challengeData).toString('base64');

  return {
    code,
    expiresAt,
    expiresInSeconds: Math.floor(OTP_EXPIRATION_MS / 1000),
    challengeToken,
  };
}

/**
 * Valida un código OTP enviado contra el Challenge Token criptográfico o el PIN Maestro
 * Compatible con cold starts y múltiples instancias en Vercel.
 */
export function verifyStatelessOtp(submittedCode, challengeToken) {
  if (!submittedCode) {
    return { valid: false, reason: 'Por favor ingresa el código' };
  }

  const cleanCode = submittedCode.toString().trim();
  const masterOtp = (process.env.MASTER_OTP || '777888').trim();

  // 1. PIN Maestro de respaldo configurado en .env
  if (cleanCode === masterOtp) {
    return {
      valid: true,
      type: 'master_pin',
      message: 'Acceso autorizado mediante PIN Maestro',
    };
  }

  // 2. Validación sin estado (Stateless Cryptographic Challenge)
  if (!challengeToken) {
    return {
      valid: false,
      reason: 'No se encontró el token de verificación. Solicita un nuevo código.',
    };
  }

  try {
    const raw = Buffer.from(challengeToken, 'base64').toString('utf8');
    const { sig, exp, n } = JSON.parse(raw);

    if (!sig || !exp || !n) {
      return { valid: false, reason: 'Token de verificación inválido' };
    }

    // Verificar si expiró
    if (Date.now() > exp) {
      return {
        valid: false,
        reason: 'El código OTP ha expirado (5 minutos de validez). Solicita uno nuevo.',
      };
    }

    // Recomputar la firma esperada con el código que el usuario ingresó y los valores firmados
    const expectedPayload = `${cleanCode}:${exp}:${n}`;
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(expectedPayload)
      .digest('hex');

    // Comparación segura en tiempo constante para evitar ataques de temporización (timing attacks)
    const sigBuffer = Buffer.from(sig, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return {
        valid: true,
        type: 'stateless_otp',
        message: 'Acceso autorizado mediante código OTP verificado',
      };
    }

    return { valid: false, reason: 'Código OTP incorrecto' };
  } catch (error) {
    console.error('Error al procesar challenge token:', error);
    return { valid: false, reason: 'Error procesando la verificación' };
  }
}
