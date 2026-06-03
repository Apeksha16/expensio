import fp from 'fastify-plugin';
import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { formatErrorResponse, AppError } from '../utils/errors.js';

export default fp(async function errorHandlerPlugin(fastify: FastifyInstance) {
  // Register global error handler
  fastify.setErrorHandler(
    (error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) => {
      const isDevelopment = process.env.NODE_ENV === 'development';

      // Log all errors internally
      fastify.log.error(error);

      // Handle App errors
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error, isDevelopment));
      }

      // Handle Fastify errors (validation, parser, payload limits)
      if ('statusCode' in error) {
        const fastifyError = error as FastifyError;
        const mappedError = new AppError(
          fastifyError.statusCode || 500,
          fastifyError.message,
          fastifyError.code || 'BAD_REQUEST'
        );
        if (isDevelopment) {
          mappedError.stack = fastifyError.stack;
        }
        return reply
          .status(mappedError.statusCode)
          .send(formatErrorResponse(mappedError, isDevelopment));
      }

      // Handle unknown system/database errors (prevent internal details leakage)
      const mappedUnknownError = new AppError(
        500,
        isDevelopment ? error.message : 'An unexpected error occurred. Please try again later.',
        'INTERNAL_SERVER_ERROR'
      );
      if (isDevelopment) {
        mappedUnknownError.stack = error.stack;
      }
      return reply.status(500).send(formatErrorResponse(mappedUnknownError, isDevelopment));
    }
  );
});
