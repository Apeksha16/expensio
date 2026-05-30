ALTER TABLE "users" ALTER COLUMN "currency" SET DEFAULT 'INR';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "supabase_auth_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider" text DEFAULT 'google' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_onboarding_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "is_onboarded";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_supabase_auth_id_unique" UNIQUE("supabase_auth_id");