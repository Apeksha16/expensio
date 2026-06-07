import { EventEmitter } from 'events';
import { FastifyBaseLogger } from 'fastify';

// Internal backend event payloads
export interface BackendEventPayloads {
  'expense.created': {
    expenseId: string;
    userId: string;
    categoryId: string;
    amount: number;
    date: Date;
  };
  'expense.updated': {
    expenseId: string;
    userId: string;
    categoryId: string;
    amount: number;
    date: Date;
    previousAmount?: number;
  };
  'expense.deleted': {
    expenseId: string;
    userId: string;
    categoryId: string;
    amount: number;
    date: Date;
  };

  'budget.created': { budgetId: string; userId: string; categoryId: string; amount: number };
  'budget.updated': {
    budgetId: string;
    userId: string;
    categoryId: string;
    amount: number;
    delta: number;
  };
  'budget.deleted': { budgetId: string; userId: string; categoryId: string };

  'budget.threshold.crossed': {
    budgetId: string;
    userId: string;
    categoryId: string;
    utilization: number;
    threshold: number;
  };
  'budget.exceeded': {
    budgetId: string;
    userId: string;
    categoryId: string;
    spent: number;
    limit: number;
  };
  'budget.warning': {
    budgetId: string;
    userId: string;
    categoryId: string;
    spent: number;
    limit: number;
    projectedSpend: number;
  };

  'recurring_expense.generated': {
    expenseId: string;
    userId: string;
    amount: number;
    description: string;
    currency: string;
    date: Date;
    categoryId: string;
  };
}

export type EventKey = keyof BackendEventPayloads;

class EventBus extends EventEmitter {
  private logger?: FastifyBaseLogger;

  setLogger(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  async publish<K extends EventKey>(event: K, payload: BackendEventPayloads[K]): Promise<void> {
    if (this.logger) {
      this.logger.debug(`[EventBus] Emitting ${event} for user ${payload.userId}`);
    }

    // Instead of setImmediate which drops errors, we await all listeners.
    // This allows outbox worker to know if handlers succeeded or failed.
    const listeners = this.listeners(event) as ((
      payload: BackendEventPayloads[K]
    ) => Promise<void> | void)[];

    if (listeners.length === 0) return;

    const results = await Promise.allSettled(
      listeners.map(async (listener) => {
        await listener(payload);
      })
    );

    // If any listener rejected, we throw so the outbox worker can retry
    const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (failures.length > 0) {
      const msgs = failures.map((f) => (f.reason as Error)?.message || String(f.reason)).join('; ');
      throw new Error(`Event ${event} had listener failures: ${msgs}`);
    }
  }

  subscribe<K extends EventKey>(
    event: K,
    handler: (payload: BackendEventPayloads[K]) => Promise<void> | void
  ): void {
    // Note: We register the raw handler so publish() can await it directly.
    this.on(event, handler);
  }
}

export const eventBus = new EventBus();
