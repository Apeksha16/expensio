import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { startEmailWorker } from './jobs/email.worker.js';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log(`Starting BullMQ worker process connecting to Redis at ${redisUrl}...`);

try {
  const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  const worker = startEmailWorker(redisConnection, (msg) => {
    console.log(`[Email Worker] ${msg}`);
  });

  console.log('✅ BullMQ email worker process initialized and listening for jobs.');

  // Handle termination signals gracefully
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down worker...`);
    await worker.close();
    await redisConnection.quit();
    console.log('Worker shutdown complete.');
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

} catch (error) {
  console.error('❌ Failed to initialize background worker process:', error);
  process.exit(1);
}
