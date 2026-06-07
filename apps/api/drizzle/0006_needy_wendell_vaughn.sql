ALTER TABLE "budgets" ADD COLUMN "is_rollover_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "budgets" ADD COLUMN "alert_threshold" double precision DEFAULT 80 NOT NULL;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "budgets_date_range_idx" ON "budgets" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "expenses_deleted_at_idx" ON "expenses" USING btree ("deleted_at");