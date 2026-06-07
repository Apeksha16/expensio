import test, { describe, before, after } from 'node:test';
import assert from 'node:assert';
import { budgetRepository } from '../budget.repository.js';
import { db, client } from '../../../db/index.js';
import { users, expenses, splits, accounts, budgets } from '../../../db/schema.js';
import { eq, inArray, isNull } from 'drizzle-orm';
import { nanoid } from 'nanoid';

describe('BudgetRepository Integration Tests', () => {
  const testUserId = 'test_user_repo_spec';
  const testFriendId = 'f1'; // Mock friend f1 is seeded on app startup
  const testAccountId = 'test_acc_repo_spec';
  const categoryId = 'Food';

  before(async () => {
    // 1. Clean up existing test data if any leaked
    await db.delete(budgets).where(eq(budgets.userId, testUserId));
    await db.delete(splits).where(eq(splits.userId, testUserId));
    await db.delete(expenses).where(eq(expenses.userId, testUserId));
    await db.delete(accounts).where(eq(accounts.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));

    // 2. Insert test user
    await db.insert(users).values({
      id: testUserId,
      email: 'test_user_repo_spec@expensio.com',
      name: 'Test Repo User',
      username: 'test_user_repo_spec',
      isOnboardingCompleted: true,
    });

    // 3. Insert test account
    await db.insert(accounts).values({
      id: testAccountId,
      userId: testUserId,
      name: 'Test Spec Account',
      type: 'cash',
      balance: 100000,
    });
  });

  after(async () => {
    // Clean up all data inserted during tests
    await db.delete(budgets).where(eq(budgets.userId, testUserId));
    await db.delete(splits).where(eq(splits.userId, testUserId));
    await db.delete(expenses).where(eq(expenses.userId, testUserId));
    await db.delete(accounts).where(eq(accounts.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    await client.end();
  });

  test('Budget CRUD Operations', async () => {
    const startDate = new Date('2026-06-01T00:00:00.000Z');
    const endDate = new Date('2026-06-30T23:59:59.000Z');

    // 1. Create Budget
    const newBudget = await budgetRepository.createBudget(testUserId, {
      categoryId,
      amount: 10000,
      period: 'monthly',
      startDate,
      endDate,
      isRolloverEnabled: true,
      alertThreshold: 75,
    });

    assert.ok(newBudget.id);
    assert.strictEqual(newBudget.userId, testUserId);
    assert.strictEqual(newBudget.categoryId, categoryId);
    assert.strictEqual(newBudget.amount, 10000);
    assert.strictEqual(newBudget.period, 'monthly');
    assert.strictEqual(newBudget.isRolloverEnabled, true);
    assert.strictEqual(newBudget.alertThreshold, 75);

    // 2. Get Budget by ID
    const fetched = await budgetRepository.getBudgetById(testUserId, newBudget.id);
    assert.ok(fetched);
    assert.strictEqual(fetched.id, newBudget.id);

    // 3. Get Budgets list
    const list = await budgetRepository.getBudgets(testUserId, {
      period: 'monthly',
      categoryId,
    });
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, newBudget.id);

    // 4. Update Budget
    const updated = await budgetRepository.updateBudget(testUserId, newBudget.id, {
      amount: 12000,
      alertThreshold: 90,
    });
    assert.ok(updated);
    assert.strictEqual(updated.amount, 12000);
    assert.strictEqual(updated.alertThreshold, 90);

    // 5. Delete Budget
    const deleted = await budgetRepository.deleteBudget(testUserId, newBudget.id);
    assert.strictEqual(deleted, true);

    const postDelete = await budgetRepository.getBudgetById(testUserId, newBudget.id);
    assert.strictEqual(postDelete, null);
  });

  test('Overlap Detection Validation', async () => {
    const startDate = new Date('2026-06-01T00:00:00.000Z');
    const endDate = new Date('2026-06-30T23:59:59.000Z');

    const created = await budgetRepository.createBudget(testUserId, {
      categoryId,
      amount: 5000,
      period: 'monthly',
      startDate,
      endDate,
    });

    try {
      // 1. Partial overlap (start date inside)
      const overlaps1 = await budgetRepository.budgetExistsForRange(
        testUserId,
        categoryId,
        new Date('2026-06-15T00:00:00.000Z'),
        new Date('2026-07-15T23:59:59.000Z')
      );
      assert.strictEqual(overlaps1, true);

      // 2. Partial overlap (end date inside)
      const overlaps2 = await budgetRepository.budgetExistsForRange(
        testUserId,
        categoryId,
        new Date('2026-05-15T00:00:00.000Z'),
        new Date('2026-06-15T23:59:59.000Z')
      );
      assert.strictEqual(overlaps2, true);

      // 3. Non-overlapping before
      const overlaps3 = await budgetRepository.budgetExistsForRange(
        testUserId,
        categoryId,
        new Date('2026-05-01T00:00:00.000Z'),
        new Date('2026-05-31T23:59:59.000Z')
      );
      assert.strictEqual(overlaps3, false);

      // 4. Overlap check with self exclusion
      const overlapsSelf = await budgetRepository.budgetExistsForRange(
        testUserId,
        categoryId,
        startDate,
        endDate,
        created.id
      );
      assert.strictEqual(overlapsSelf, false);
    } finally {
      await budgetRepository.deleteBudget(testUserId, created.id);
    }
  });

  test('Soft Delete and Split Category Net Spent Calculation', async () => {
    const rangeStart = new Date('2026-06-01T00:00:00.000Z');
    const rangeEnd = new Date('2026-06-30T23:59:59.000Z');

    // Make sure tables are clean for this user
    await db.delete(splits).where(eq(splits.userId, testUserId));
    await db.delete(expenses).where(eq(expenses.userId, testUserId));

    // 1. Personal non-split expense: ₹1000
    const [exp1] = await db
      .insert(expenses)
      .values({
        id: `exp_spec_${nanoid(8)}`,
        userId: testUserId,
        amount: 1000.0,
        category: categoryId,
        date: new Date('2026-06-05T12:00:00.000Z'),
        accountId: testAccountId,
        isSplit: false,
      })
      .returning();

    // 2. Personal split expense (Payer): ₹3000 split equally with friend f1 (friend owes 1500)
    const [exp2] = await db
      .insert(expenses)
      .values({
        id: `exp_spec_${nanoid(8)}`,
        userId: testUserId,
        amount: 3000.0,
        category: categoryId,
        date: new Date('2026-06-10T12:00:00.000Z'),
        accountId: testAccountId,
        isSplit: true,
      })
      .returning();

    await db.insert(splits).values({
      id: `spl_spec_${nanoid(8)}`,
      expenseId: exp2.id,
      userId: testFriendId,
      amount: 1500.0,
    });

    // Net spent check so far: Non-split (1000) + Payer portion (3000 - 1500 = 1500) = ₹2500
    const net1 = await budgetRepository.calculateNetSpent(
      testUserId,
      categoryId,
      rangeStart,
      rangeEnd
    );
    assert.strictEqual(net1, 2500.0);

    // 3. Split liability assigned by others (Friend f1 pays 2000, splits with me for 800)
    // First insert friend's expense
    const [friendExp] = await db
      .insert(expenses)
      .values({
        id: `exp_spec_${nanoid(8)}`,
        userId: testFriendId,
        amount: 2000.0,
        category: categoryId,
        date: new Date('2026-06-12T12:00:00.000Z'),
        accountId: testAccountId, // using local mock account is fine for test insert
        isSplit: true,
      })
      .returning();

    await db.insert(splits).values({
      id: `spl_spec_${nanoid(8)}`,
      expenseId: friendExp.id,
      userId: testUserId, // I owe
      amount: 800.0,
    });

    // Net spent check: 2500 + Split liability (800) = ₹3300
    const net2 = await budgetRepository.calculateNetSpent(
      testUserId,
      categoryId,
      rangeStart,
      rangeEnd
    );
    assert.strictEqual(net2, 3300.0);

    // 4. Soft Delete Exclusions (Insert personal non-split of ₹1200, marked soft-deleted)
    const [deletedExp] = await db
      .insert(expenses)
      .values({
        id: `exp_spec_${nanoid(8)}`,
        userId: testUserId,
        amount: 1200.0,
        category: categoryId,
        date: new Date('2026-06-15T12:00:00.000Z'),
        accountId: testAccountId,
        isSplit: false,
        deletedAt: new Date(),
      })
      .returning();

    // Net spent check: should remain ₹3300 (excluding the ₹1200 deleted expense)
    const net3 = await budgetRepository.calculateNetSpent(
      testUserId,
      categoryId,
      rangeStart,
      rangeEnd
    );
    assert.strictEqual(net3, 3300.0);

    // Clean up test expenses for next run/tests
    await db.delete(splits).where(eq(splits.expenseId, exp2.id));
    await db.delete(splits).where(eq(splits.expenseId, friendExp.id));
    await db
      .delete(expenses)
      .where(inArray(expenses.id, [exp1.id, exp2.id, friendExp.id, deletedExp.id]));
  });
});
