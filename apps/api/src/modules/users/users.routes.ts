import { FastifyInstance } from 'fastify';
import { usersController } from './users.controller.js';

export async function usersRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/users/me',
    {
      preHandler: [fastify.authenticate],
    },
    usersController.getMe.bind(usersController)
  );

  fastify.put(
    '/users/me',
    {
      preHandler: [fastify.authenticate],
    },
    usersController.updateMe.bind(usersController)
  );
}
