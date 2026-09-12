import { getCurrentUser, isNextResponse, jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";
import { adminEmail, sendAdminMail } from "@/lib/mail";
import { inquirySchema } from "@/lib/validation";
import { PLANS, isPlanId } from "@/lib/plans";

export const runtime = "nodejs";

// Raise a support / billing inquiry (e.g. from the pricing page). The inquiry
// is always persisted; an email is dispatched to the configured admin address
// when SMTP is set up (best-effort — a mail failure never fails the request).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = inquirySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Validation failed", 400, parsed.error.flatten().fieldErrors);
  }

  const { name, email, subject, message } = parsed.data;
  const rawPlan = parsed.data.plan ?? "";
  const plan = rawPlan && isPlanId(rawPlan) ? rawPlan : null;

  // Link the inquiry to the account when the submitter is logged in.
  const user = await getCurrentUser();

  let saved;
  try {
    saved = await prisma.inquiry.create({
      data: {
        userId: user && !isNextResponse(user) ? user.id : null,
        name,
        email,
        subject,
        message,
        plan,
      },
    });
  } catch {
    return jsonError("Could not save your inquiry — please try again", 500);
  }

  const planLabel = plan ? PLANS[plan]?.name ?? plan : "—";
  const subjectLine = `${subject}${plan ? ` — ${planLabel}` : ""}`;

  const text = [
    `A user raised an inquiry from the MCQure pricing page.`,
    ``,
    `Subject: ${subject}`,
    `User: ${name} <${email}>`,
    `Current plan: ${planLabel}`,
    `User id: ${saved.userId ?? "not signed in"}`,
    ``,
    `Message:`,
    message,
    ``,
    `Inquiry id: ${saved.id}`,
  ].join("\n");

  const html = [
    `<p>A user raised an inquiry from the <strong>MCQure pricing page</strong>.</p>`,
    `<table cellpadding="4" cellspacing="0" border="0">`,
    `<tr><td><strong>Subject</strong></td><td>${subject}</td></tr>`,
    `<tr><td><strong>User</strong></td><td>${name} &lt;${email}&gt;</td></tr>`,
    `<tr><td><strong>Plan</strong></td><td>${planLabel}</td></tr>`,
    `<tr><td><strong>User id</strong></td><td>${saved.userId ?? "not signed in"}</td></tr>`,
    `</table>`,
    `<p><strong>Message:</strong></p>`,
    `<blockquote style="margin:0;padding:8px 12px;border-left:3px solid #ccc;color:#333">${message.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</blockquote>`,
    `<p style="color:#777">Inquiry id: ${saved.id}</p>`,
  ].join("\n");

  const sent = await sendAdminMail({ subject: subjectLine, text, html });

  return jsonOk({
    inquiryId: saved.id,
    created: true,
    notified: sent,
    adminEmail: adminEmail() || null,
  });
}