import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../../config/env.js';

const redisConnection = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const syncQueue = new Queue('bulk-sync', {
  connection: redisConnection as any,
});
