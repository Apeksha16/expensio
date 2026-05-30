ALTER TABLE "users" ADD COLUMN "monthly_salary" double precision;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_onboarded" boolean DEFAULT false NOT NULL;