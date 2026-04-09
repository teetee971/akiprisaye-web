-- SumUp Integration Migration
-- Replaces Stripe integration with SumUp Pro fields
-- Adds AffiliateTracking table for affiliate conversion tracking

-- Add SumUp-specific fields to the Subscription table
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "sumupCustomerId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "sumupSubscriptionId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "sumupPaymentId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingCycle" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "nextRenewalDate" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "affiliateSource" TEXT;
-- Stores the exact SubscriptionTier string value to avoid information loss from enum mapping
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "tierLabel" TEXT;

-- Create AffiliateTracking table for tracking affiliate conversions
CREATE TABLE IF NOT EXISTS "AffiliateTracking" (
  "id"             TEXT        NOT NULL,
  "affiliateKey"   TEXT        NOT NULL,
  "userId"         TEXT        NOT NULL,
  "plan"           TEXT        NOT NULL,
  "conversionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revenue"        DOUBLE PRECISION NOT NULL,
  "status"         TEXT        NOT NULL DEFAULT 'pending',
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AffiliateTracking_pkey" PRIMARY KEY ("id")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "AffiliateTracking_affiliateKey_idx" ON "AffiliateTracking"("affiliateKey");
CREATE INDEX IF NOT EXISTS "AffiliateTracking_userId_idx" ON "AffiliateTracking"("userId");
