import { eventBus } from '../../utils/event.bus.js';
import { notificationRepository } from './notification.repository.js';
import { socketManagerInstance } from '../../sockets/socket.manager.js';
import { pushService } from '../push/push.service.js';

export class NotificationService {
  initialize() {
    eventBus.subscribe('budget.threshold.crossed', async (payload) => {
      const title = 'Budget Warning';
      const body = `Your ${payload.categoryId} budget is ${payload.utilization}% consumed.`;

      const notif = await notificationRepository.createNotification(
        payload.userId,
        'budget_threshold',
        title,
        body
      );

      if (!notif) return; // Suppress duplicate

      socketManagerInstance.emitToUser(payload.userId, 'budget.threshold.crossed', {
        ...payload,
        message: body,
      });

      socketManagerInstance.emitToUser(payload.userId, 'notification.new', notif);
      await pushService.sendNotificationToUser(payload.userId, { title, body, url: '/budgets' });
    });

    // Handle budget forecasting warnings
    eventBus.subscribe('budget.warning', async (payload) => {
      const title = 'Budget Forecast Warning';
      const body = `You are projected to spend ₹${payload.projectedSpend} on ${payload.categoryId}, exceeding your limit of ₹${payload.limit}.`;

      const notif = await notificationRepository.createNotification(
        payload.userId,
        'budget_alert',
        title,
        body
      );

      if (!notif) return; // Suppress duplicate

      socketManagerInstance.emitToUser(payload.userId, 'budget.warning', {
        ...payload,
        message: body,
      });

      socketManagerInstance.emitToUser(payload.userId, 'notification.new', notif);
      await pushService.sendNotificationToUser(payload.userId, { title, body, url: '/budgets' });
    });

    eventBus.subscribe('budget.exceeded', async (payload) => {
      const title = 'Budget Exceeded';
      const excess = payload.spent - payload.limit;
      const body = `Your ${payload.categoryId} budget is exceeded by ₹${excess.toFixed(2)}.`;

      const notif = await notificationRepository.createNotification(
        payload.userId,
        'budget_exceeded',
        title,
        body
      );

      if (!notif) return; // Suppress duplicate

      socketManagerInstance.emitToUser(payload.userId, 'budget.exceeded', {
        ...payload,
        message: body,
      });

      socketManagerInstance.emitToUser(payload.userId, 'notification.new', notif);
      await pushService.sendNotificationToUser(payload.userId, { title, body, url: '/budgets' });
    });

    eventBus.subscribe('recurring_expense.generated', async (payload) => {
      const title = 'Recurring Expense Processed';
      const body = `Your recurring ${payload.description} of ${payload.currency} ${payload.amount} has been automatically processed.`;

      const notif = await notificationRepository.createNotification(
        payload.userId,
        'recurring_expense',
        title,
        body
      );

      if (!notif) return; // Suppress duplicate

      socketManagerInstance.emitToUser(payload.userId, 'recurring_expense.generated', {
        ...payload,
        message: body,
      });

      socketManagerInstance.emitToUser(payload.userId, 'notification.new', notif);
      await pushService.sendNotificationToUser(payload.userId, { title, body, url: '/expenses' });
    });
  }

  async getUserNotifications(userId: string, limit: number, offset: number) {
    return await notificationRepository.getUserNotifications(userId, limit, offset);
  }

  async getUnreadCount(userId: string) {
    return await notificationRepository.getUnreadCount(userId);
  }

  async markAsRead(userId: string, notificationId: string) {
    return await notificationRepository.markAsRead(userId, notificationId);
  }

  async markAllAsRead(userId: string) {
    return await notificationRepository.markAllAsRead(userId);
  }
}

export const notificationService = new NotificationService();
