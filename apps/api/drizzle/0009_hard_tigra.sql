CREATE TABLE IF NOT EXISTS "recurring_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"description" text,
	"category_id" text NOT NULL,
	"account_id" text NOT NULL,
	"frequency" text NOT NULL,
	"type" text DEFAULT 'standard' NOT NULL,
	"provider" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"last_generated_date" timestamp,
	"next_generation_date" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recurring_expenses" ADD CONSTRAINT "recurring_expenses_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recurring_expenses_user_id_idx" ON "recurring_expenses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_recurring_next_gen" ON "recurring_expenses" USING btree ("next_generation_date") WHERE status = 'active';