import { FastifyRequest, FastifyReply } from 'fastify';
import { dashboardService } from './dashboard.service.js';
import {
  formatErrorResponse,
  formatSuccessResponse,
  UnauthorizedError,
  AppError,
} from '../../utils/errors.js';

export class DashboardController {
  // -------------------------------------------------------------------------
  // GET /api/v1/dashboard/summary
  // -------------------------------------------------------------------------
  async getSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const summary = await dashboardService.getSummary(request.user.id);

      return reply.send(formatSuccessResponse(summary, 'Dashboard summary fetched successfully'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to fetch dashboard summary: ${error.message}`);
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }
      return reply.status(500).send(formatErrorResponse(error));
    }
  }
}

export const dashboardController = new DashboardController();
