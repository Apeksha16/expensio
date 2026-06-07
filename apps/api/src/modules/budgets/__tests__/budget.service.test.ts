import test, { describe, before, after } from 'node:test';
import assert from 'node:assert';
import { BudgetService } from '../budget.service.js';
import { budgetRepository } from '../budget.repository.js';
import { db, client } from '../../../db/index.js';
import { users, expenses, accounts, budgets } from '../../../db/schema.js';
import { eq, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import {
  BudgetValidationError,
  BudgetOverlapError,
  BudgetNotFoundError,
} from '../budget.errors.js';

class SpyEventDispatcher {
  public dispatched: { event: string; payload: any }[] = [];

  async dispatch(event: any, payload: any): Promise<void> {
    this.dispatched.push({ event, payload });
  }

  clear() {
    this.dispatched = [];
  }
}

describe('BudgetService Unit & Integration Tests', () => {
  const testUserId = 'test_user_service_spec';
  const testAccountId = 'test_acc_service_spec';
  const categoryId = 'Food';
  const spyDispatcher = new SpyEventDispatcher();
  const service = new BudgetService(spyDispatcher);

  before(async () => {
    // Cleanup
    await db.delete(budgets).where(eq(budgets.userId, testUserId));
    await db.delete(expenses).where(eq(expenses.userId, testUserId));
    await db.delete(accounts).where(eq(accounts.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));

    // Setup Test User with ₹50,000 monthly salary limit
    await db.insert(users).values({
      id: testUserId,
      email: 'test_user_service_spec@expensio.com',
      name: 'Test Service User',
      username: 'test_user_service_spec',
      monthlySalary: 50000.0,
      isOnboardingCompleted: true,
    });

    // Setup Account
    await db.insert(accounts).values({
      id: testAccountId,
      userId: testUserId,
      name: 'Test Account',
      type: 'cash',
      balance: 100000.0,
    });
  });

  after(async () => {
    // Cleanup
    await db.delete(budgets).where(eq(budgets.userId, testUserId));
    await db.delete(expenses).where(eq(expenses.userId, testUserId));
    await db.delete(accounts).where(eq(accounts.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    await client.end();
  });

  describe('Budget Creation Validations', () => {
    test('Should reject negative amount limits', async () => {
      await assert.rejects(
        service.createBudget(testUserId, {
          categoryId,
          amount: -100,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        }),
        (err: BudgetValidationError) => {
          assert.strictEqual(err.name, 'BudgetValidationError');
          assert.strictEqual(err.field, 'amount');
          return true;
        }
      );
    });

    test('Should reject invalid category labels', async () => {
      await assert.rejects(
        service.createBudget(testUserId, {
          categoryId: 'NotACategory',
          amount: 5000,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        }),
        (err: BudgetValidationError) => {
          assert.strictEqual(err.name, 'BudgetValidationError');
          assert.strictEqual(err.field, 'categoryId');
          return true;
        }
      );
    });

    test('Should reject start dates after end dates', async () => {
      await assert.rejects(
        service.createBudget(testUserId, {
          categoryId,
          amount: 5000,
          period: 'monthly',
          startDate: '2026-06-30',
          endDate: '2026-06-01',
        }),
        (err: BudgetValidationError) => {
          assert.strictEqual(err.name, 'BudgetValidationError');
          assert.strictEqual(err.field, 'endDate');
          return true;
        }
      );
    });

    test('Should reject alertThreshold out of bounds', async () => {
      await assert.rejects(
        service.createBudget(testUserId, {
          categoryId,
          amount: 5000,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
          alertThreshold: 1.5,
        }),
        (err: BudgetValidationError) => {
          assert.strictEqual(err.name, 'BudgetValidationError');
          assert.strictEqual(err.field, 'alertThreshold');
          return true;
        }
      );
    });
  });

  describe('Budget Business Rules', () => {
    test('Overlapping budgets should throw BudgetOverlapError', async () => {
      let budgetId: string | undefined;
      try {
        // 1. Create a budget
        const result1 = await service.createBudget(testUserId, {
          categoryId,
          amount: 10000,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        });
        budgetId = result1.budget.id;

        assert.ok(budgetId);

        // 2. Try creating overlapping budget on same category
        await assert.rejects(
          service.createBudget(testUserId, {
            categoryId,
            amount: 5000,
            period: 'monthly',
            startDate: '2026-06-15',
            endDate: '2026-07-15',
          }),
          BudgetOverlapError
        );
      } finally {
        if (budgetId) {
          await service.deleteBudget(testUserId, budgetId);
        }
      }
    });

    test('Creating budget exceeding salary limits should warn user', async () => {
      // User salary is ₹50,000.
      let budgetId1: string | undefined;
      let budgetId2: string | undefined;
      try {
        // Create first monthly budget: ₹40,000
        const result1 = await service.createBudget(testUserId, {
          categoryId,
          amount: 40000,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        });
        budgetId1 = result1.budget.id;
        assert.strictEqual(result1.warning, undefined); // under salary limits

        // Create second monthly budget: ₹15,000 (total ₹55,000 > ₹50,000)
        const result2 = await service.createBudget(testUserId, {
          categoryId: 'Shopping',
          amount: 15000,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        });
        budgetId2 = result2.budget.id;

        // Warning should trigger
        assert.ok(result2.warning);
        assert.strictEqual(result2.warning.isLimitExceedingSalary, true);
      } finally {
        if (budgetId1) await service.deleteBudget(testUserId, budgetId1);
        if (budgetId2) await service.deleteBudget(testUserId, budgetId2);
      }
    });
  });

  describe('Dynamic Calculations', () => {
    test('Dynamic calculations logic tests', () => {
      // Utilization
      assert.strictEqual(service.calculateUtilization(300, 1000), 30.0);
      assert.strictEqual(service.calculateUtilization(1200, 1000), 120.0);
      assert.strictEqual(service.calculateUtilization(300, 0), 0);

      // Remaining Amount
      assert.strictEqual(service.calculateRemainingAmount(1000, 350), 650.0);
      assert.strictEqual(service.calculateRemainingAmount(1000, 1200), -200.0);

      // Status
      assert.strictEqual(service.calculateBudgetStatus(50), 'on_track');
      assert.strictEqual(service.calculateBudgetStatus(75), 'caution');
      assert.strictEqual(service.calculateBudgetStatus(100), 'caution');
      assert.strictEqual(service.calculateBudgetStatus(105), 'exceeded');

      // Rollover
      assert.strictEqual(service.calculateRolloverAmount(true, 300), 300);
      assert.strictEqual(service.calculateRolloverAmount(true, -50), 0);
      assert.strictEqual(service.calculateRolloverAmount(false, 300), 0);

      // Days Remaining
      const end = new Date();
      end.setDate(end.getDate() + 5);
      assert.strictEqual(service.calculateDaysRemaining(end), 5);

      // Burn rates and Projected spend
      const start = new Date();
      start.setDate(start.getDate() - 4); // 4 days ago
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 6); // 6 days from now (total 10 days duration)

      // Burn rate (elapsed: 4 days, spent: 400) -> 100 spent per day
      assert.strictEqual(service.calculateActualBurnRate(400, start, deadline), 100.0);
      // Allowed burn rate (limit: 1000, total days: 10) -> 100 allowed per day
      assert.strictEqual(service.calculateAllowedBurnRate(1000, start, deadline), 100.0);
      // Projected spend (elapsed: 4 days, spent: 400, total: 10) -> ₹1000 projected
      assert.strictEqual(service.calculateProjectedSpend(400, start, deadline), 1000.0);
    });
  });

  describe('Summaries & Analytics Calculations', () => {
    test('Summary and analytics aggregates operations', async () => {
      let b1Id: string | undefined;
      let b2Id: string | undefined;
      let exp1Id: string | undefined;
      let exp2Id: string | undefined;

      try {
        // 1. Setup budgets
        const b1 = await service.createBudget(testUserId, {
          categoryId: 'Food',
          amount: 8000,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        });
        b1Id = b1.budget.id;

        const b2 = await service.createBudget(testUserId, {
          categoryId: 'Shopping',
          amount: 4000,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        });
        b2Id = b2.budget.id;

        // 2. Create mock expenses
        const [exp1] = await db
          .insert(expenses)
          .values({
            id: `exp_spec_${nanoid(8)}`,
            userId: testUserId,
            amount: 2000.0,
            category: 'Food',
            date: new Date('2026-06-05T12:00:00.000Z'),
            accountId: testAccountId,
          })
          .returning();
        exp1Id = exp1.id;

        const [exp2] = await db
          .insert(expenses)
          .values({
            id: `exp_spec_${nanoid(8)}`,
            userId: testUserId,
            amount: 3000.0,
            category: 'Shopping',
            date: new Date('2026-06-10T12:00:00.000Z'),
            accountId: testAccountId,
          })
          .returning();
        exp2Id = exp2.id;

        // 3. Verify getBudgetSummary
        const summary = await service.getBudgetSummary(testUserId);
        assert.strictEqual(summary.totalBudgetLimit, 12000);
        assert.strictEqual(summary.totalSpent, 5000);
        assert.strictEqual(summary.overallUtilization, 41.67);
        assert.strictEqual(summary.activeBudgetsCount, 2);
        assert.strictEqual(summary.topConsumedBudget.budget.categoryId, 'Shopping'); // 3000/4000 = 75% utilization

        // 4. Verify getBudgetAnalytics
        const analytics = await service.getBudgetAnalytics(testUserId);
        assert.ok(analytics.monthlyTrends.length > 0);
        assert.strictEqual(analytics.categoryBreakdown.length, 2);

        const foodBreakdown = analytics.categoryBreakdown.find((c) => c.categoryId === 'Food');
        assert.ok(foodBreakdown);
        assert.strictEqual(foodBreakdown.actualSpent, 2000.0);
        assert.strictEqual(foodBreakdown.budgetLimit, 8000);
        assert.strictEqual(foodBreakdown.utilizationRate, 25.0);
      } finally {
        if (exp1Id || exp2Id) {
          const ids = [];
          if (exp1Id) ids.push(exp1Id);
          if (exp2Id) ids.push(exp2Id);
          await db.delete(expenses).where(inArray(expenses.id, ids));
        }
        if (b1Id) await service.deleteBudget(testUserId, b1Id);
        if (b2Id) await service.deleteBudget(testUserId, b2Id);
      }
    });
  });

  describe('Event Dispatcher Triggers', () => {
    test('Should emit budget created and deleted events', async () => {
      spyDispatcher.clear();
      let budgetId: string | undefined;

      try {
        const result = await service.createBudget(testUserId, {
          categoryId: 'Food',
          amount: 5000,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        });
        budgetId = result.budget.id;

        assert.strictEqual(spyDispatcher.dispatched.length, 1);
        assert.strictEqual(spyDispatcher.dispatched[0].event, 'budget.created');
        assert.strictEqual(spyDispatcher.dispatched[0].payload.budgetId, budgetId);

        await service.deleteBudget(testUserId, budgetId);
        budgetId = undefined;

        assert.strictEqual(spyDispatcher.dispatched.length, 2);
        assert.strictEqual(spyDispatcher.dispatched[1].event, 'budget.deleted');
        assert.strictEqual(spyDispatcher.dispatched[1].payload.budgetId, result.budget.id);
      } finally {
        if (budgetId) {
          await service.deleteBudget(testUserId, budgetId);
        }
      }
    });
  });
});
