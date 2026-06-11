import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../../config/env.js';
import { db } from '../../db/index.js';
import { expenses, budgets, splits } from '../../db/schema.js';
import { eventBus } from '../../utils/event.bus.js';
import crypto from 'crypto';

const redisConnection = new Redis(env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

function computeSplits(
  amount: number,
  splitWith?: string[],
  splitType: 'equal' | 'percentage' = 'equal',
  splitPercentages?: Record<string, number>
) {
  if (!splitWith || splitWith.length === 0) return [];
  const totalPeople = splitWith.length + 1;
  if (splitType === 'percentage' && splitPercentages) {
    return splitWith.map((uId) => {
      const pct = splitPercentages[uId] ?? 0;
      return {
        userId: uId,
        amount: parseFloat(((amount * pct) / 100).toFixed(2)),
        percentage: pct,
      };
    });
  }
  const shareAmount = parseFloat((amount / totalPeople).toFixed(2));
  const equalPct = parseFloat((100 / totalPeople).toFixed(2));
  return splitWith.map((uId) => ({
    userId: uId,
    amount: shareAmount,
    percentage: equalPct,
  }));
}

import * as Sentry from '@sentry/node';

export const syncWorker = new Worker(
  'bulk-sync',
  async (job: Job) => {
    const startTime = performance.now();
    try {
      const { userId, mutations } = job.data;
      for (const mut of mutations) {
        try {
          if (mut.type === 'CREATE_EXPENSE') {
            const payload = mut.payload;
            const splitData = computeSplits(
              payload.amount,
              payload.splitWith,
              payload.splitType,
              payload.splitPercentages
            );
            const hasSplits = splitData.length > 0;

            await db.transaction(async (tx) => {
              await tx
                .insert(expenses)
                .values({
                  id: mut.id,
                  userId,
                  amount: payload.amount,
                  currency: payload.currency || 'USD',
                  description: payload.description,
                  category: payload.categoryId,
                  accountId: payload.accountId,
                  date: new Date(payload.date),
                  isSplit: hasSplits,
                })
                .onConflictDoNothing();

              if (hasSplits) {
                const splitsToInsert = splitData.map((s) => ({
                  id: crypto.randomUUID(),
                  expenseId: mut.id,
                  userId: s.userId,
                  amount: s.amount,
                  percentage: s.percentage,
                  status: 'pending' as const,
                }));
                await tx.insert(splits).values(splitsToInsert).onConflictDoNothing();
              }
            });

            eventBus.publish('expense.created', {
              expenseId: mut.id,
              userId,
              amount: payload.amount,
              categoryId: payload.categoryId,
              date: new Date(payload.date),
            });
          } else if (mut.type === 'CREATE_BUDGET') {
            await db
              .insert(budgets)
              .values({
                id: mut.id,
                userId,
                categoryId: mut.payload.categoryId,
                amount: mut.payload.amount,
                period: mut.payload.period,
                startDate: new Date(mut.payload.startDate),
                endDate: new Date(mut.payload.endDate),
              })
              .onConflictDoNothing();
          }
        } catch (e: any) {
          console.error(`Failed to process mutation ${mut.id}`, e);
          throw e;
        }
      }
    } finally {
      const durationMs = performance.now() - startTime;
      console.log(`[BullMQ] Job ${job.id} internal execution took ${durationMs.toFixed(2)}ms`);
    }
  },
  {
    connection: redisConnection as any,
    concurrency: 5,
    limiter: { max: 100, duration: 1000 },
  }
);

syncWorker.on('completed', (job, result) => {
  const duration = Date.now() - job.timestamp;
  console.log(
    `[BullMQ] Job ${job.id} completed in ${duration}ms | mutations: ${job.data.mutations.length}`
  );
  if (duration > 5000) {
    Sentry.captureMessage(`Slow BullMQ job: ${job.id}`, {
      level: 'warning',
      extra: { duration, userId: job.data.userId, mutationCount: job.data.mutations.length },
    });
  }
});

syncWorker.on('failed', (job, err) => {
  Sentry.captureException(err, {
    extra: { jobId: job?.id, userId: job?.data?.userId, attempt: job?.attemptsMade },
  });
  console.error(`[BullMQ] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
});

syncWorker.on('stalled', (jobId) => {
  Sentry.captureMessage(`BullMQ job stalled: ${jobId}`, { level: 'warning' });
});
