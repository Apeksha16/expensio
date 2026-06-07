import { FastifyInstance } from 'fastify';
import { bulkSync } from './sync.controller.js';

export const syncRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/bulk', { preHandler: [fastify.authenticate] }, bulkSync);
};
