import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/auth/me',
    {
      preHandler: [fastify.authenticate],
    },
    authController.getMe.bind(authController)
  );

  fastify.post(
    '/api/v1/auth/sync',
    {
      preHandler: [fastify.authenticate],
    },
    authController.getMe.bind(authController)
  );
}
