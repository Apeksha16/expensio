import { FastifyInstance } from 'fastify';
import { friendsController } from './friends.controller.js';

export async function friendsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/', friendsController.getFriends.bind(friendsController));
  fastify.get('/requests', friendsController.getPendingRequests.bind(friendsController));
  fastify.post('/requests', friendsController.sendRequest.bind(friendsController));
  fastify.patch('/requests/:id', friendsController.respondToRequest.bind(friendsController));
}
