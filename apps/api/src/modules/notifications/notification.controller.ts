import { FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from './notification.service.js';

export class NotificationController {
  async getNotifications(
    request: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>,
    reply: FastifyReply
  ) {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const page = request.query.page || 1;
    const limit = request.query.limit || 20;
    const offset = (page - 1) * limit;

    const notifications = await notificationService.getUserNotifications(userId, limit, offset);
    return reply.send({ notifications });
  }

  async getUnreadCount(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const count = await notificationService.getUnreadCount(userId);
    return reply.send({ count });
  }

  async markAsRead(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const notificationId = request.params.id;
    const updated = await notificationService.markAsRead(userId, notificationId);

    if (!updated) {
      return reply.status(404).send({ error: 'Notification not found' });
    }

    return reply.send({ success: true, notification: updated });
  }

  async markAllAsRead(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user?.id;
    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    await notificationService.markAllAsRead(userId);
    return reply.send({ success: true });
  }
}

export const notificationController = new NotificationController();
