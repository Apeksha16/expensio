import { FastifyPluginAsync } from 'fastify';
import { pushController } from './push.controller.js';

export const pushRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', fastify.authenticate);

  fastify.post('/subscribe', pushController.subscribe.bind(pushController));
  fastify.post('/unsubscribe', pushController.unsubscribe.bind(pushController));
};
