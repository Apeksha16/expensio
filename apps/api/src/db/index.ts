import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';
import { Logger } from 'drizzle-orm/logger';

dotenv.config();

class DrizzleQueryLogger implements Logger {
  logQuery(query: string, params: unknown[]): void {
    const isFullScanRisk = !query.toLowerCase().includes('where');
    if (isFullScanRisk) {
      console.warn(
        `[Drizzle] FULL_SCAN_RISK: ${query.substring(0, 200)} | Params: ${params.length}`
      );
    }
  }
}

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/expensio';
const isSupabasePooler = connectionString.includes('pooler.supabase.com');

// Disable TLS verification by default for local development, enable it conditionally if required
const client = postgres(connectionString, {
  ssl: process.env.DATABASE_SSL === 'true' ? 'require' : false,
  // Supabase transaction pooler works best without prepared statements.
  prepare: !isSupabasePooler,
});

export const db = drizzle(client, { schema, logger: new DrizzleQueryLogger() });
export * as schema from './schema.js';
export { client };
