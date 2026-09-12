import "dotenv/config";
import { describe, expect, it } from "vitest";
import { prisma } from "../lib/db";
import { mailConfigured, sendAdminMail } from "../lib/mail";
import { inquirySchema } from "../lib/validation";

// DB-backed test of the support-inquiry flow on the shared Neon database: an
// inquiry is always persisted (linked to the user when signed in), validation
// rejects bad input, and mail delivery is best-effort — with no SMTP configured
// in the test environment sending resolves to false rather than throwing.
describe("Support inquiries", () => {
  it("persists a validated inquiry linked to the user", async () => {
    const email = `inquiry-${Date.now()}@test.local`;
    const user = await prisma.user.create({
      data: { email, name: "Inquiry Test", passwordHash: "x", tier: "BASIC" },
    });

    try {
      const body = {
        name: "Inquiry Test",
        email,
        subject: "Pricing / Current Plan UI Issue",
        message: "My current plan card looks wrong on mobile. Please check.",
        plan: "PREMIUM",
      };
      expect(inquirySchema.safeParse(body).success).toBe(true);

      const saved = await prisma.inquiry.create({
        data: {
          userId: user.id,
          name: body.name,
          email: body.email,
          subject: body.subject,
          message: body.message,
          plan: "PREMIUM",
        },
      });

      expect(saved.userId).toBe(user.id);
      expect(saved.subject).toBe(body.subject);
      expect(saved.status).toBe("OPEN");

      const roundTrip = await prisma.inquiry.findUnique({ where: { id: saved.id } });
      expect(roundTrip?.message).toBe(body.message);
      expect(roundTrip?.plan).toBe("PREMIUM");
    } finally {
      await prisma.inquiry.deleteMany({ where: { email } });
      await prisma.user.delete({ where: { id: user.id } });
    }
  });

  it("rejects invalid inquiry input", () => {
    expect(inquirySchema.safeParse({ message: "too short" }).success).toBe(false);
    expect(inquirySchema.safeParse({ email: "not-an-email", message: "a".repeat(10) }).success).toBe(false);
    expect(inquirySchema.safeParse({ message: "a".repeat(5000) }).success).toBe(false);
    expect(inquirySchema.safeParse({ name: "", email: "a@b.co", subject: "", message: "a".repeat(10) }).success).toBe(false);
  });

  it("resolves mail delivery to false without SMTP (best-effort)", async () => {
    expect(mailConfigured()).toBe(false);
    await expect(
      sendAdminMail({ subject: "Test", text: "No SMTP in tests." })
    ).resolves.toBe(false);
  });
});