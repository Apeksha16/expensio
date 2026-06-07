import { eventBus } from '../../utils/event.bus.js';
import { budgetRepository } from './budget.repository.js';
import { FastifyBaseLogger } from 'fastify';

export class BudgetListener {
  private logger?: FastifyBaseLogger;
  // Map to track idempotency of budget alerts. Key: `${budgetId}_${cycleStartMs}`
  private alertedState = new Map<string, 'exceeded' | 'threshold'>();

  setLogger(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  initialize() {
    eventBus.subscribe('expense.created', async (payload) => {
      await this.handleExpenseMutation(payload.userId, payload.categoryId, payload.date);
    });

    eventBus.subscribe('expense.updated', async (payload) => {
      await this.handleExpenseMutation(payload.userId, payload.categoryId, payload.date);
    });

    eventBus.subscribe('expense.deleted', async (payload) => {
      await this.handleExpenseMutation(payload.userId, payload.categoryId, payload.date);
    });
  }

  private async handleExpenseMutation(userId: string, categoryId: string, date: Date) {
    // 1. Check if there are active budgets for this category that cover the expense date
    const allBudgets = await budgetRepository.getBudgets(userId, { categoryId });

    const activeBudgets = allBudgets.filter((b) => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const expenseDate = new Date(date);
      return expenseDate >= start && expenseDate <= end;
    });

    if (activeBudgets.length === 0) return;

    // 2. Recalculate and emit threshold events for all affected budgets
    for (const budget of activeBudgets) {
      const start = new Date(budget.startDate);
      const end = new Date(budget.endDate);

      const netSpent = await budgetRepository.calculateNetSpent(userId, categoryId, start, end);
      const utilization = budget.amount > 0 ? (netSpent / budget.amount) * 100 : 0;
      const cacheKey = `${budget.id}_${start.getTime()}`;
      const previousAlert = this.alertedState.get(cacheKey);

      if (netSpent > budget.amount) {
        if (previousAlert !== 'exceeded') {
          this.alertedState.set(cacheKey, 'exceeded');
          await eventBus.publish('budget.exceeded', {
            userId,
            budgetId: budget.id,
            categoryId,
            spent: netSpent,
            limit: budget.amount,
          });
        }
      } else if (utilization >= budget.alertThreshold) {
        if (!previousAlert) {
          this.alertedState.set(cacheKey, 'threshold');
          await eventBus.publish('budget.threshold.crossed', {
            userId,
            budgetId: budget.id,
            categoryId,
            utilization: Number(utilization.toFixed(2)),
            threshold: budget.alertThreshold,
          });
        }
      } else {
        // If it drops below threshold, reset the state
        if (previousAlert) {
          this.alertedState.delete(cacheKey);
        }
      }
    }
  }
}

export const budgetListener = new BudgetListener();
