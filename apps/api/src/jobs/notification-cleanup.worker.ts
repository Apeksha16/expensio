import { db } from '../db/index.js';
import { notifications } from '../db/schema.js';
import { eq, and, lt } from 'drizzle-orm';

export class NotificationCleanupWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    console.log('[NotificationCleanupWorker] Starting daily cleanup...');
    // Run once initially, then every 24 hours
    this.processCleanup().catch((err) => console.error(err));
    this.timer = setInterval(
      () => {
        this.processCleanup().catch((err) => console.error(err));
      },
      24 * 60 * 60 * 1000
    ); // 24 hours
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[NotificationCleanupWorker] Stopped.');
  }

  async processCleanup() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      console.log('[NotificationCleanupWorker] Running cleanup...');

      const retentionDays = 30;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await db
        .delete(notifications)
        .where(and(eq(notifications.isRead, true), lt(notifications.createdAt, cutoffDate)));

      console.log(`[NotificationCleanupWorker] Cleanup complete. Deleted old read notifications.`);
    } catch (err) {
      console.error('[NotificationCleanupWorker] Error during cleanup', err);
    } finally {
      this.isRunning = false;
    }
  }
}

export const notificationCleanupWorker = new NotificationCleanupWorker();
