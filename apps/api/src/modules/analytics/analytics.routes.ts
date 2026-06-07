import { FastifyInstance } from 'fastify';
import { analyticsController } from './analytics.controller.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [fastify.authenticate] };

  /** GET /api/v1/analytics/summary — retrieve user finance statistics */
  fastify.get('/api/v1/analytics/summary', auth, (req, reply) =>
    analyticsController.getSummary(req, reply)
  );

  /** GET /api/v1/analytics/health — retrieve financial health score */
  fastify.get('/api/v1/analytics/health', auth, (req, reply) =>
    analyticsController.getHealthScore(req, reply)
  );
}
