import { FastifyRequest, FastifyReply } from 'fastify';
import { budgetService } from './budget.service.js';
import { createBudgetSchema, updateBudgetSchema, budgetFilterSchema } from '@expensio/validation';
import {
  formatErrorResponse,
  formatSuccessResponse,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  AppError,
} from '../../utils/errors.js';
import {
  BudgetNotFoundError,
  BudgetOverlapError,
  BudgetOwnershipError,
  BudgetValidationError,
} from './budget.errors.js';

export class BudgetController {
  private handleError(error: Error | AppError, request: FastifyRequest, reply: FastifyReply) {
    request.log.error(`Budget error: ${error.message}`);

    if (error instanceof BudgetNotFoundError) {
      return reply.status(404).send(formatErrorResponse(new NotFoundError(error.message)));
    }
    if (error instanceof BudgetOverlapError) {
      return reply.status(409).send(formatErrorResponse(new ConflictError(error.message)));
    }
    if (error instanceof BudgetOwnershipError) {
      return reply.status(403).send(formatErrorResponse(new ForbiddenError(error.message)));
    }
    if (error instanceof BudgetValidationError) {
      return reply
        .status(400)
        .send(formatErrorResponse(new ValidationError(error.message, { field: error.field })));
    }
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send(formatErrorResponse(error));
    }
    return reply.status(500).send(formatErrorResponse(error));
  }

  // -------------------------------------------------------------------------
  // POST /api/v1/budgets
  // -------------------------------------------------------------------------
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = createBudgetSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const summary = await budgetService.createBudget(request.user.id, result.data);
      return reply.status(201).send(formatSuccessResponse(summary, 'Budget created successfully'));
    } catch (err) {
      return this.handleError(err as Error, request, reply);
    }
  }

  // -------------------------------------------------------------------------
  // GET /api/v1/budgets
  // -------------------------------------------------------------------------
  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = budgetFilterSchema.safeParse(request.query);
      if (!result.success) {
        throw new ValidationError('Invalid query parameters', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const summaries = await budgetService.getBudgetSummaries(request.user.id, result.data);
      return reply.send(formatSuccessResponse({ budgets: summaries }));
    } catch (err) {
      return this.handleError(err as Error, request, reply);
    }
  }

  // -------------------------------------------------------------------------
  // GET /api/v1/budgets/:id
  // -------------------------------------------------------------------------
  async getOne(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const summary = await budgetService.getBudgetSummary(request.user.id, request.params.id);
      return reply.send(formatSuccessResponse(summary));
    } catch (err) {
      return this.handleError(err as Error, request, reply);
    }
  }

  // -------------------------------------------------------------------------
  // PATCH /api/v1/budgets/:id
  // -------------------------------------------------------------------------
  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = updateBudgetSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const summary = await budgetService.updateBudget(
        request.user.id,
        request.params.id,
        result.data
      );
      return reply.send(formatSuccessResponse(summary, 'Budget updated successfully'));
    } catch (err) {
      return this.handleError(err as Error, request, reply);
    }
  }

  // -------------------------------------------------------------------------
  // DELETE /api/v1/budgets/:id
  // -------------------------------------------------------------------------
  async remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      await budgetService.deleteBudget(request.user.id, request.params.id);
      return reply.send(formatSuccessResponse(undefined, 'Budget deleted successfully'));
    } catch (err) {
      return this.handleError(err as Error, request, reply);
    }
  }
}

export const budgetController = new BudgetController();
