import { FastifyRequest, FastifyReply } from 'fastify';
import { recurringService } from './recurring.service.js';
import { subscriptionAnalyticsService } from './subscription.service.js';
import { createRecurringSchema, updateRecurringSchema } from './recurring.schemas.js';
import {
  formatSuccessResponse,
  formatErrorResponse,
  AppError,
  UnauthorizedError,
} from '../../utils/errors.js';

export class RecurringController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const result = createRecurringSchema.safeParse(request.body);
      if (!result.success) throw new AppError(400, `Invalid payload: ${result.error.message}`);

      const created = await recurringService.createRecurring(request.user.id, {
        ...result.data,
        startDate: new Date(result.data.startDate),
        endDate: result.data.endDate ? new Date(result.data.endDate) : undefined,
        nextGenerationDate: new Date(result.data.startDate),
      });

      return reply.status(201).send(formatSuccessResponse(created, 'Recurring expense created'));
    } catch (err) {
      const error = err as Error | AppError;
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const items = await recurringService.listRecurring(request.user.id);
      return reply.send(formatSuccessResponse({ items }));
    } catch (err) {
      const error = err as Error | AppError;
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async getInsights(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const insights = await subscriptionAnalyticsService.getSubscriptionInsights(request.user.id);
      return reply.send(formatSuccessResponse(insights));
    } catch (err) {
      const error = err as Error | AppError;
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async get(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const item = await recurringService.getRecurring(request.params.id, request.user.id);
      return reply.send(formatSuccessResponse(item));
    } catch (err) {
      const error = err as Error | AppError;
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const result = updateRecurringSchema.safeParse(request.body);
      if (!result.success) throw new AppError(400, `Invalid payload: ${result.error.message}`);

      const updateData: any = { ...result.data };
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

      const updated = await recurringService.updateRecurring(
        request.params.id,
        request.user.id,
        updateData
      );
      return reply.send(formatSuccessResponse(updated, 'Recurring expense updated'));
    } catch (err) {
      const error = err as Error | AppError;
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      await recurringService.deleteRecurring(request.params.id, request.user.id);
      return reply.send(formatSuccessResponse(null, 'Recurring expense deleted'));
    } catch (err) {
      const error = err as Error | AppError;
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }
}

export const recurringController = new RecurringController();
