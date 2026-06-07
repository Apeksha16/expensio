import test, { describe, before, after, mock } from 'node:test';
import assert from 'node:assert';
import { dashboardService } from '../dashboard.service.js';
import { budgetService } from '../../budgets/budget.service.js';
import { analyticsRepository } from '../../analytics/analytics.repository.js';
import { budgetRepository } from '../../budgets/budget.repository.js';

describe('Dashboard Service - Budget Integration', () => {
  after(() => {
    mock.restoreAll();
  });

  test('Should return budgetSummary successfully mapped', async () => {
    const userId = 'test_dash_user';

    mock.method(analyticsRepository, 'getUserSalary', async () => 100000);
    mock.method(analyticsRepository, 'getMonthlyExpensesSumAggregated', async () => 20000);
    mock.method(analyticsRepository, 'getCategoryBreakdownAggregated', async () => []);
    mock.method(analyticsRepository, 'getRecentExpenses', async () => []);
    mock.method(analyticsRepository, 'getTotalTransactionCount', async () => 5);

    mock.method(budgetRepository, 'findMany', async () => [
      { id: 'b1', categoryId: 'Food', amount: 10000 },
      { id: 'b2', categoryId: 'Travel', amount: 5000 },
    ]);

    mock.method(
      budgetRepository,
      'calculateCategoryExpenses',
      async (_userId: string, categoryId: string) => {
        if (categoryId === 'Food') return 8000;
        if (categoryId === 'Travel') return 1000;
        return 0;
      }
    );

    mock.method(budgetService, 'calculateSalaryAllocationWarning', async () => ({
      isLimitExceedingSalary: false,
    }));

    const result = await dashboardService.getSummary(userId);

    assert.ok(result.budgetSummary);
    assert.strictEqual(result.budgetSummary.totalBudgetLimit, 15000); // 10000 + 5000
    assert.strictEqual(result.budgetSummary.totalSpent, 9000); // 8000 + 1000
    assert.strictEqual(result.budgetSummary.overallUtilization, 60); // (9000 / 15000) * 100
    assert.strictEqual(result.budgetSummary.activeBudgetsCount, 2);
    assert.strictEqual(result.budgetSummary.isSalaryAllocationExceeded, false);

    assert.ok(result.budgetSummary.topConsumedBudget);
    assert.strictEqual(result.budgetSummary.topConsumedBudget.categoryId, 'Food');
    assert.strictEqual(result.budgetSummary.topConsumedBudget.utilizationPercentage, 80); // 8000 / 10000
    assert.strictEqual(result.budgetSummary.topConsumedBudget.spentAmount, 8000);
    assert.strictEqual(result.budgetSummary.topConsumedBudget.budgetAmount, 10000);
  });
});
