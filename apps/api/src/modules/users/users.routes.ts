import { FastifyInstance } from 'fastify';
import { usersController } from './users.controller.js';

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/users/me',
    {
      preHandler: [fastify.authenticate],
    },
    usersController.getMe.bind(usersController)
  );

  fastify.put(
    '/api/v1/users/me',
    {
      preHandler: [fastify.authenticate],
    },
    usersController.updateMe.bind(usersController)
  );

  fastify.put(
    '/api/v1/users/mpin',
    {
      preHandler: [fastify.authenticate],
    },
    usersController.updateMpin.bind(usersController)
  );

  fastify.post(
    '/api/v1/users/onboarding',
    {
      preHandler: [fastify.authenticate],
    },
    usersController.completeOnboarding.bind(usersController)
  );
}
