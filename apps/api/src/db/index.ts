import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString =
  process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/expensio';
const isSupabasePooler = connectionString.includes('pooler.supabase.com');

// Disable TLS verification by default for local development, enable it conditionally if required
const client = postgres(connectionString, {
  ssl: process.env.DATABASE_SSL === 'true' ? 'require' : false,
  // Supabase transaction pooler works best without prepared statements.
  prepare: !isSupabasePooler,
});

export const db = drizzle(client, { schema });
export * as schema from './schema.js';
