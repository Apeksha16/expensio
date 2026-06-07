import { budgetRepository } from './budget.repository.js';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import {
  BudgetNotFoundError,
  BudgetOverlapError,
  BudgetOwnershipError,
  BudgetValidationError,
} from './budget.errors.js';
import { BudgetSummary } from '@expensio/types';
import { eventBus } from '../../utils/event.bus.js';

// Predefined Expensio Categories matching standard list
const VALID_CATEGORIES = new Set([
  'Food',
  'Shopping',
  'Bills & Utilities',
  'Health',
  'Investments',
  'Entertainment',
  'Education',
  'Transport',
  'Credit Card',
  'Udhaari',
  'Rent',
  'Travel',
  'Gifts',
  'Others',
]);

import { outboxEvents } from '../../db/schema.js';
import crypto from 'crypto';

export class BudgetService {
  private eventDispatcher: { dispatch: (event: any, payload: any) => Promise<void> };

  constructor(
    eventDispatcher: { dispatch: (event: any, payload: any) => Promise<void> } = {
      dispatch: async (event, payload) => {
        await db.insert(outboxEvents).values({
          id: crypto.randomUUID(),
          eventType: event,
          payload,
          status: 'pending',
        });
      },
    }
  ) {
    this.eventDispatcher = eventDispatcher;
  }

  /**
   * Set custom event dispatcher for DI/testing
   */
  setEventDispatcher(dispatcher: { dispatch: (event: any, payload: any) => Promise<void> }) {
    this.eventDispatcher = dispatcher;
  }

  /**
   * Create a new budget and validate business constraints
   */
  async createBudget(
    userId: string,
    data: {
      categoryId: string;
      amount: number;
      period: 'monthly' | 'yearly';
      startDate: string;
      endDate: string;
      isRolloverEnabled?: boolean;
      alertThreshold?: number; // expected as ratio e.g. 0.8
    }
  ) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const alertThreshold = data.alertThreshold ?? 0.8;

    // 1. Basic Validations
    if (data.amount <= 0) {
      throw new BudgetValidationError('Budget amount must be greater than zero.', 'amount');
    }
    if (!VALID_CATEGORIES.has(data.categoryId)) {
      throw new BudgetValidationError(
        `Category '${data.categoryId}' is not a valid category.`,
        'categoryId'
      );
    }
    if (end <= start) {
      throw new BudgetValidationError('End date must be strictly after start date.', 'endDate');
    }
    if (alertThreshold < 0.1 || alertThreshold > 1.0) {
      throw new BudgetValidationError(
        'Alert threshold must be a ratio between 0.1 and 1.0 (10% to 100%).',
        'alertThreshold'
      );
    }

    // 2. Overlap validation check
    const isOverlap = await budgetRepository.budgetExistsForRange(
      userId,
      data.categoryId,
      start,
      end
    );
    if (isOverlap) {
      throw new BudgetOverlapError(data.categoryId);
    }

    // 3. Calculate salary warning (limit sum exceeds user's monthly salary)
    const warning = await this.calculateSalaryAllocationWarning(userId, data.amount, start, end);

    // 4. Insert budget
    const created = await budgetRepository.createBudget(userId, {
      categoryId: data.categoryId,
      amount: data.amount,
      period: data.period,
      startDate: start,
      endDate: end,
      isRolloverEnabled: data.isRolloverEnabled,
      alertThreshold: alertThreshold * 100, // save as percentage (e.g. 80)
    });

    // 5. Emit event
    await this.eventDispatcher.dispatch('budget.created', {
      userId,
      budgetId: created.id,
      categoryId: created.categoryId,
      amount: created.amount,
    });

    // 6. Check utilization and emit crossing events if needed
    const netSpent = await budgetRepository.calculateNetSpent(
      userId,
      created.categoryId,
      start,
      end
    );
    await this.checkAndEmitThresholds(userId, created, netSpent);

