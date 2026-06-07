import { db } from '../../db/index.js';
import { users, expenses, budgets, splits } from '../../db/schema.js';
import { eq, and, gte, lte, sum, sql, desc } from 'drizzle-orm';
import { expensesRepository } from '../expenses/expenses.repository.js';
import { Expense } from '@expensio/types';

export class AnalyticsRepository {
  /**
   * Fetch the user's monthly salary
   */
  async getUserSalary(userId: string): Promise<number | null> {
    const [user] = await db
      .select({ monthlySalary: users.monthlySalary })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user ? user.monthlySalary : null;
  }

  /**
   * Sum total expenses for a user in a given date range
   */
  async getExpensesSum(userId: string, start: Date, end: Date): Promise<number> {
    const [result] = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), gte(expenses.date, start), lte(expenses.date, end)));
    return result?.total ? Number(result.total) : 0;
  }

  /**
   * Sum total expenses for a user for a specific exact month from aggregates
   */
  async getMonthlyExpensesSumAggregated(userId: string, monthStr: string): Promise<number> {
    const [year, month] = monthStr.split('-');
    const startDate = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const categoryTotals = await expensesRepository.calculateBulkSplitAdjustedNetSpent(
      userId,
      startDate,
      endDate
    );
    return Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  }

  /**
   * Retrieve category breakdown stats from aggregates for a specific exact month
   */
  async getCategoryBreakdownAggregated(
    userId: string,
    monthStr: string
  ): Promise<{ category: string; amount: number }[]> {
    const [year, month] = monthStr.split('-');
    const startDate = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0);
    const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

    const categoryTotals = await expensesRepository.calculateBulkSplitAdjustedNetSpent(
      userId,
      startDate,
      endDate
    );
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
    }));
  }

  /**
   * Retrieve category breakdown stats in a given date range
   */
  async getCategoryBreakdown(
    userId: string,
    start: Date,
    end: Date
  ): Promise<{ category: string; amount: number }[]> {
    const categoryTotals = await expensesRepository.calculateBulkSplitAdjustedNetSpent(
      userId,
      start,
      end
    );
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
    }));
  }

  /**
   * Retrieve aggregated expenses grouped by month in a specific date range
   */
  async getMonthlyAggregatesInRange(
    userId: string,
    start: Date,
    end: Date
  ): Promise<{ month: string; amount: number }[]> {
    const rows = await db
      .select({
        month: sql<string>`to_char(${expenses.date}, 'YYYY-MM')`,
        amount: sum(expenses.amount),
      })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), gte(expenses.date, start), lte(expenses.date, end)))
      .groupBy(sql`to_char(${expenses.date}, 'YYYY-MM')`);

    return rows.map((r) => ({
      month: r.month,
      amount: r.amount ? Number(r.amount) : 0,
    }));
  }

  /**
   * Fetch all budgets for a user
   */
  async getBudgets(userId: string) {
    return db.select().from(budgets).where(eq(budgets.userId, userId));
  }

  /**
   * Retrieve latest user expenses
   */
  async getRecentExpenses(userId: string, limit: number): Promise<Expense[]> {
    const rows = await db
      .select()
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .orderBy(desc(expenses.date), desc(expenses.createdAt))
      .limit(limit);

    // Map rows to match the shared types structure
    return rows.map((r) => ({
      ...r,
      note: r.description,
    })) as any;
  }

  /**
   * Count total expense transactions for the user
   */
  async getTotalTransactionCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(expenses)
      .where(eq(expenses.userId, userId));
    return result?.count || 0;
  }
}

export const analyticsRepository = new AnalyticsRepository();
