import { generateStatelessOtp } from '../../../../lib/otpStore';
import { sendOtpEmail } from '../../../../lib/mailer';
import { checkRateLimit, recordAttempt } from '../../../../lib/rateLimit';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  // 1. Detección de Bots por Honeypot
  if (req.body?.website_url) {
    return res.status(200).json({ success: true, message: 'Solicitud procesada' });
  }

  // 2. Rate Limiting por IP (Máx 3 solicitudes cada 60s, con bloqueo de 15m)
  const rateLimitCheck = await checkRateLimit(req, {
    action: 'otp_request',
    maxAttempts: 3,
    windowMs: 60 * 1000,
    lockoutMs: 15 * 60 * 1000,
  });

  if (!rateLimitCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: rateLimitCheck.reason,
      remainingSeconds: rateLimitCheck.remainingSeconds,
    });
  }

  // Registrar solicitud en la ventana
  await recordAttempt(req, {
    action: 'otp_request',
    maxAttempts: 3,
    windowMs: 60 * 1000,
    lockoutMs: 15 * 60 * 1000,
  });

  try {
    // Generar OTP con token criptográfico sin estado (Stateless HMAC para Vercel)
    const otpData = generateStatelessOtp();

    // Enviar el correo por Gmail SMTP con la contraseña de aplicación
    const emailResult = await sendOtpEmail({
      code: otpData.code,
      expiresInMinutes: Math.round(otpData.expiresInSeconds / 60),
    });

    // Enmascarar correo para respuesta pública segura (ej: pa***@crisomg.link)
    let maskedEmail = null;
    const targetEmail = process.env.OTP_TARGET_EMAIL || process.env.GMAIL_USER;
    if (targetEmail) {
      maskedEmail = targetEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    }

    // Configurar cookie HttpOnly con el challenge token para redundancia entre instancias serverless
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = [
      `cris_otp_challenge=${otpData.challengeToken}`,
      'Path=/',
      'HttpOnly',
      'SameSite=Lax',
      `Max-Age=${otpData.expiresInSeconds}`,
      isProduction ? 'Secure' : '',
    ]
      .filter(Boolean)
      .join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    return res.status(200).json({
      success: true,
      message: emailResult.success
        ? `Código de seguridad enviado a tu correo (${maskedEmail})`
        : 'Código de seguridad generado y enviado',
      expiresInSeconds: otpData.remainingSeconds || otpData.expiresInSeconds,
      expiresAt: otpData.expiresAt,
      emailSent: emailResult.success,
      maskedEmail,
      challengeToken: otpData.challengeToken,
    });
  } catch (error) {
    console.error('Error generando/enviando OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud de OTP',
      error: error.message,
    });
  }
}
