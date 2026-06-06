-- Migration: 0005_expense_extra_fields
-- Adds payment_method, group_id, is_split to expenses table
-- Also fixes currency default from USD to INR

ALTER TABLE "expenses"
  ADD COLUMN IF NOT EXISTS "payment_method" text,
  ADD COLUMN IF NOT EXISTS "group_id" text REFERENCES "groups"("id") ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "is_split" boolean NOT NULL DEFAULT false;

-- Fix currency default to INR
ALTER TABLE "expenses" ALTER COLUMN "currency" SET DEFAULT 'INR';
