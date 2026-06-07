import { db } from '../../db/index.js';
import { pushSubscriptions } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import webpush from 'web-push';
import { nanoid } from 'nanoid';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushService {
  constructor() {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys are missing. Web Push will not function properly.');
    } else {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:support@expensio.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  async saveSubscription(userId: string, subscription: PushSubscriptionData) {
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1);

    if (existing.length > 0) {
      if (existing[0].userId !== userId) {
        // Endpoint transferred to another user
        await db
          .update(pushSubscriptions)
          .set({ userId, updatedAt: new Date() })
          .where(eq(pushSubscriptions.id, existing[0].id));
      }
      return existing[0];
    }

    const [newSub] = await db
      .insert(pushSubscriptions)
      .values({
        id: `psub_${nanoid(12)}`,
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      })
      .returning();

    return newSub;
  }

  async removeSubscription(userId: string, endpoint: string) {
    await db
      .delete(pushSubscriptions)
      .where(and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint)));
  }

  async sendNotificationToUser(
    userId: string,
    payload: { title: string; body: string; url?: string }
  ) {
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    const promises = subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, JSON.stringify(payload));
      } catch (error: any) {
        if (error.statusCode === 404 || error.statusCode === 410) {
          // Subscription has expired or is no longer valid
          console.info(`Deleting expired subscription for user ${userId}`);
          await this.removeSubscription(userId, sub.endpoint);
        } else if (
          error.statusCode === 429 ||
          error.statusCode === 503 ||
          error.statusCode >= 500
        ) {
          // Rate limited or server error -> throw to trigger outbox retry
          console.error(`Transient error sending push notification: ${error.message}. Will retry.`);
          throw error;
        } else {
          console.error(`Error sending push notification: ${error.message}`);
        }
      }
    });

    await Promise.all(promises);
  }
}

export const pushService = new PushService();
