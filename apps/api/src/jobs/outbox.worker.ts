import { db } from '../db/index.js';
import { outboxEvents } from '../db/schema.js';
import { eq, asc, inArray } from 'drizzle-orm';
import { eventBus, EventKey, BackendEventPayloads } from '../utils/event.bus.js';

export class OutboxWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(intervalMs = 5000) {
    // Default 5 seconds
    if (this.timer) return;

    console.log('[OutboxWorker] Started polling for pending events...');
    this.processOutbox().catch((err) => console.error(err));
    this.timer = setInterval(() => {
      this.processOutbox().catch((err) => console.error(err));
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[OutboxWorker] Stopped.');
  }

  private async processOutbox() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      let hasMore = true;
      while (hasMore) {
        const pendingEvents = await db.transaction(async (tx) => {
          const events = await tx
            .select()
            .from(outboxEvents)
            .where(eq(outboxEvents.status, 'pending'))
            .orderBy(asc(outboxEvents.createdAt))
            .limit(50)
            .for('update', { skipLocked: true });

          if (events.length > 0) {
            // Mark as processed to lock them from other concurrent workers
            const ids = events.map((e) => e.id);
            await tx
              .update(outboxEvents)
              .set({ status: 'processed', processedAt: new Date() })
              .where(inArray(outboxEvents.id, ids));
          }
          return events;
        });

        if (pendingEvents.length === 0) {
          hasMore = false;
          continue;
        }

        // Now process them and publish
        for (const eventRow of pendingEvents) {
          try {
            const eventType = eventRow.eventType as EventKey;
            const payload = eventRow.payload as unknown as BackendEventPayloads[typeof eventType];

            // Publish synchronously, waiting for all handlers to succeed
            await eventBus.publish(eventType, payload);

            // Once published successfully, mark as processed (or delete)
            await db.delete(outboxEvents).where(eq(outboxEvents.id, eventRow.id));
          } catch (err: any) {
            console.error(`[OutboxWorker] Failed to process event ${eventRow.id}`, err);

            const nextRetryCount = eventRow.retryCount + 1;
            const nextStatus = nextRetryCount >= 3 ? 'failed' : 'pending';

            await db
              .update(outboxEvents)
              .set({
                status: nextStatus,
                retryCount: nextRetryCount,
                lastError: err.message || 'Unknown error',
              })
              .where(eq(outboxEvents.id, eventRow.id));
          }
        }
      }
    } finally {
      this.isRunning = false;
    }
  }
}

export const outboxWorker = new OutboxWorker();
