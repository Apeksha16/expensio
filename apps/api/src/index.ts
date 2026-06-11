import './instrument.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import * as Sentry from '@sentry/node';
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';
import { healthRoutes } from './routes/health.js';
import { SocketManager, socketManagerInstance } from './sockets/socket.manager.js';
import { env } from './config/env.js';
import authPlugin from './plugins/auth.plugin.js';
import performancePlugin from './plugins/performance.plugin.js';
import idempotencyPlugin from './plugins/idempotency.plugin.js';
import errorHandlerPlugin from './plugins/error-handler.plugin.js';
import { authRoutes } from './modules/auth/index.js';
import { usersRoutes } from './modules/users/index.js';
import { expensesRoutes } from './modules/expenses/index.js';
import { dashboardRoutes } from './modules/dashboard/index.js';
import { budgetRoutes } from './modules/budgets/index.js';
import { analyticsRoutes } from './modules/analytics/index.js';
import { notificationRoutes } from './modules/notifications/index.js';
import { friendsRoutes } from './modules/friends/friends.routes.js';
import { groupsRoutes } from './modules/groups/groups.routes.js';
import { settlementsRoutes } from './modules/settlements/settlements.routes.js';
import { recurringRoutes } from './modules/recurring/recurring.routes.js';
import { syncRoutes } from './modules/sync/sync.routes.js';
import { pushRoutes } from './modules/push/push.routes.js';
import { budgetListener } from './modules/budgets/budget.listener.js';
import { notificationService } from './modules/notifications/notification.service.js';
import { recurringExpenseWorker } from './jobs/recurring-expense.worker.js';
import { budgetForecastWorker } from './jobs/budget-forecast.worker.js';
import { outboxWorker } from './jobs/outbox.worker.js';
import { cleanupSubscriptionsWorker } from './jobs/cleanup-subscriptions.worker.js';
import { notificationCleanupWorker } from './jobs/notification-cleanup.worker.js';
import { syncWorker } from './modules/sync/sync.worker.js';
import { syncQueue } from './modules/sync/sync.queue.js';
import { API_VERSION } from './version.js';

import fastifyRateLimit from '@fastify/rate-limit';

const port = env.PORT;
const host = env.HOST;

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

Sentry.setupFastifyErrorHandler(fastify);

import compress from '@fastify/compress';

fastify.log.info('BullMQ queue processing is disabled for now.');

// Register Health Route (Fix 4)
fastify.get('/health', async (request, reply) => {
  try {
    await db.execute(sql`SELECT 1`);
    return reply.status(200).send({ status: 'ok', db: 'connected', uptime: process.uptime() });
  } catch (err: any) {
    return reply.status(503).send({ status: 'error', db: 'disconnected', message: err.message });
  }
});

// Register Compression (Fix 1)
fastify.register(compress, { global: true, encodings: ['br', 'gzip'], threshold: 1024 });

// Register CORS
fastify.register(cors, {
  origin: env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

// Register Rate Limit
fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: function (request, context) {
    return {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded, retry in ${context.after}`,
      },
    };
  },
});

// Register Observability & Performance Plugin
fastify.register(performancePlugin);

// Register Error Handler Plugin
fastify.register(errorHandlerPlugin);

// Register Auth Plugin
fastify.register(authPlugin);

// Register Idempotency Plugin
fastify.register(idempotencyPlugin);

// Register Modular Routes
fastify.register(healthRoutes);
fastify.register(authRoutes);
fastify.register(usersRoutes);
fastify.register(expensesRoutes);
fastify.register(dashboardRoutes);
fastify.register(budgetRoutes);
fastify.register(analyticsRoutes);
fastify.register(notificationRoutes);
fastify.register(friendsRoutes, { prefix: '/api/v1/friends' });
fastify.register(groupsRoutes, { prefix: '/api/v1/groups' });
fastify.register(settlementsRoutes, { prefix: '/api/v1/settlements' });
fastify.register(recurringRoutes, { prefix: '/api/v1/recurring' });
fastify.register(syncRoutes, { prefix: '/api/v1/sync' });
fastify.register(pushRoutes, { prefix: '/api/v1/push' });

// Start the Fastify Server
const start = async () => {
  try {
    await fastify.listen({ port, host });
    fastify.log.info(`🚀 Expensio API Version: ${API_VERSION}`);

    // Test Database Connection
    try {
      await db.execute(sql`SELECT 1`);
      fastify.log.info('Database connection verified successfully via Drizzle ORM');

      // Ensure mock friends exist in the database for splits integrity
      try {
        const mockFriends = [
          { id: 'f1', email: 'rahul@expensio.com', name: 'Rahul Sharma', username: 'rahuls' },
          { id: 'f2', email: 'amit@expensio.com', name: 'Amit Verma', username: 'amitv' },
          { id: 'f3', email: 'pranav@expensio.com', name: 'Pranav Singh', username: 'pranavs' },
          { id: 'f4', email: 'neha@expensio.com', name: 'Neha Kapoor', username: 'nehak' },
          { id: 'f5', email: 'sarthak@expensio.com', name: 'Sarthak Jain', username: 'sarthakj' },
        ];
        for (const friend of mockFriends) {
          await db.execute(sql`
            INSERT INTO "users" (id, email, name, username, is_onboarding_completed)
            VALUES (${friend.id}, ${friend.email}, ${friend.name}, ${friend.username}, true)
            ON CONFLICT (id) DO NOTHING
          `);
        }
        fastify.log.info('Mock friends seeded/verified in database');
      } catch (seedError: any) {
        fastify.log.error(`Failed to seed mock friends: ${seedError.message}`);
      }
    } catch (dbError: any) {
      fastify.log.warn(`Database connection verification failed: ${dbError.message}`);
      fastify.log.warn(
        'Booting server anyway. Ensure PostgreSQL is running and DATABASE_URL is correct.'
      );
    }

    // Initialize Event Listeners
    budgetListener.setLogger(fastify.log);
    budgetListener.initialize();
    notificationService.initialize();
    // Initialize background workers
    recurringExpenseWorker.start();
    budgetForecastWorker.start();
    outboxWorker.start(5000);
    cleanupSubscriptionsWorker.start();
    notificationCleanupWorker.start();
    // Initialize real-time Socket manager
    socketManagerInstance.logger = fastify.log; // update logger
    socketManagerInstance.initialize(fastify.server);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdown = async (signal: string) => {
  fastify.log.info(`Received ${signal} — starting graceful shutdown`);
  recurringExpenseWorker.stop();
  budgetForecastWorker.stop();
  outboxWorker.stop();
  cleanupSubscriptionsWorker.stop();
  notificationCleanupWorker.stop();
  socketManagerInstance.getIO()?.close();

  await fastify.close(); // stops accepting new requests, drains in-flight
  await syncWorker.close(); // let running BullMQ jobs finish
  await syncQueue.close(); // close queue connection
  await Sentry.flush(2000); // flush pending Sentry events

  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  Sentry.captureException(reason);
  fastify.log.error({ reason, promise }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (err) => {
  Sentry.captureException(err);
  fastify.log.fatal(err, 'Uncaught Exception — shutting down');
  process.exit(1);
});

start();
