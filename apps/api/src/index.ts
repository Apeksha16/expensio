import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server as SocketServer } from 'socket.io';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import { User, Expense } from '@expensio/shared-types';
import { formatCurrency, formatDate } from '@expensio/shared-utils';
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';

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

// Register CORS
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || '*',
});

// Setup Redis & BullMQ
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

  // Example BullMQ Worker
  new Worker(
    'emails',
    async (job) => {
      fastify.log.info(`Processing job ${job.id}: Sending email to ${job.data.to}`);
      // Send email simulation
      return { success: true };
    },
    { connection: redisConnection }
  );

  fastify.log.info('Redis and BullMQ initialized successfully');
} catch (error) {
  fastify.log.warn('Redis/BullMQ setup skipped or failed. Provide REDIS_URL to enable.');
}

// Basic Health Check Endpoint
fastify.get('/health', async () => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Sample API using shared packages
fastify.get('/api/sample-expense', async () => {
  const sampleUser: User = {
    id: 'u_123',
    email: 'user@expensio.com',
    name: 'Pranav Katiyar',
    createdAt: new Date(),
  };

  const sampleExpense: Expense = {
    id: 'exp_999',
    userId: sampleUser.id,
    amount: 1250.75,
    currency: 'USD',
    description: 'Cloud Server Hosting Bills',
    category: 'Infrastructure',
    date: new Date(),
    accountId: 'acc_1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    user: sampleUser,
    expense: {
      ...sampleExpense,
      formattedAmount: formatCurrency(sampleExpense.amount, sampleExpense.currency),
      formattedDate: formatDate(sampleExpense.date),
    },
  };
});

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
    
    // Attach Socket.IO to Fastify server listener
    const io = new SocketServer(fastify.server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      fastify.log.info(`Client connected: ${socket.id}`);
      
      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        fastify.log.info(`Socket ${socket.id} joined room ${roomId}`);
      });

      socket.on('disconnect', () => {
        fastify.log.info(`Client disconnected: ${socket.id}`);
      });
    });

    fastify.log.info('Socket.IO successfully attached to the server');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
