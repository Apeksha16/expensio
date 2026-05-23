import { FastifyInstance } from 'fastify';
import { expenseController } from '../controllers/expense.controller.js';

export async function expenseRoutes(fastify: FastifyInstance) {
  fastify.get('/api/sample-expense', expenseController.getSampleExpense.bind(expenseController));
}