    return {
      budget: created,
      warning: warning.isLimitExceedingSalary ? warning : undefined,
    };
  }

  /**
   * Get a budget by ID and verify ownership
   */
  async getBudget(userId: string, id: string) {
    const budget = await budgetRepository.getBudgetById(userId, id);
    if (!budget) {
      throw new BudgetNotFoundError(id);
    }
    if (budget.userId !== userId) {
      throw new BudgetOwnershipError(id, userId);
    }
    return budget;
  }

  /**
   * Get budgets list with filters
   */
  async getBudgets(
    userId: string,
    filters: { period?: 'monthly' | 'yearly'; categoryId?: string } = {}
  ) {
    return budgetRepository.getBudgets(userId, filters);
  }

  /**
   * Update a budget and validate updated values
   */
  async updateBudget(
    userId: string,
    id: string,
    data: {
      amount?: number;
      period?: 'monthly' | 'yearly';
      startDate?: string;
      endDate?: string;
      isRolloverEnabled?: boolean;
      alertThreshold?: number; // expected as ratio e.g. 0.8
    }
  ) {
    const existing = await this.getBudget(userId, id);

    const updatePayload: any = {};
    if (data.amount !== undefined) {
      if (data.amount <= 0) {
        throw new BudgetValidationError('Budget amount must be greater than zero.', 'amount');
      }
      updatePayload.amount = data.amount;
    }
    if (data.period !== undefined) {
      updatePayload.period = data.period;
    }
    if (data.isRolloverEnabled !== undefined) {
      updatePayload.isRolloverEnabled = data.isRolloverEnabled;
    }
    if (data.alertThreshold !== undefined) {
      if (data.alertThreshold < 0.1 || data.alertThreshold > 1.0) {
        throw new BudgetValidationError(
          'Alert threshold must be between 0.1 and 1.0.',
          'alertThreshold'
        );
      }
      updatePayload.alertThreshold = data.alertThreshold * 100;
    }

    const start = data.startDate ? new Date(data.startDate) : new Date(existing.startDate);
    const end = data.endDate ? new Date(data.endDate) : new Date(existing.endDate);

    if (end <= start) {
      throw new BudgetValidationError('End date must be strictly after start date.', 'endDate');
    }

    if (data.startDate !== undefined) updatePayload.startDate = start;
    if (data.endDate !== undefined) updatePayload.endDate = end;

    // Check overlaps if date boundaries change
    if (data.startDate !== undefined || data.endDate !== undefined) {
      const isOverlap = await budgetRepository.budgetExistsForRange(
        userId,
        existing.categoryId,
        start,
        end,
        id
      );
      if (isOverlap) {
        throw new BudgetOverlapError(existing.categoryId);
      }
    }

    const updated = await budgetRepository.updateBudget(userId, id, updatePayload);
    if (!updated) {
      throw new BudgetNotFoundError(id);
    }

    const delta = (data.amount ?? existing.amount) - existing.amount;

    await this.eventDispatcher.dispatch('budget.updated', {
      userId,
      budgetId: updated.id,
      categoryId: updated.categoryId,
      amount: updated.amount,
      delta,
    });

    const netSpent = await budgetRepository.calculateNetSpent(
      userId,
      updated.categoryId,
      start,
      end
    );
    await this.checkAndEmitThresholds(userId, updated, netSpent);

    return updated;
  }

  /**
   * Delete a budget
   */
  async deleteBudget(userId: string, id: string): Promise<void> {
    const existing = await this.getBudget(userId, id);
    const success = await budgetRepository.deleteBudget(userId, id);
    if (!success) {
      throw new BudgetNotFoundError(id);
    }

    await this.eventDispatcher.dispatch('budget.deleted', {
      userId,
      budgetId: id,
      categoryId: existing.categoryId,
    });
  }

  /**
   * Calculate salary warning allocation metrics
   */
  async calculateSalaryAllocationWarning(
    userId: string,
    newAmount: number,
    startDate: Date,
    endDate: Date
  ): Promise<{ isLimitExceedingSalary: boolean }> {
    // 1. Fetch user monthly salary
    const [user] = await db
      .select({ monthlySalary: users.monthlySalary })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const monthlySalary = user?.monthlySalary ?? 0;
    if (monthlySalary <= 0) {
      return { isLimitExceedingSalary: false };
    }

    // 2. Fetch all monthly budgets overlapping with range
    const allBudgets = await budgetRepository.getBudgets(userId, { period: 'monthly' });
    const now = new Date();

    const activeMonthlyBudgets = allBudgets.filter(
      (b) => new Date(b.startDate) <= now && new Date(b.endDate) >= now
    );

    const activeSum = activeMonthlyBudgets.reduce((sum, b) => sum + b.amount, 0);

    // If limit exceeds monthly salary, flag warning
    if (activeSum + newAmount > monthlySalary) {
      return { isLimitExceedingSalary: true };
    }

    return { isLimitExceedingSalary: false };
  }

  /**
   * Get all budget summaries (with dynamic calculations) for lists
   */
  async getBudgetSummaries(
    userId: string,
    filters: { period?: 'monthly' | 'yearly'; categoryId?: string } = {}
  ): Promise<BudgetSummary[]> {
    const budgetsList = await this.getBudgets(userId, filters);
    const summaries: BudgetSummary[] = [];

    for (const b of budgetsList) {
      const spentAmount = await budgetRepository.calculateNetSpent(
        userId,
        b.categoryId,
        new Date(b.startDate),
        new Date(b.endDate)
      );
      const remainingAmount = this.calculateRemainingAmount(b.amount, spentAmount);
      const utilizationPercentage = this.calculateUtilization(spentAmount, b.amount);

      summaries.push({
        id: b.id,
        categoryId: b.categoryId,
        budgetAmount: b.amount,
        spentAmount,
        remainingAmount,
        utilizationPercentage,
        period: b.period,
        startDate: new Date(b.startDate).toISOString(),
        endDate: new Date(b.endDate).toISOString(),
      });
    }

    return summaries;
  }

  /**
   * Overall active budgets summary indicators or a single budget summary by ID
   */
  async getBudgetSummary(userId: string, id?: string): Promise<any> {
    if (id) {
      const b = await this.getBudget(userId, id);
      const spentAmount = await budgetRepository.calculateNetSpent(
        userId,
        b.categoryId,
        new Date(b.startDate),
        new Date(b.endDate)
      );
      const remainingAmount = this.calculateRemainingAmount(b.amount, spentAmount);
      const utilizationPercentage = this.calculateUtilization(spentAmount, b.amount);

      return {
        id: b.id,
        categoryId: b.categoryId,
        budgetAmount: b.amount,
        spentAmount,
        remainingAmount,
        utilizationPercentage,
        period: b.period,
        startDate: new Date(b.startDate).toISOString(),
        endDate: new Date(b.endDate).toISOString(),
      } as BudgetSummary;
    }

    const allBudgets = await budgetRepository.getBudgets(userId);
    const now = new Date();

    // Filter active budgets where current date is inside date boundaries
    const activeBudgets = allBudgets.filter(
      (b) => new Date(b.startDate) <= now && new Date(b.endDate) >= now
    );

    let totalBudgetLimit = 0;
    let totalSpent = 0;
    let topConsumedBudget: any = null;
    let maxUtilization = -1;

    for (const budget of activeBudgets) {
      const spent = await budgetRepository.calculateNetSpent(
        userId,
        budget.categoryId,
        new Date(budget.startDate),
        new Date(budget.endDate)
      );

      totalBudgetLimit += budget.amount;
      totalSpent += spent;

      const utilization = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      if (utilization > maxUtilization) {
        maxUtilization = utilization;
        topConsumedBudget = {
          budget,
          spent,
          utilizationPercentage: Number(utilization.toFixed(2)),
        };
      }
    }

    const overallUtilization =
      totalBudgetLimit > 0 ? Number(((totalSpent / totalBudgetLimit) * 100).toFixed(2)) : 0;

    return {
      totalBudgetLimit,
      totalSpent: Number(totalSpent.toFixed(2)),
      overallUtilization,
      activeBudgetsCount: activeBudgets.length,
      topConsumedBudget,
    };
  }

  /**
   * Aggregates historical analytics details formatted for downstream/AI engines
   */
  async getBudgetAnalytics(userId: string, categoryId?: string) {
    const allBudgets = await budgetRepository.getBudgets(userId, { categoryId });
    const now = new Date();

    // Monthly trends (past 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

      // Find budgets active in this month
      const monthlyActiveBudgets = allBudgets.filter((b) => {
        const bs = new Date(b.startDate);
        const be = new Date(b.endDate);
        return bs <= monthEnd && be >= monthStart;
      });

      let budgetLimit = 0;
      let actualSpent = 0;

      for (const b of monthlyActiveBudgets) {
        const spent = await budgetRepository.calculateNetSpent(
          userId,
          b.categoryId,
          monthStart,
          monthEnd
        );
        budgetLimit += b.amount;
        actualSpent += spent;
      }

      const utilizationRate =
        budgetLimit > 0 ? Number(((actualSpent / budgetLimit) * 100).toFixed(2)) : 0;
      const savings = Math.max(0, budgetLimit - actualSpent);

      monthlyTrends.push({
        month: monthLabel,
        budgetLimit,
        actualSpent: Number(actualSpent.toFixed(2)),
        savings: Number(savings.toFixed(2)),
        utilizationRate,
      });
    }

    // Category Breakdowns
    const categoriesMap = new Map<string, { limit: number; spent: number }>();
    for (const b of allBudgets) {
      const active = new Date(b.startDate) <= now && new Date(b.endDate) >= now;
      if (!active) continue;

      const spent = await budgetRepository.calculateNetSpent(
        userId,
        b.categoryId,
        new Date(b.startDate),
        new Date(b.endDate)
      );

      const record = categoriesMap.get(b.categoryId) || { limit: 0, spent: 0 };
      record.limit += b.amount;
      record.spent += spent;
      categoriesMap.set(b.categoryId, record);
    }

    const categoryBreakdown = Array.from(categoriesMap.entries()).map(([catId, item]) => {
      const utilizationRate =
        item.limit > 0 ? Number(((item.spent / item.limit) * 100).toFixed(2)) : 0;
      return {
        categoryId: catId,
        budgetLimit: item.limit,
        actualSpent: Number(item.spent.toFixed(2)),
        utilizationRate,
        status: this.calculateBudgetStatus(utilizationRate),
      };
    });

    const activeBudgetsCount = allBudgets.filter(
      (b) => new Date(b.startDate) <= now && new Date(b.endDate) >= now
    ).length;

    // AI Context generation payload
    const totalActualSpent = categoryBreakdown.reduce((sum, item) => sum + item.actualSpent, 0);
    const totalBudgetLimit = categoryBreakdown.reduce((sum, item) => sum + item.budgetLimit, 0);
    const overallUtil = totalBudgetLimit > 0 ? (totalActualSpent / totalBudgetLimit) * 100 : 0;

    return {
      monthlyTrends,
      categoryBreakdown,
      metadata: {
        analyzedAt: now.toISOString(),
        totalBudgetsCount: activeBudgetsCount,
        overallStatus: this.calculateBudgetStatus(overallUtil),
        aiRecommendationPromptContext: `User has ${activeBudgetsCount} active budgets. Total monthly allocations ₹${totalBudgetLimit.toFixed(2)}. Total actual spent ₹${totalActualSpent.toFixed(2)}. Overall utilization is ${overallUtil.toFixed(1)}%. Highlight areas of caution.`,
      },
    };
  }

  // -------------------------------------------------------------------------
  // DYNAMIC FINANCIAL CALCULATIONS
  // -------------------------------------------------------------------------

  calculateUtilization(spent: number, limit: number): number {
    if (limit <= 0) return 0;
    return Number(((spent / limit) * 100).toFixed(2));
  }

  calculateRemainingAmount(limit: number, spent: number): number {
    return Number((limit - spent).toFixed(2));
  }

  calculateDaysRemaining(endDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  calculateActualBurnRate(spent: number, startDate: Date, endDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const daysElapsed = Math.min(
      totalDays,
      Math.max(1, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    );

    return Number((spent / daysElapsed).toFixed(2));
  }

  calculateAllowedBurnRate(limit: number, startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    return Number((limit / totalDays).toFixed(2));
  }

  calculateProjectedSpend(spent: number, startDate: Date, endDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const totalDays = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const daysElapsed = Math.min(
      totalDays,
      Math.max(1, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    );

    const dailyBurn = spent / daysElapsed;
    return Number((dailyBurn * totalDays).toFixed(2));
  }

  calculateBudgetStatus(utilization: number): 'on_track' | 'caution' | 'exceeded' {
    if (utilization < 75.0) return 'on_track';
    if (utilization <= 100.0) return 'caution';
    return 'exceeded';
  }

  calculateRolloverAmount(isRolloverEnabled: boolean, remaining: number): number {
    if (!isRolloverEnabled || remaining < 0) return 0;
    return Number(remaining.toFixed(2));
  }

  // -------------------------------------------------------------------------
  // PRIVATE THRESHOLD VALIDATORS
  // -------------------------------------------------------------------------

  private async checkAndEmitThresholds(
    userId: string,
    budget: any,
    netSpent: number
  ): Promise<void> {
    const utilization = budget.amount > 0 ? (netSpent / budget.amount) * 100 : 0;

    if (netSpent > budget.amount) {
      await this.eventDispatcher.dispatch('budget.exceeded', {
        userId,
        budgetId: budget.id,
        categoryId: budget.categoryId,
        spent: netSpent,
        limit: budget.amount,
      });
    } else if (utilization >= budget.alertThreshold) {
      await this.eventDispatcher.dispatch('budget.threshold.crossed', {
        userId,
        budgetId: budget.id,
        categoryId: budget.categoryId,
        utilization: Number(utilization.toFixed(2)),
        threshold: budget.alertThreshold,
      });
    }
  }
}

export const budgetService = new BudgetService();
