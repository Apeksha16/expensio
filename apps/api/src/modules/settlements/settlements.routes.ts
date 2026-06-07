import { FastifyInstance } from 'fastify';
import { settlementsController } from './settlements.controller.js';

export async function settlementsRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/', settlementsController.settleUp.bind(settlementsController));
  fastify.get('/', settlementsController.getSettlements.bind(settlementsController));
}
