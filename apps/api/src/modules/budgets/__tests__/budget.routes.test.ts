import test, { describe, before, after, mock } from 'node:test';
import assert from 'node:assert';
import Fastify from 'fastify';
import { budgetRoutes } from '../budget.routes.js';
import { budgetService } from '../budget.service.js';
import errorHandlerPlugin from '../../../plugins/error-handler.plugin.js';
import {
  BudgetNotFoundError,
  BudgetOverlapError,
  BudgetOwnershipError,
  BudgetValidationError,
} from '../budget.errors.js';

describe('Budget Routes HTTP Tests', () => {
  let fastify: ReturnType<typeof Fastify>;

  before(async () => {
    fastify = Fastify();

    // Mock authenticate plugin
    fastify.decorate('authenticate', async (request: any) => {
      // simulate an authenticated user
      request.user = { id: 'test_user_id' };
    });

    // Register error handler so errors are formatted correctly
    await fastify.register(errorHandlerPlugin);

    // Register routes
    await fastify.register(budgetRoutes);
    await fastify.ready();
  });

  after(async () => {
    await fastify.close();
    mock.restoreAll();
  });

  describe('POST /api/v1/budgets', () => {
    test('Should return 201 on success', async () => {
      const mockSummary = {
        budget: { id: 'b1', amount: 5000, categoryId: 'Food' },
        spent: 0,
        remaining: 5000,
        status: 'on_track',
      };

      const createMock = mock.method(budgetService, 'createBudget', async () => mockSummary);

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/budgets',
        payload: {
          categoryId: 'Food',
          amount: 5000,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        },
      });

      assert.strictEqual(response.statusCode, 201);
      const body = JSON.parse(response.payload);
      assert.strictEqual(body.success, true);
      assert.deepStrictEqual(body.data, mockSummary);

      createMock.mock.restore();
    });

    test('Should return 409 on overlap error', async () => {
      const createMock = mock.method(budgetService, 'createBudget', async () => {
        throw new BudgetOverlapError('Food');
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/budgets',
        payload: {
          categoryId: 'Food',
          amount: 5000,
          period: 'monthly',
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        },
      });

      assert.strictEqual(response.statusCode, 409);
      const body = JSON.parse(response.payload);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'CONFLICT');

      createMock.mock.restore();
    });

    test('Should return 400 on validation error', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/v1/budgets',
        payload: {
          categoryId: 'Food', // missing required fields
        },
      });

      assert.strictEqual(response.statusCode, 400);
      const body = JSON.parse(response.payload);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/budgets', () => {
    test('Should return 200 on success', async () => {
      const getMock = mock.method(budgetService, 'getBudgetSummaries', async () => []);

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/budgets?month=6&year=2026',
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.payload);
      assert.strictEqual(body.success, true);
      assert.deepStrictEqual(body.data, { budgets: [] });

      getMock.mock.restore();
    });
  });

  describe('GET /api/v1/budgets/:id', () => {
    test('Should return 404 if budget not found', async () => {
      const getMock = mock.method(budgetService, 'getBudgetSummary', async () => {
        throw new BudgetNotFoundError('b_invalid');
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/budgets/b_invalid',
      });

      assert.strictEqual(response.statusCode, 404);
      const body = JSON.parse(response.payload);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'NOT_FOUND');

      getMock.mock.restore();
    });

    test('Should return 403 on ownership error', async () => {
      const getMock = mock.method(budgetService, 'getBudgetSummary', async () => {
        throw new BudgetOwnershipError('b_invalid', 'test_user_id');
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/api/v1/budgets/b_invalid',
      });

      assert.strictEqual(response.statusCode, 403);
      const body = JSON.parse(response.payload);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'FORBIDDEN');

      getMock.mock.restore();
    });
  });

  describe('DELETE /api/v1/budgets/:id', () => {
    test('Should return 200 on success', async () => {
      const deleteMock = mock.method(budgetService, 'deleteBudget', async () => undefined);

      const response = await fastify.inject({
        method: 'DELETE',
        url: '/api/v1/budgets/b1',
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.payload);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.message, 'Budget deleted successfully');

      deleteMock.mock.restore();
    });
  });
});
