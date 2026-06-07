import { FastifyRequest, FastifyReply } from 'fastify';
import { settlementsService } from './settlements.service.js';
import {
  formatSuccessResponse,
  formatErrorResponse,
  AppError,
  UnauthorizedError,
} from '../../utils/errors.js';
import { z } from 'zod';

const settleSchema = z.object({
  receiverId: z.string(),
  amount: z.number().positive(),
});

export class SettlementsController {
  async settleUp(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = settleSchema.safeParse(request.body);
      if (!result.success) {
        throw new AppError(400, 'Invalid request body');
      }

      const settlement = await settlementsService.settleUp(
        request.user.id,
        result.data.receiverId,
        result.data.amount
      );

      return reply.status(201).send(formatSuccessResponse(settlement, 'Settled up successfully'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to settle up: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async getSettlements(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const settlements = await settlementsService.getSettlements(request.user.id);
      return reply.send(formatSuccessResponse({ settlements }));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to get settlements: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }
}

export const settlementsController = new SettlementsController();
