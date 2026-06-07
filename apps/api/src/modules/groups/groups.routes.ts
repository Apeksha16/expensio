import { FastifyInstance } from 'fastify';
import { groupsController } from './groups.controller.js';

export async function groupsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/', groupsController.getGroups.bind(groupsController));
  fastify.post('/', groupsController.createGroup.bind(groupsController));
  fastify.post('/:id/members', groupsController.addMember.bind(groupsController));
  fastify.delete('/:id/members/:userId', groupsController.removeMember.bind(groupsController));
}
