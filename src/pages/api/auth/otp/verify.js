import crypto from 'crypto';
import { verifyStatelessOtp } from '../../../../lib/otpStore';

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

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
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
      return res.status(401).json({
        success: false,
        message: verification.reason || 'Código inválido o expirado',
      });
    }

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
