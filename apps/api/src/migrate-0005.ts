import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('Running migration: 0005_expense_extra_fields...');
  try {
    // Add new columns to expenses table (idempotent with IF NOT EXISTS)
    await db.execute(sql`
      ALTER TABLE "expenses"
        ADD COLUMN IF NOT EXISTS "payment_method" text,
        ADD COLUMN IF NOT EXISTS "group_id" text REFERENCES "groups"("id") ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "is_split" boolean NOT NULL DEFAULT false
    `);

    // Fix currency default to INR
    await db.execute(sql`
      ALTER TABLE "expenses" ALTER COLUMN "currency" SET DEFAULT 'INR'
    `);

    console.log('✅ Migration 0005 completed successfully!');
    console.log('   - Added: payment_method (text, nullable)');
    console.log('   - Added: group_id (text, FK -> groups.id, nullable)');
    console.log('   - Added: is_split (boolean, NOT NULL, default false)');
    console.log('   - Fixed: currency default changed from USD to INR');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
