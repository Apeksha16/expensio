import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

async function testConnection() {
  console.log('Connecting to Supabase PostgreSQL...');
  try {
    const start = Date.now();
    const result = await db.execute(sql`SELECT 1 as test_val, NOW() as current_time`);
    const duration = Date.now() - start;
    
    console.log('\n=========================================');
    console.log('✅ DATABASE CONNECTION TEST SUCCESSFUL!');
    console.log(`⏱️  Latency: ${duration}ms`);
    console.log('📊 Query Result:', JSON.stringify(result, null, 2));
    console.log('=========================================\n');
    process.exit(0);
  } catch (error: any) {
    console.error('\n=========================================');
    console.error('❌ DATABASE CONNECTION TEST FAILED!');
    console.error('⚠️  Error Details:', error.message || error);
    console.error('=========================================\n');
    process.exit(1);
  }
}

testConnection();
