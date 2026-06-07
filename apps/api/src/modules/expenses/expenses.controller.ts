import { FastifyRequest, FastifyReply } from 'fastify';
import { expensesService } from './expenses.service.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
  bulkDeleteExpenseSchema,
} from './expenses.schemas.js';
import {
  formatErrorResponse,
  formatSuccessResponse,
  ValidationError,
  UnauthorizedError,
  AppError,
} from '../../utils/errors.js';

// Helpers to map database 'description' to JSON response 'note'
function mapExpenseResponse(expense: any) {
  if (!expense) return expense;
  return {
    ...expense,
    note: expense.description || expense.note || null,
  };
}

function mapPaginatedExpensesResponse(data: any) {
  if (!data || !data.expenses) return data;
  return {
    ...data,
    expenses: data.expenses.map(mapExpenseResponse),
  };
}

export class ExpensesController {
  // -------------------------------------------------------------------------
  // POST /api/v1/expenses
  // -------------------------------------------------------------------------

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = createExpenseSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const expense = await expensesService.createExpense(request.user.id, result.data);

      return reply
        .status(201)
        .send(formatSuccessResponse(mapExpenseResponse(expense), 'Expense created successfully'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to create expense: ${error.message}`);
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  // -------------------------------------------------------------------------
  // GET /api/v1/expenses
  // -------------------------------------------------------------------------

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = listExpensesQuerySchema.safeParse(request.query);
      if (!result.success) {
        throw new ValidationError('Invalid query parameters', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const data = await expensesService.listExpenses(request.user.id, result.data);

      return reply.send(formatSuccessResponse(mapPaginatedExpensesResponse(data)));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to list expenses: ${error.message}`);
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  // -------------------------------------------------------------------------
  // GET /api/v1/expenses/:id
  // -------------------------------------------------------------------------

  async getOne(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const { id } = request.params;
      const expense = await expensesService.getExpense(id, request.user.id);

      return reply.send(formatSuccessResponse(mapExpenseResponse(expense)));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to get expense: ${error.message}`);
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  // -------------------------------------------------------------------------
  // PATCH /api/v1/expenses/:id
  // -------------------------------------------------------------------------

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = updateExpenseSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const { id } = request.params;
      const expense = await expensesService.updateExpense(id, request.user.id, result.data);

      return reply.send(
        formatSuccessResponse(mapExpenseResponse(expense), 'Expense updated successfully')
      );
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to update expense: ${error.message}`);
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  // -------------------------------------------------------------------------
  // DELETE /api/v1/expenses/:id
  // -------------------------------------------------------------------------

  async remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const { id } = request.params;
      await expensesService.deleteExpense(id, request.user.id);

      return reply.send(formatSuccessResponse(undefined, 'Expense deleted successfully'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to delete expense: ${error.message}`);
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  // -------------------------------------------------------------------------
  // DELETE /api/v1/expenses/bulk
  // -------------------------------------------------------------------------

  async bulkDelete(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = bulkDeleteExpenseSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      await expensesService.bulkDeleteExpenses(result.data.ids, request.user.id);

      return reply.send(formatSuccessResponse(undefined, 'Expenses deleted successfully'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to bulk delete expenses: ${error.message}`);
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }
      return reply.status(500).send(formatErrorResponse(error));
    }
  }
}

export const expensesController = new ExpensesController();
