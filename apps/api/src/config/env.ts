import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load dotenv
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SENTRY_DSN: z.string().url().optional(),
  SLOW_REQUEST_THRESHOLD_MS: z.coerce.number().default(1000),
  CRITICAL_REQUEST_THRESHOLD_MS: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_JWT_SECRET: z.string().min(1, 'SUPABASE_JWT_SECRET is required'),
  REDIS_URL: z.string().url(),
  MEILISEARCH_URL: z.string().url('MEILISEARCH_URL must be a valid URL'),
  MEILISEARCH_MASTER_KEY: z.string().min(1, 'MEILISEARCH_MASTER_KEY is required'),
  HOST: z.string().default('0.0.0.0'),
  FRONTEND_URL: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
