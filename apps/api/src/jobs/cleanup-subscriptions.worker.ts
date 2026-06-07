import { db } from '../db/index.js';
import { pushSubscriptions } from '../db/schema.js';
import { lt } from 'drizzle-orm';

export class CleanupSubscriptionsWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(intervalMs = 24 * 60 * 60 * 1000) {
    // Default 24 hours
    if (this.timer) return;

    console.log('[CleanupSubscriptionsWorker] Started daily stale subscription cleanup...');
    this.cleanup().catch((err) => console.error(err));
    this.timer = setInterval(() => {
      this.cleanup().catch((err) => console.error(err));
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[CleanupSubscriptionsWorker] Stopped.');
  }

  private async cleanup() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // 90 days threshold
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const deleted = await db
        .delete(pushSubscriptions)
        .where(lt(pushSubscriptions.updatedAt, cutoffDate))
        .returning({ id: pushSubscriptions.id });

      if (deleted.length > 0) {
        console.log(
          `[CleanupSubscriptionsWorker] Cleaned up ${deleted.length} stale subscriptions (older than 90 days).`
        );
      }
    } catch (err) {
      console.error('[CleanupSubscriptionsWorker] Error running cleanup:', err);
    } finally {
      this.isRunning = false;
    }
  }
}

export const cleanupSubscriptionsWorker = new CleanupSubscriptionsWorker();
