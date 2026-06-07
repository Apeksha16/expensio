import { FastifyRequest, FastifyReply } from 'fastify';
import { analyticsService } from './analytics.service.js';
import { healthScoreService } from './health.service.js';
import { analyticsFiltersSchema } from '@expensio/validation';
import {
  formatErrorResponse,
  formatSuccessResponse,
  ValidationError,
  UnauthorizedError,
  AppError,
} from '../../utils/errors.js';

export class AnalyticsController {
  /**
   * GET /api/v1/analytics/summary
   */
  async getSummary(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      // Validate inputs
      const result = analyticsFiltersSchema.safeParse(request.query);
      if (!result.success) {
        throw new ValidationError('Invalid query parameters', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const report = await analyticsService.getAnalyticsSummary(request.user.id, result.data);

      return reply.send(formatSuccessResponse(report, 'Analytics summary fetched successfully'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to fetch analytics: ${error.message}`);
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }
      return reply.status(500).send(formatErrorResponse(error));
    }
  }
  async getHealthScore(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const score = await healthScoreService.getHealthScore(request.user.id);
      return reply.send(formatSuccessResponse(score));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to fetch health score: ${error.message}`);
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }
      return reply.status(500).send(formatErrorResponse(error));
    }
  }
}

export const analyticsController = new AnalyticsController();
