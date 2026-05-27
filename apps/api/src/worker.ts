import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { startEmailWorker } from './jobs/email.worker.js';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
console.log(`Starting BullMQ worker process connecting to Redis at ${redisUrl}...`);

(async () => {
  const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  redisConnection.on('error', (err) => {
    console.warn('[Worker] Redis error:', err?.message || err);
  });

  try {
    await redisConnection.connect();

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

  } catch (error: any) {
    console.warn('❌ Failed to initialize background worker process. Redis may be unavailable:', error?.message || error);
    // Close connection if partially opened and exit gracefully without crashing the whole app.
    try {
      await redisConnection.quit();
    } catch (_) {}
    process.exit(0);
  }
})();
