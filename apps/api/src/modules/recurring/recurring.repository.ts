import { db } from '../../db/index.js';
import { recurringExpenses, expenses, outboxEvents } from '../../db/schema.js';
import { eq, and, lte, asc, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export type CreateRecurringInput = typeof recurringExpenses.$inferInsert;
export type UpdateRecurringInput = Partial<CreateRecurringInput>;

export class RecurringRepository {
  async create(data: CreateRecurringInput) {
    const [inserted] = await db.insert(recurringExpenses).values(data).returning();
    return inserted;
  }

  async findById(id: string, userId: string) {
    const [recurring] = await db
      .select()
      .from(recurringExpenses)
      .where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId)))
      .limit(1);
    return recurring || null;
  }

  async findMany(userId: string) {
    return db
      .select()
      .from(recurringExpenses)
      .where(eq(recurringExpenses.userId, userId))
      .orderBy(asc(recurringExpenses.nextGenerationDate));
  }

  async update(id: string, userId: string, data: UpdateRecurringInput) {
    const [updated] = await db
      .update(recurringExpenses)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId)))
      .returning();
    return updated || null;
  }

  async delete(id: string, userId: string) {
    await db
      .delete(recurringExpenses)
      .where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId)));
  }

  /**
   * CRITICAL WORKER METHOD
   * Fetch pending recurring expenses and process them in a transaction using FOR UPDATE SKIP LOCKED
   * This guarantees horizontal scalability and atomic processing.
   */
  async processPendingExpenses(
    limit = 100
  ): Promise<{ processedIds: string[]; generatedExpenses: any[] }> {
    return db.transaction(async (tx) => {
      // 1. Lock rows to prevent other workers from processing them simultaneously
      const pending = await tx
        .select()
        .from(recurringExpenses)
        .where(
          and(
            eq(recurringExpenses.status, 'active'),
            lte(recurringExpenses.nextGenerationDate, new Date())
          )
        )
        .limit(limit)
        .for('update', { skipLocked: true });

      if (pending.length === 0) {
        return { processedIds: [], generatedExpenses: [] };
      }

      const generatedExpenses: any[] = [];
      const processedIds: string[] = [];

      // 2. Generate standard expenses and update their nextGenerationDate
      for (const recurring of pending) {
        const expenseId = nanoid();

        // Compute next date
        const nextDate = new Date(recurring.nextGenerationDate);
        switch (recurring.frequency) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        // Insert standard expense
        await tx.insert(expenses).values({
          id: expenseId,
          userId: recurring.userId,
          amount: recurring.amount,
          currency: recurring.currency,
          description: recurring.description || `Recurring: ${recurring.provider || 'Expense'}`,
          category: recurring.categoryId,
          accountId: recurring.accountId,
          date: recurring.nextGenerationDate,
          isSplit: false,
        });

        // Update recurring template
        // Check if endDate is reached
        let newStatus = recurring.status;
        if (recurring.endDate && nextDate > recurring.endDate) {
          newStatus = 'cancelled';
        }

        await tx
          .update(recurringExpenses)
          .set({
            lastGeneratedDate: new Date(),
            nextGenerationDate: nextDate,
            status: newStatus,
            updatedAt: new Date(),
          })
          .where(eq(recurringExpenses.id, recurring.id));

        const payload = {
          expenseId,
          userId: recurring.userId,
          amount: recurring.amount,
          description: recurring.description || recurring.provider || 'Recurring Expense',
          currency: recurring.currency,
          date: recurring.nextGenerationDate,
          categoryId: recurring.categoryId,
        };

        // Insert into outbox
        await tx.insert(outboxEvents).values([
          {
            id: nanoid(),
            eventType: 'recurring_expense.generated',
            payload,
            status: 'pending',
          },
          {
            id: nanoid(),
            eventType: 'expense.created',
            payload,
            status: 'pending',
          },
        ]);

        generatedExpenses.push(payload);
        processedIds.push(recurring.id);
      }

      return { processedIds, generatedExpenses };
    });
  }
}

export const recurringRepository = new RecurringRepository();
