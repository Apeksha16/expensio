import { db } from '../db/index.js';
import { budgets, expenses, notifications } from '../db/schema.js';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { eventBus } from '../utils/event.bus.js';

export class BudgetForecastWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    console.log('[BudgetForecastWorker] Starting daily budget forecast checks...');
    // Run once initially, then every 24 hours
    this.processForecasting().catch((err) => console.error(err));
    this.timer = setInterval(
      () => {
        this.processForecasting().catch((err) => console.error(err));
      },
      24 * 60 * 60 * 1000
    ); // 24 hours
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[BudgetForecastWorker] Stopped.');
  }

  async processForecasting() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      await db.transaction(async (tx) => {
        // 1. Acquire transaction-level advisory lock
        const [{ locked }] = await tx.execute(
          sql`SELECT pg_try_advisory_xact_lock(hashtext('budget_forecast_worker')) as locked`
        );

        if (!locked) {
          console.log('[BudgetForecastWorker] Another instance is already forecasting. Skipping.');
          return;
        }

        console.log('[BudgetForecastWorker] Running forecast check...');

        const now = new Date();
        // Only process active monthly budgets
        const activeBudgets = await tx.select().from(budgets).where(eq(budgets.period, 'monthly'));

        for (const budget of activeBudgets) {
          const start = new Date(budget.startDate);
          const end = new Date(budget.endDate);

          // Skip if outside budget window
          if (now < start || now > end) continue;

          const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          const daysPassed = Math.max(1, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

          const [spentRes] = await tx
            .select({ total: sql<number>`SUM(${expenses.amount})` })
            .from(expenses)
            .where(
              and(
                eq(expenses.userId, budget.userId),
                eq(expenses.category, budget.categoryId),
                gte(expenses.date, start),
                lte(expenses.date, end)
              )
            );

          const spent = Number(spentRes?.total || 0);
          if (spent === 0) continue; // No spend, no risk

          const dailyRunRate = spent / daysPassed;
          const projectedTotal = dailyRunRate * totalDays;

          const riskPercentage = projectedTotal / budget.amount;

          // If projected to exceed 100% of budget, and we've spent more than 50%
          if (riskPercentage > 1.0 && spent / budget.amount > 0.5) {
            // Emit event for predictive overspend
            eventBus.emit('budget.warning', {
              userId: budget.userId,
              budgetId: budget.id,
              category: budget.categoryId,
              spent,
              limit: budget.amount,
              projectedSpend: Math.round(projectedTotal),
            });
          }
        }
      });
    } catch (err) {
      console.error('[BudgetForecastWorker] Error', err);
    } finally {
      this.isRunning = false;
    }
  }
}

export const budgetForecastWorker = new BudgetForecastWorker();
