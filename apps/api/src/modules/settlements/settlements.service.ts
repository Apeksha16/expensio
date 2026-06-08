import { db } from '../../db/index.js';
import { settlements, splits, expenses } from '../../db/schema.js';
import { nanoid } from 'nanoid';
import { AppError } from '../../utils/errors.js';
import { eq, or, and, inArray } from 'drizzle-orm';

export class SettlementsService {
  async settleUp(payerId: string, receiverId: string, amount: number) {
    if (amount <= 0) throw new AppError(400, 'Amount must be greater than 0');

    const result = await db.transaction(async (tx) => {
      // 1. Create settlement record
      const [settlement] = await tx
        .insert(settlements)
        .values({
          id: nanoid(),
          payerId,
          receiverId,
          amount,
          status: 'settled',
          settledAt: new Date(),
        })
        .returning();

      // 2. Fetch IDs of all mutual pending splits between these two users
      const mutualPendingSplits = await tx
        .select({ id: splits.id })
        .from(splits)
        .innerJoin(expenses, eq(splits.expenseId, expenses.id))
        .where(
          and(
            eq(splits.status, 'pending'),
            or(
              and(eq(expenses.userId, payerId), eq(splits.userId, receiverId)),
              and(eq(expenses.userId, receiverId), eq(splits.userId, payerId))
            )
          )
        );

      const splitIds = mutualPendingSplits.map((s) => s.id);

      // 3. Mark those splits as settled
      if (splitIds.length > 0) {
        await tx.update(splits).set({ status: 'settled' }).where(inArray(splits.id, splitIds));
      }

      return settlement;
    });

    return result;
  }

  async getSettlements(userId: string) {
    return db
      .select()
      .from(settlements)
      .where(or(eq(settlements.payerId, userId), eq(settlements.receiverId, userId)));
  }
}

export const settlementsService = new SettlementsService();
