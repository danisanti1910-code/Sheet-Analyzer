import nodemailer from "nodemailer";

const APP_NAME = "Sheet Analyzer";

// Read config from env (fallback to empty – emails will be logged to console)
const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? `"${APP_NAME}" <noreply@sheetanalyzer.com>`;
const APP_URL = process.env.APP_URL ?? process.env.FRONTEND_URL ?? "http://localhost:5173";

const smtpConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

/**
 * Sends an email. If SMTP is not configured, logs to console instead (dev mode).
 */
async function sendMail(to: string, subject: string, html: string): Promise<void> {
  if (transporter) {
    await transporter.sendMail({ from: SMTP_FROM, to, subject, html });
    console.log(`[Email] Sent to ${to}: "${subject}"`);
  } else {
    console.log("──────────────────────────────────────────────");
    console.log(`[Email DEV] SMTP not configured – printing email.`);
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:\n${html}`);
    console.log("──────────────────────────────────────────────");
  }
}

// ─── Email templates ────────────────────────────────────────────────

function baseLayout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f4f4f5;">
  <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:#4f46e5;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${APP_NAME}</h1>
    </div>
    <div style="padding:32px;">
      ${content}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;">
      &copy; ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.
    </div>
  </div>
</body>
</html>`;
}

export async function sendVerificationEmail(to: string, token: string, firstName: string): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#18181b;">¡Hola, ${firstName}!</h2>
    <p style="color:#52525b;line-height:1.6;margin:0 0 24px;">
      Gracias por registrarte en <strong>${APP_NAME}</strong>. Para completar tu registro, verifica tu correo electrónico haciendo clic en el botón de abajo.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Verificar mi correo
      </a>
    </div>
    <p style="color:#71717a;font-size:13px;line-height:1.5;">
      Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br/>
      <a href="${verifyUrl}" style="color:#4f46e5;word-break:break-all;">${verifyUrl}</a>
    </p>
    <p style="color:#a1a1aa;font-size:12px;margin-top:24px;">Este enlace expira en 24 horas. Si no solicitaste esta verificación, ignora este correo.</p>
  `);
  await sendMail(to, "Verifica tu correo electrónico", html);
}

export async function sendPasswordResetEmail(to: string, token: string, firstName: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const html = baseLayout(`
    <h2 style="margin:0 0 16px;font-size:22px;color:#18181b;">Restablecer contraseña</h2>
    <p style="color:#52525b;line-height:1.6;margin:0 0 8px;">
      Hola <strong>${firstName}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta.
    </p>
    <p style="color:#52525b;line-height:1.6;margin:0 0 24px;">
      Haz clic en el botón de abajo para crear una nueva contraseña.
    </p>
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
        Restablecer contraseña
      </a>
    </div>
    <p style="color:#71717a;font-size:13px;line-height:1.5;">
      Si no puedes hacer clic en el botón, copia y pega este enlace:<br/>
      <a href="${resetUrl}" style="color:#4f46e5;word-break:break-all;">${resetUrl}</a>
    </p>
    <p style="color:#a1a1aa;font-size:12px;margin-top:24px;">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este correo.</p>
  `);
  await sendMail(to, "Restablece tu contraseña", html);
}

export async function sendResendVerificationEmail(to: string, token: string, firstName: string): Promise<void> {
  // Reuse the same template
  await sendVerificationEmail(to, token, firstName);
}
