import test, { describe, before, after, mock } from 'node:test';
import assert from 'node:assert';
import { eventBus } from '../../../utils/event.bus.js';
import { budgetListener } from '../budget.listener.js';
import { budgetRepository } from '../budget.repository.js';

describe('Budget Event Listener Integrations', () => {
  before(() => {
    budgetListener.initialize();
  });

  after(() => {
    mock.restoreAll();
    eventBus.removeAllListeners();
  });

  test('Should emit budget.threshold.crossed when expense pushes utilization past alertThreshold', async () => {
    const userId = 'u1';
    const categoryId = 'Food';
    const budgetId = 'b1';

    // Mock active budgets
    mock.method(budgetRepository, 'getBudgets', async () => [
      {
        id: budgetId,
        categoryId,
        amount: 1000,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-30'),
        alertThreshold: 80,
      },
    ]);

    // Mock spent calculation to return 850 (which is 85% utilization > 80% threshold)
    mock.method(budgetRepository, 'calculateNetSpent', async () => 850);

    let emittedThresholdEvent: any = null;
    eventBus.subscribe('budget.threshold.crossed', (payload) => {
      emittedThresholdEvent = payload;
    });

    // Simulate expense created
    await eventBus.publish('expense.created', {
      expenseId: 'e1',
      userId,
      categoryId,
      amount: 850,
      date: new Date('2026-06-05'),
    });

    // Wait for async handler
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(emittedThresholdEvent, 'Threshold event should be emitted');
    assert.strictEqual(emittedThresholdEvent.budgetId, budgetId);
    assert.strictEqual(emittedThresholdEvent.utilization, 85);
  });

  test('Should emit budget.exceeded when expense pushes utilization past 100%', async () => {
    const userId = 'u2';
    const categoryId = 'Travel';
    const budgetId = 'b2';

    mock.method(budgetRepository, 'getBudgets', async () => [
      {
        id: budgetId,
        categoryId,
        amount: 1000,
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-30'),
        alertThreshold: 80,
      },
    ]);

    // Mock spent calculation to return 1200 (exceeded limit 1000)
    mock.method(budgetRepository, 'calculateNetSpent', async () => 1200);

    let emittedExceededEvent: any = null;
    eventBus.subscribe('budget.exceeded', (payload) => {
      emittedExceededEvent = payload;
    });

    // Simulate expense updated
    await eventBus.publish('expense.updated', {
      expenseId: 'e2',
      userId,
      categoryId,
      amount: 1200,
      date: new Date('2026-06-15'),
    });

    // Wait for async handler
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(emittedExceededEvent, 'Exceeded event should be emitted');
    assert.strictEqual(emittedExceededEvent.budgetId, budgetId);
    assert.strictEqual(emittedExceededEvent.spent, 1200);
    assert.strictEqual(emittedExceededEvent.limit, 1000);
  });
});
