import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';

export async function authRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/auth/me',
    {
      preHandler: [fastify.authenticate],
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
    },
    authController.getMe.bind(authController)
  );

  fastify.post(
    '/api/v1/auth/sync',
    {
      preHandler: [fastify.authenticate],
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    authController.getMe.bind(authController)
  );
}
