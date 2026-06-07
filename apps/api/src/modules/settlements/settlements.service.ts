import { db } from '../../db/index.js';
import { settlements } from '../../db/schema.js';
import { nanoid } from 'nanoid';
import { AppError } from '../../utils/errors.js';
import { eq, or, and } from 'drizzle-orm';

export class SettlementsService {
  async settleUp(payerId: string, receiverId: string, amount: number) {
    if (amount <= 0) throw new AppError(400, 'Amount must be greater than 0');

    const [settlement] = await db
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

    return settlement;
  }

  async getSettlements(userId: string) {
    return db
      .select()
      .from(settlements)
      .where(or(eq(settlements.payerId, userId), eq(settlements.receiverId, userId)));
  }
}

export const settlementsService = new SettlementsService();
