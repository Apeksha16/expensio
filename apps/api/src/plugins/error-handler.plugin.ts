import fp from 'fastify-plugin';
import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { formatErrorResponse, AppError } from '../utils/errors.js';

export default fp(async function errorHandlerPlugin(fastify: FastifyInstance) {
  // Register global error handler
  fastify.setErrorHandler(
    (error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) => {
      const isDevelopment = process.env.NODE_ENV === 'development';

      // Handle Fastify errors
      if ('statusCode' in error) {
        const fastifyError = error as FastifyError;
        return reply.status(fastifyError.statusCode || 500).send({
          success: false,
          message: fastifyError.message,
          code: fastifyError.code,
          ...(isDevelopment && { stack: fastifyError.stack }),
        });
      }

      // Handle App errors
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error, isDevelopment));
      }

      // Handle unknown errors
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: isDevelopment ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(isDevelopment && { stack: error.stack }),
      });
    }
  );
});
