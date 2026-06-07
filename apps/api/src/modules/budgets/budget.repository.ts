import { db } from '../../db/index.js';
import { budgets, expenses, splits, outboxEvents } from '../../db/schema.js';
import { eq, and, gte, lte, sum, sql, isNull, inArray } from 'drizzle-orm';
import { expensesRepository } from '../expenses/expenses.repository.js';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

export class BudgetRepository {
  /**
   * Create a new budget
   */
  async createBudget(
    userId: string,
    data: {
      categoryId: string;
      amount: number;
      period: 'monthly' | 'yearly';
      startDate: Date;
      endDate: Date;
      isRolloverEnabled?: boolean;
      alertThreshold?: number;
    }
  ) {
    const id = `bud_${nanoid(12)}`;
    const [newBudget] = await db
      .insert(budgets)
      .values({
        id,
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate,
        endDate: data.endDate,
        isRolloverEnabled: data.isRolloverEnabled ?? false,
        alertThreshold: data.alertThreshold ?? 80,
      })
      .returning();
    return newBudget;
  }

  /**
   * Find a budget by ID and userId
   */
  async getBudgetById(userId: string, id: string) {
    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .limit(1);
    return budget || null;
  }

  /**
   * Find many budgets for user with optional filters
   */
  async getBudgets(
    userId: string,
    filters: { period?: 'monthly' | 'yearly'; categoryId?: string } = {}
  ) {
    const conditions = [eq(budgets.userId, userId)];

    if (filters.period) {
      conditions.push(eq(budgets.period, filters.period));
    }
    if (filters.categoryId) {
      conditions.push(eq(budgets.categoryId, filters.categoryId));
    }

    return db
      .select()
      .from(budgets)
      .where(and(...conditions));
  }

  /**
   * Update a budget
   */
  async updateBudget(
    userId: string,
    id: string,
    data: {
      amount?: number;
      period?: 'monthly' | 'yearly';
      startDate?: Date;
      endDate?: Date;
      isRolloverEnabled?: boolean;
      alertThreshold?: number;
    }
  ) {
    const [updatedBudget] = await db
      .update(budgets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();

    if (updatedBudget) {
      // NOTE: delta requires the old amount, which we will calculate in the service and trigger there, or emit directly here if we had it.
      // But the repository does not fetch old amount natively in update. We'll leave `budget.updated` outbox dispatching to the service layer wrapping it in a tx, OR we can fetch old here.
      // Wait, `budget.service.ts` fetches existing before calling update!
    }

    return updatedBudget || null;
  }

  /**
   * Delete a budget
   */
  async deleteBudget(userId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();
    return result.length > 0;
  }

  /**
   * Checks if an active budget exists for a category and date range overlap.
   */
  async budgetExistsForRange(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date,
    excludeBudgetId?: string
  ): Promise<boolean> {
    const conditions = [
      eq(budgets.userId, userId),
      eq(budgets.categoryId, categoryId),
      lte(budgets.startDate, endDate),
      gte(budgets.endDate, startDate),
    ];

    if (excludeBudgetId) {
      conditions.push(sql`${budgets.id} != ${excludeBudgetId}`);
    }

    const existing = await db
      .select({ id: budgets.id })
      .from(budgets)
      .where(and(...conditions))
      .limit(1);

    return existing.length > 0;
  }

  /**
   * Calculate category net spending in a range using split offsets.
   */
  async calculateNetSpent(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    return expensesRepository.calculateSplitAdjustedNetSpent(
      userId,
      categoryId,
      startDate,
      endDate
    );
  }

  /**
   * Calculate category net spending in bulk for a date range to avoid N+1 queries.
   */
  async calculateBulkNetSpent(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    return expensesRepository.calculateBulkSplitAdjustedNetSpent(userId, startDate, endDate);
  }

  /**
   * Calculate budget summary indicators (spent, percentage, rollover, status).
   */
  async calculateBudgetSummary(userId: string, budgetId: string) {
    const budget = await this.getBudgetById(userId, budgetId);
    if (!budget) {
      throw new Error('Budget not found');
    }

    const netSpent = await this.calculateNetSpent(
      userId,
      budget.categoryId,
      budget.startDate,
      budget.endDate
    );

    const remaining = Number((budget.amount - netSpent).toFixed(2));
    const percentageUsed =
      budget.amount > 0 ? Number(((netSpent / budget.amount) * 100).toFixed(2)) : 0;

    let status: 'under' | 'warning' | 'over' = 'under';
    if (netSpent > budget.amount) {
      status = 'over';
    } else if (netSpent >= budget.amount * (budget.alertThreshold / 100)) {
      status = 'warning';
    }

    let rolloverAmount = 0;
    if (budget.isRolloverEnabled && budget.endDate < new Date()) {
      rolloverAmount = Math.max(0, budget.amount - netSpent);
    }

    return {
      budget,
      limitAmount: budget.amount,
      netSpent,
      remaining,
      percentageUsed,
      status,
      rolloverAmount,
    };
  }

  // --- Backward Compatibility Aliases ---
  async create(userId: string, data: any) {
    return this.createBudget(userId, data);
  }
  async findById(userId: string, id: string) {
    return this.getBudgetById(userId, id);
  }
  async findMany(userId: string, filters: any = {}) {
    return this.getBudgets(userId, filters);
  }
  async update(userId: string, id: string, data: any) {
    return this.updateBudget(userId, id, data);
  }
  async delete(userId: string, id: string) {
    return this.deleteBudget(userId, id);
  }
  async calculateCategoryExpenses(userId: string, categoryId: string, start: Date, end: Date) {
    return this.calculateNetSpent(userId, categoryId, start, end);
  }
}

export const budgetRepository = new BudgetRepository();
