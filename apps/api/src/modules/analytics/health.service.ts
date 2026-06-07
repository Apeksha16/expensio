import { db } from '../../db/index.js';
import { expenses, budgets, recurringExpenses, users } from '../../db/schema.js';
import { eq, and, sql, gte, lte } from 'drizzle-orm';
import { subscriptionAnalyticsService } from '../recurring/subscription.service.js';

export class HealthScoreService {
  async getHealthScore(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const monthlyIncome = user?.monthlySalary || 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // 1. Current Month Expenses
    const [monthSpendRes] = await db
      .select({ total: sql<number>`SUM(${expenses.amount})` })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.date, startOfMonth),
          lte(expenses.date, endOfMonth)
        )
      );
    const monthSpend = Number(monthSpendRes?.total || 0);

    // 2. Budget Discipline
    const userBudgets = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.period, 'monthly')));

    let overBudgets = 0;
    for (const b of userBudgets) {
      // Re-calculate budget spend
      const [bSpendRes] = await db
        .select({ total: sql<number>`SUM(${expenses.amount})` })
        .from(expenses)
        .where(
          and(
            eq(expenses.userId, userId),
            eq(expenses.category, b.categoryId),
            gte(expenses.date, new Date(b.startDate)),
            lte(expenses.date, new Date(b.endDate))
          )
        );
      const bSpend = Number(bSpendRes?.total || 0);
      if (bSpend > b.amount) overBudgets++;
    }
    const budgetDiscipline = userBudgets.length > 0 ? 1 - overBudgets / userBudgets.length : 0.5; // neutral if no budgets

    // 3. Subscription Burden
    const subInsights = await subscriptionAnalyticsService.getSubscriptionInsights(userId);
    const subscriptionBurden =
      monthlyIncome > 0 ? subInsights.totalMonthlyCommitment / monthlyIncome : 0;

    // 4. Savings Rate
    const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthSpend) / monthlyIncome : 0;

    // SCORING LOGIC (0-100)
    // Savings Rate (40 points): 0.2 is full 40 points
    let srScore = Math.max(0, Math.min(40, (savingsRate / 0.2) * 40));
    if (savingsRate < 0) srScore = 0;

    // Budget Discipline (40 points)
    let bdScore = budgetDiscipline * 40;

    // Subscription Burden (20 points): < 0.05 is full 20, > 0.2 is 0
    let subScore = Math.max(0, Math.min(20, ((0.2 - subscriptionBurden) / 0.15) * 20));

    const totalScore = Math.round(srScore + bdScore + subScore);

    let riskLevel = 'Fair';
    if (totalScore >= 80) riskLevel = 'Excellent';
    else if (totalScore >= 60) riskLevel = 'Good';
    else if (totalScore < 40) riskLevel = 'At Risk';

    return {
      score: totalScore,
      riskLevel,
      metrics: {
        savingsRate: Number((savingsRate * 100).toFixed(1)),
        budgetDiscipline: Number((budgetDiscipline * 100).toFixed(1)),
        subscriptionBurden: Number((subscriptionBurden * 100).toFixed(1)),
      },
    };
  }
}

export const healthScoreService = new HealthScoreService();
