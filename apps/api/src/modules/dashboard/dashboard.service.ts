import { analyticsRepository } from '../analytics/analytics.repository.js';
import { budgetRepository } from '../budgets/budget.repository.js';
import { budgetService } from '../budgets/budget.service.js';
import { expensesRepository } from '../expenses/expenses.repository.js';
import { DashboardSummaryResponse } from '@expensio/types';

export class DashboardService {
  /**
   * Compute dashboard summary aggregates for the current user
   */
  async getSummary(userId: string): Promise<DashboardSummaryResponse> {
    // 1. Compute calendar month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 2. Fetch parallel aggregates from repository
    const [
      salaryResult,
      spentByCat, // Fetch bulk net spent ONCE for all dashboard calculations
      recentExpenses,
      totalTransactions,
    ] = await Promise.all([
      analyticsRepository.getUserSalary(userId),
      expensesRepository.calculateBulkSplitAdjustedNetSpent(userId, startOfMonth, endOfMonth),
      analyticsRepository.getRecentExpenses(userId, 5), // Fetch latest 5
      analyticsRepository.getTotalTransactionCount(userId),
    ]);

    const monthlySalary = salaryResult || 0;

    // Compute total expenses by summing category spending
    let expensesThisMonth = 0;
    const categoryBreakdown = [];

    for (const [category, amount] of Object.entries(spentByCat)) {
      expensesThisMonth += amount;
      categoryBreakdown.push({ category, amount, percentage: 0 });
    }

    // 3. Compute remaining balance and percentage
    const remainingBalance = monthlySalary - expensesThisMonth;

    let spendingPercentage = 0;
    if (monthlySalary > 0) {
      spendingPercentage = Math.round((expensesThisMonth / monthlySalary) * 100);
    }

    // 4. Calculate percentages for category breakdown
    for (const cat of categoryBreakdown) {
      if (expensesThisMonth > 0) {
        cat.percentage = Math.round((cat.amount / expensesThisMonth) * 100);
      }
    }

    // 5. Fetch and compute budget aggregates
    const activeBudgets = await budgetRepository.findMany(userId, { period: 'monthly' });
    const activeBudgetsCount = activeBudgets.length;

    let totalBudget = 0;
    let totalSpent = 0;
    let topConsumedBudget: any = null;
    let maxPercentage = -1;

    if (activeBudgetsCount > 0) {
      // Re-use spentByCat computed above instead of re-querying!

      for (const budget of activeBudgets) {
        totalBudget += budget.amount;
        const spent = spentByCat[budget.categoryId] || 0;
        totalSpent += spent;

        const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
        if (percentage > maxPercentage) {
          maxPercentage = percentage;
          topConsumedBudget = {
            category: budget.categoryId,
            amount: budget.amount,
            spent,
            percentage,
          };
        }
      }
    }

    const totalBudgetUtilization =
      totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    const salaryWarning = await budgetService.calculateSalaryAllocationWarning(
      userId,
      0,
      startOfMonth,
      endOfMonth
    );

    return {
      monthlySalary,
      totalExpenses: expensesThisMonth, // total monthly expenses as totalExpenses
      remainingBalance,
      spendingPercentage,
      expensesThisMonth,
      totalTransactions,
      categoryBreakdown,
      recentExpenses,
      budgetSummary: {
        totalBudgetLimit: totalBudget,
        totalSpent,
        overallUtilization: totalBudgetUtilization,
        activeBudgetsCount,
        isSalaryAllocationExceeded: salaryWarning.isLimitExceedingSalary,
        topConsumedBudget: topConsumedBudget
          ? {
              categoryId: topConsumedBudget.category,
              utilizationPercentage: topConsumedBudget.percentage,
              spentAmount: topConsumedBudget.spent,
              budgetAmount: topConsumedBudget.amount,
            }
          : null,
      },
    };
  }
}

export const dashboardService = new DashboardService();
