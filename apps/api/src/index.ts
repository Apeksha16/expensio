import Fastify from 'fastify';
import cors from '@fastify/cors';
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';
import { healthRoutes } from './routes/health.js';
import { SocketManager } from './sockets/socket.manager.js';
import { env } from './config/env.js';
import authPlugin from './plugins/auth.plugin.js';
import errorHandlerPlugin from './plugins/error-handler.plugin.js';
import { authRoutes } from './modules/auth/index.js';
import { usersRoutes } from './modules/users/index.js';
import { expensesRoutes } from './modules/expenses/index.js';

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

fastify.log.info('BullMQ queue processing is disabled for now.');

// Register CORS
fastify.register(cors, {
  origin: env.FRONTEND_URL,
});

// Register Error Handler Plugin
fastify.register(errorHandlerPlugin);

// Register Auth Plugin
fastify.register(authPlugin);

// Register Modular Routes
fastify.register(healthRoutes);
fastify.register(authRoutes);
fastify.register(usersRoutes);
fastify.register(expensesRoutes);

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
      fastify.log.warn(
        'Booting server anyway. Ensure PostgreSQL is running and DATABASE_URL is correct.'
      );
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
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
