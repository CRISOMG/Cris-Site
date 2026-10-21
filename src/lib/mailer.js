import nodemailer from 'nodemailer';

/**
 * Crea el transporter de Nodemailer configurado para Gmail con Contraseña de Aplicación
 */
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ''); // Remover espacios si el usuario los copió de Google

  if (!user || !pass || pass === 'tu_contraseña_de_aplicacion_aqui') {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Genera la plantilla HTML premium para el correo de OTP
 */
function getEmailTemplate(code, expiresInMinutes = 5) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Seguridad OTP</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #07151C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F7EFC5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px; background-color: #07151C;">
      <tr>
        <td align="center">
          <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #0D222D; border: 1px solid rgba(255, 170, 91, 0.35); border-radius: 20px; padding: 36px 32px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);">
            <!-- Encabezado / Logo -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <div style="display: inline-block; padding: 12px 24px; background: rgba(255, 170, 91, 0.12); border: 1px solid rgba(255, 170, 91, 0.3); border-radius: 50px;">
                  <span style="font-size: 13px; font-weight: 700; color: #FFAA5B; text-transform: uppercase; letter-spacing: 1.5px;">🔐 Cris-Site &bull; Control de Acceso</span>
                </div>
              </td>
            </tr>

            <!-- Título Principal -->
            <tr>
              <td align="center" style="padding-bottom: 12px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #F7EFC5; letter-spacing: -0.5px;">
                  Tu Código de Acceso de Propietario
                </h1>
              </td>
            </tr>

            <!-- Descripción -->
            <tr>
              <td align="center" style="padding-bottom: 28px;">
                <p style="margin: 0; font-size: 14px; line-height: 22px; color: rgba(247, 239, 197, 0.85);">
                  Se ha solicitado un inicio de sesión para el espacio privado de <strong>Cristian Caraballo</strong>. Usa el siguiente código único de verificación:
                </p>
              </td>
            </tr>

            <!-- Bloque del Código OTP -->
            <tr>
              <td align="center" style="padding-bottom: 28px;">
                <div style="display: inline-block; background: #07151C; border: 2px dashed #FFAA5B; border-radius: 16px; padding: 18px 36px; text-align: center;">
                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; color: #FFAA5B; letter-spacing: 10px; margin-right: -10px;">
                    ${code}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Advertencia de Expiración -->
            <tr>
              <td align="center" style="padding-bottom: 28px;">
                <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 12px 18px; font-size: 12px; color: rgba(247, 239, 197, 0.7); line-height: 18px;">
                  ⏳ Este código es de un solo uso y expirará automáticamente en <strong>${expiresInMinutes} minutos</strong>.
                </div>
              </td>
            </tr>

            <!-- Nota de Seguridad -->
            <tr>
              <td style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; font-size: 11px; line-height: 18px; color: rgba(255, 255, 255, 0.45); text-align: center;">
                Si tú no solicitaste este código, puedes ignorar este mensaje de forma segura. Tu PIN maestro y credenciales continúan protegidos.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Envía el código OTP al correo Gmail configurado
 */
export async function sendOtpEmail({ code, expiresInMinutes = 5 }) {
  const recipient = process.env.OTP_TARGET_EMAIL || process.env.GMAIL_USER;
  const transporter = createTransporter();

  // Si no está configurado el correo o la contraseña de aplicación todavía
  if (!transporter || !recipient) {
    console.log('\n========================================');
    console.log('⚠️ [GMAIL SMTP]: GMAIL_USER o GMAIL_APP_PASSWORD no están configurados en .env');
    console.log(`🔑 Código OTP generado: [ ${code} ]`);
    console.log('========================================\n');
    return {
      success: false,
      configured: false,
      simulated: true,
      code,
      message: 'Gmail SMTP no configurado en .env. Se usará el código en consola/pantalla.',
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Cris-Site Security" <${process.env.GMAIL_USER}>`,
      to: recipient,
      subject: `🔑 ${code} es tu código de verificación de propietario`,
      text: `Tu código de acceso OTP para Cris-Site es: ${code}. Válido por ${expiresInMinutes} minutos.`,
      html: getEmailTemplate(code, expiresInMinutes),
    });

    console.log(`\n📧 [GMAIL SMTP]: Correo enviado con éxito a ${recipient}. ID: ${info.messageId}`);
    return {
      success: true,
      configured: true,
      recipient,
      messageId: info.messageId,
      message: `Código enviado con éxito a ${recipient}`,
    };
  } catch (error) {
    console.error('❌ [GMAIL SMTP Error]:', error.message);
    return {
      success: false,
      configured: true,
      error: error.message,
      code,
      message: `Error al enviar correo por Gmail SMTP: ${error.message}`,
    };
  }
}
