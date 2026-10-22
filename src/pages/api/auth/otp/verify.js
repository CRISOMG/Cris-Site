import crypto from 'crypto';
import { verifyStatelessOtp } from '../../../../lib/otpStore';
import { checkRateLimit, recordAttempt, resetRateLimit } from '../../../../lib/rateLimit';

const SESSION_SECRET = process.env.SESSION_SECRET || 'cris-site-secret-token-key-2026';

function generateSessionToken(payload) {
  const data = JSON.stringify(payload);
  const base64Data = Buffer.from(data).toString('base64');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(base64Data)
    .digest('hex');
  return `${base64Data}.${signature}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  // 1. Detección de bots por Honeypot
  if (req.body?.website_url) {
    return res.status(401).json({ success: false, message: 'Código inválido' });
  }

  // 2. Control de Tasa (Rate Limiting) por IP: Máx 5 intentos en 5 min, bloqueo de 15 min
  const rateLimitCheck = await checkRateLimit(req, {
    action: 'otp_verify',
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000,
    lockoutMs: 15 * 60 * 1000,
  });

  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: rateLimitCheck.reason,
      remainingSeconds: rateLimitCheck.remainingSeconds,
      isLocked: true,
    });
  }

  try {
    const { code, challengeToken: bodyChallenge } = req.body || {};
    if (!code) {
      return res.status(400).json({ success: false, message: 'Por favor ingresa el código de 6 dígitos' });
    }

    // Obtener el challenge token de la cookie o del body (redundancia para Vercel)
    const cookieHeader = req.headers.cookie || '';
    const cookieMatch = cookieHeader.match(/cris_otp_challenge=([^;]+)/);
    const cookieChallenge = req.cookies?.cris_otp_challenge || (cookieMatch ? cookieMatch[1] : null);
    const effectiveChallenge = bodyChallenge || cookieChallenge;

    const verification = verifyStatelessOtp(code, effectiveChallenge);
    if (!verification.valid) {
      // Registrar intento fallido para la IP
      const ipAttempt = await recordAttempt(req, {
        action: 'otp_verify',
        maxAttempts: 5,
        windowMs: 5 * 60 * 1000,
        lockoutMs: 15 * 60 * 1000,
      });

      // Si el código ha sido invalidado o tiene nuevo token firmado con contador actualizado
      const isProduction = process.env.NODE_ENV === 'production';
      if (verification.updatedChallengeToken) {
        res.setHeader(
          'Set-Cookie',
          `cris_otp_challenge=${verification.updatedChallengeToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300${isProduction ? '; Secure' : ''}`
        );
      } else if (verification.tokenExhausted) {
        res.setHeader('Set-Cookie', 'cris_otp_challenge=; Path=/; HttpOnly; Max-Age=0');
      }

      // Delay artificial de 600ms para ralentizar ataques automatizados por diccionario
      await new Promise((resolve) => setTimeout(resolve, 600));

      return res.status(401).json({
        success: false,
        message: verification.reason || 'Código inválido o expirado',
        attemptsRemaining: verification.attemptsRemaining ?? ipAttempt.attemptsRemaining,
        tokenExhausted: Boolean(verification.tokenExhausted),
        updatedChallengeToken: verification.updatedChallengeToken || null,
        isLocked: ipAttempt.isLocked,
      });
    }

    // Autenticación Exitosa: Limpiar bloqueos de tasa para la IP del propietario
    await resetRateLimit(req, 'otp_verify');
    await resetRateLimit(req, 'otp_request');

    // Limpiar la cookie del challenge OTP una vez consumido
    res.setHeader('Set-Cookie', 'cris_otp_challenge=; Path=/; HttpOnly; Max-Age=0');

    // Sesión válida por 24 horas
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const sessionPayload = {
      sub: 'cris-owner',
      name: 'Cristian Caraballo',
      role: 'owner',
      authMethod: verification.type,
      issuedAt: Date.now(),
      expiresAt,
    };

    const token = generateSessionToken(sessionPayload);

    return res.status(200).json({
      success: true,
      message: 'Autenticación exitosa. Bienvenido Cristian.',
      token,
      user: {
        id: 'cris-owner',
        name: 'Cristian Caraballo',
        role: 'owner',
        title: 'Javascript Product Engineer',
      },
      expiresAt,
    });
  } catch (error) {
    console.error('Error en verificación OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno en la verificación',
    });
  }
}
