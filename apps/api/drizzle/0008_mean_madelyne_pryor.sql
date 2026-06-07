ALTER TABLE "splits" DROP CONSTRAINT "splits_group_expense_id_group_expenses_id_fk";--> statement-breakpoint
DROP TABLE "group_expenses" CASCADE;--> statement-breakpoint
DROP INDEX IF EXISTS "splits_group_expense_id_idx";--> statement-breakpoint
ALTER TABLE "splits" ALTER COLUMN "expense_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "splits" DROP COLUMN IF EXISTS "group_expense_id";