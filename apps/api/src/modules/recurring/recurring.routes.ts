import { FastifyInstance } from 'fastify';
import { recurringController } from './recurring.controller.js';

export async function recurringRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.get('/insights', recurringController.getInsights.bind(recurringController));
  fastify.post('/', recurringController.create.bind(recurringController));
  fastify.get('/', recurringController.list.bind(recurringController));
  fastify.get('/:id', recurringController.get.bind(recurringController));
  fastify.patch('/:id', recurringController.update.bind(recurringController));
  fastify.delete('/:id', recurringController.delete.bind(recurringController));
}
