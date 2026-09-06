-- Four-plan billing: renames the legacy tier identities onto the catalog
-- (FREE -> BASIC, SILVER -> PREMIUM, GOLD -> ROYAL) and adds the Subscription
-- table that records how each plan entitlement was fulfilled.

-- New billing enums.
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE "BillingCurrency" AS ENUM ('INR', 'USD');
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'STRIPE', 'MANUAL');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PENDING', 'CANCELLED', 'EXPIRED');

-- Rename the legacy tier values onto the new plan names.
ALTER TYPE "AccountTier" RENAME VALUE 'FREE' TO 'BASIC';
ALTER TYPE "AccountTier" RENAME VALUE 'SILVER' TO 'PREMIUM';
ALTER TYPE "AccountTier" RENAME VALUE 'GOLD' TO 'ROYAL';

-- Keep the column default in sync (the enum value was renamed under it).
ALTER TABLE "User" ALTER COLUMN "tier" SET DEFAULT 'BASIC'::"AccountTier";

-- Subscription records.
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "AccountTier" NOT NULL,
    "cycle" "BillingCycle" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "provider" "PaymentProvider" NOT NULL,
    "providerRef" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "currency" "BillingCurrency" NOT NULL DEFAULT 'INR',
    "planSnapshot" JSONB,
    "currentPeriodEnd" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
    "cancelledAt" TIMESTAMP(3) WITH TIME ZONE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");
CREATE INDEX "Subscription_provider_providerRef_idx" ON "Subscription"("provider", "providerRef");

ALTER TABLE "Subscription"
    ADD CONSTRAINT "Subscription_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;