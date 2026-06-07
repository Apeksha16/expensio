import { FastifyInstance } from 'fastify';
import { dashboardController } from './dashboard.controller.js';

export async function dashboardRoutes(fastify: FastifyInstance) {
  const auth = { preHandler: [fastify.authenticate] };

  /** GET /api/v1/dashboard/summary — retrieve dashboard aggregates */
  fastify.get('/api/v1/dashboard/summary', auth, (req, reply) =>
    dashboardController.getSummary(req, reply)
  );
}
