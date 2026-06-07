import { db } from '../../db/index.js';
import { notifications } from '../../db/schema.js';
import { nanoid } from 'nanoid';
import { eq, and, count, desc } from 'drizzle-orm';

export class NotificationRepository {
  async createNotification(userId: string, type: string, title: string, body: string) {
    // Basic idempotency: check if identical notification was sent in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, type),
          eq(notifications.title, title),
          eq(notifications.body, body)
        )
      )
      .limit(1);

    const isDuplicate =
      existing.length > 0 && new Date(existing[0].createdAt).getTime() > oneHourAgo.getTime();
    if (isDuplicate) {
      console.log(
        `[NotificationRepository] Suppressed duplicate notification for user ${userId}: ${title}`
      );
      return null;
    }

    const id = `notif_${nanoid(10)}`;
    const [inserted] = await db
      .insert(notifications)
      .values({
        id,
        userId,
        type,
        title,
        body,
        isRead: false,
      })
      .returning();
    return inserted;
  }

  async getUserNotifications(userId: string, limit: number, offset: number) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getUnreadCount(userId: string) {
    const [result] = await db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result.value;
  }

  async markAsRead(userId: string, notificationId: string) {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning();
    return updated;
  }

  async markAllAsRead(userId: string) {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  }
}

export const notificationRepository = new NotificationRepository();
