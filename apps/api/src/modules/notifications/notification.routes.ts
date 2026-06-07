import { FastifyInstance } from 'fastify';
import { notificationController } from './notification.controller.js';
import { paginationQuerySchema, notificationIdParamSchema } from './notification.schema.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get<{ Querystring: { page?: number; limit?: number } }>(
    '/api/v1/notifications',
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: paginationQuerySchema,
      },
    },
    notificationController.getNotifications.bind(notificationController)
  );

  fastify.get(
    '/api/v1/notifications/unread-count',
    {
      onRequest: [fastify.authenticate],
    },
    notificationController.getUnreadCount.bind(notificationController)
  );

  fastify.put<{ Params: { id: string } }>(
    '/api/v1/notifications/:id/read',
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: notificationIdParamSchema,
      },
    },
    notificationController.markAsRead.bind(notificationController)
  );

  fastify.put(
    '/api/v1/notifications/read-all',
    {
      onRequest: [fastify.authenticate],
    },
    notificationController.markAllAsRead.bind(notificationController)
  );
}
