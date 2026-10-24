import crypto from 'crypto';
import { verifySync } from 'otplib';

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
export function generateStatelessOtp(initialAttempts = 0) {
  // Generar código numérico de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRATION_MS;
  const nonce = crypto.randomBytes(8).toString('hex');
  const maxAttempts = 5;

  // Firmar código original con HMAC-SHA256 usando SESSION_SECRET
  const payloadToSign = `${code}:${expiresAt}:${nonce}`;
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadToSign)
    .digest('hex');

  // Firmar también los intentos para que el cliente no pueda adulterar el contador
  const attemptSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(`${signature}:${initialAttempts}:${maxAttempts}`)
    .digest('hex');

  // Empaquetar solo metadatos públicos y las firmas criptográficas
  const challengeData = JSON.stringify({
    sig: signature,
    exp: expiresAt,
    n: nonce,
    att: initialAttempts,
    max: maxAttempts,
    asig: attemptSignature,
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
 * Valida un código OTP enviado contra el Challenge Token criptográfico o el 2FA de Google Authenticator
 * (MASTER_OTP ha sido completamente invalidado y sustituido por TOTP).
 * Compatible con cold starts y múltiples instancias en Vercel.
 */
export function verifyStatelessOtp(submittedCode, challengeToken) {
  if (!submittedCode) {
    return { valid: false, reason: 'Por favor ingresa el código' };
  }

  const cleanCode = submittedCode.toString().trim();

  // 1. Verificación de Google Authenticator 2FA (Reemplaza y sustituye permanentemente a MASTER_OTP)
  const totpSecret = (process.env.ADMIN_TOTP_SECRET || process.env.OIDC_TOTP_SECRET || '').trim();
  if (totpSecret && cleanCode.length === 6 && /^\d+$/.test(cleanCode)) {
    try {
      const result = verifySync({ token: cleanCode, secret: totpSecret });
      if (result && result.valid) {
        return {
          valid: true,
          type: 'totp_2fa',
          message: 'Acceso autorizado mediante Google Authenticator (2FA)',
        };
      }
    } catch (err) {
      console.error('Error validando TOTP 2FA:', err);
    }
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
    const { sig, exp, n, att = 0, max = 5, asig } = JSON.parse(raw);

    if (!sig || !exp || !n) {
      return { valid: false, reason: 'Token de verificación inválido' };
    }

    // Verificar firma de intentos si viene en el token
    if (asig) {
      const expectedAttemptSig = crypto
        .createHmac('sha256', SESSION_SECRET)
        .update(`${sig}:${att}:${max}`)
        .digest('hex');

      if (asig !== expectedAttemptSig) {
        return { valid: false, reason: 'Token de verificación manipulado o inválido' };
      }
    }

    // Verificar si expiró por tiempo
    if (Date.now() > exp) {
      return {
        valid: false,
        reason: 'El código OTP ha expirado (5 minutos de validez). Solicita uno nuevo.',
      };
    }

    // Verificar si ya se superó el límite de intentos (Máximo 5 fallos por código)
    if (att >= max) {
      return {
        valid: false,
        reason: 'Límite de 5 intentos superado. Este código ha sido invalidado por seguridad. Solicita un nuevo código.',
        tokenExhausted: true,
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

    // Código erróneo: Incrementar intentos y emitir nuevo challenge token firmado
    const newAtt = att + 1;
    const remainingAttempts = Math.max(0, max - newAtt);

    if (newAtt >= max) {
      return {
        valid: false,
        reason: 'Código OTP incorrecto. Has alcanzado el límite máximo de 5 intentos. El código ha sido invalidado por seguridad.',
        tokenExhausted: true,
        attemptsRemaining: 0,
      };
    }

    const updatedAttemptSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(`${sig}:${newAtt}:${max}`)
      .digest('hex');

    const updatedChallengeData = JSON.stringify({
      sig,
      exp,
      n,
      att: newAtt,
      max,
      asig: updatedAttemptSig,
    });

    const updatedChallengeToken = Buffer.from(updatedChallengeData).toString('base64');

    return {
      valid: false,
      reason: `Código OTP incorrecto. Te quedan ${remainingAttempts} intento(s).`,
      attemptsRemaining: remainingAttempts,
      updatedChallengeToken,
    };
  } catch (error) {
    console.error('Error al procesar challenge token:', error);
    return { valid: false, reason: 'Error procesando la verificación' };
  }
}
