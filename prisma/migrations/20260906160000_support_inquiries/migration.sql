-- Support inquiries raised from the pricing page ("Raise an inquiry").
-- Persisted for support; an email notification is sent to the admin address.

CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'REPLIED', 'RESOLVED');

CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "plan" TEXT,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Inquiry_userId_idx" ON "Inquiry"("userId");
CREATE INDEX "Inquiry_createdAt_idx" ON "Inquiry"("createdAt");

ALTER TABLE "Inquiry"
    ADD CONSTRAINT "Inquiry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;