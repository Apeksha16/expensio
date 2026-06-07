import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../../db/index.js';
import { expenses, budgets, splits } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { eventBus } from '../../utils/event.bus.js';

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

export const bulkSync = async (request: FastifyRequest, reply: FastifyReply) => {
  const { mutations } = request.body as { mutations: any[] };
  const user = (request as any).user;

  if (!mutations || !Array.isArray(mutations)) {
    return reply.code(400).send({ success: false, message: 'Invalid payload' });
  }

  let processedCount = 0;
  let failedCount = 0;
  const results: { id: string; status: 'success' | 'failed'; error?: string }[] = [];

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
          // 1. Insert the main expense
          await tx
            .insert(expenses)
            .values({
              id: mut.id, // We trust the client generated UUID
              userId: user.id,
              amount: payload.amount,
              currency: payload.currency || 'USD',
              description: payload.description,
              category: payload.categoryId,
              accountId: payload.accountId,
              date: new Date(payload.date),
              isSplit: hasSplits,
            })
            .onConflictDoNothing(); // Basic conflict resolution: if ID exists, skip

          // 2. Insert splits if present
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
          userId: user.id,
          amount: payload.amount,
          categoryId: payload.categoryId,
          date: new Date(payload.date),
        });
        processedCount++;
        results.push({ id: mut.id, status: 'success' });
      } else if (mut.type === 'CREATE_BUDGET') {
        const payload = mut.payload;
        await db
          .insert(budgets)
          .values({
            id: mut.id,
            userId: user.id,
            categoryId: payload.categoryId,
            amount: payload.amount,
            period: payload.period,
            startDate: new Date(payload.startDate),
            endDate: new Date(payload.endDate),
          })
          .onConflictDoNothing();
        processedCount++;
        results.push({ id: mut.id, status: 'success' });
      }
      // Add more handlers (update, delete) as needed
    } catch (e: any) {
      console.error(`Failed to process mutation ${mut.id}`, e);
      failedCount++;
      results.push({ id: mut.id, status: 'failed', error: e.message || 'Unknown error' });
    }
  }

  return reply.send({ success: true, processed: processedCount, failed: failedCount, results });
};
