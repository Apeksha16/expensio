import Fastify from 'fastify';
import cors from '@fastify/cors';
import * as dotenv from 'dotenv';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';
import { healthRoutes } from './routes/health.js';
import { expenseRoutes } from './routes/expense.js';
import { SocketManager } from './sockets/socket.manager.js';

dotenv.config();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const host = process.env.HOST || '0.0.0.0';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// Setup Redis & BullMQ Queue (Producer)
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let redisConnection: Redis | null = null;
let emailQueue: Queue | null = null;

try {
  redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  
  emailQueue = new Queue('emails', {
    connection: redisConnection,
  });

  fastify.log.info('Redis connection and BullMQ queue publisher initialized successfully');
} catch (error) {
  fastify.log.warn('Redis/BullMQ publisher setup failed. Provide REDIS_URL to enable.');
}

// Register CORS
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || '*',
});

// Register Modular Routes
fastify.register(healthRoutes);
fastify.register(expenseRoutes);

// Start the Fastify Server
const start = async () => {
  try {
    await fastify.listen({ port, host });
    
    // Test Database Connection
    try {
      await db.execute(sql`SELECT 1`);
      fastify.log.info('Database connection verified successfully via Drizzle ORM');
    } catch (dbError: any) {
      fastify.log.warn(`Database connection verification failed: ${dbError.message}`);
      fastify.log.warn('Booting server anyway. Ensure PostgreSQL is running and DATABASE_URL is correct.');
    }
    
    // Initialize real-time Socket manager
    const socketManager = new SocketManager(fastify.log);
    socketManager.initialize(fastify.server);

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = async () => {
  fastify.log.info('Shutting down server...');
  await fastify.close();
  if (redisConnection) {
    await redisConnection.quit();
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
