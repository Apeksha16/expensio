import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/auth/sync',
    {
      preHandler: [fastify.authenticate],
    },
    authController.syncProfile
  );
}
