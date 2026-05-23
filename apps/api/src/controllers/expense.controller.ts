import { FastifyRequest, FastifyReply } from 'fastify';
import { expenseService } from '../services/expense.service.js';

export class ExpenseController {
  async getSampleExpense(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = await expenseService.getSampleExpense();
      return reply.send(data);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

export const expenseController = new ExpenseController();
