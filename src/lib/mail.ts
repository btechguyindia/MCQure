// ── SMTP email notifications (support inquiries) ─────────────────────────────
//
// Emails go to the configured admin/support address (ADMIN_EMAIL). The app is
// fully functional without SMTP — an inquiry is always saved to the database
// first, and sending is best-effort: an unconfigured or failing transport just
// logs and returns false, never fails the API request.

import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST ?? "";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER ?? "";
const SMTP_PASS = process.env.SMTP_PASS ?? "";
const SMTP_FROM = process.env.SMTP_FROM ?? "MCQure <no-reply@mcqure.app>";

/** The address that receives inquiry notifications, from the environment. */
export function adminEmail(): string {
  return (process.env.ADMIN_EMAIL ?? process.env.SUPPORT_EMAIL ?? "").trim();
}

export function mailConfigured(): boolean {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && adminEmail());
}

export interface OutgoingMail {
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send a notification to the admin address. Returns true when the mail was
 * accepted by the transport, false when SMTP is not configured or sending
 * failed (the inquiry itself has already been persisted by the caller).
 */
export async function sendAdminMail(mail: OutgoingMail): Promise<boolean> {
  if (!mailConfigured()) return false;

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    await transport.sendMail({
      from: SMTP_FROM,
      to: adminEmail(),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return true;
  } catch (err) {
    console.error("Failed to send admin email:", err);
    return false;
  }
}