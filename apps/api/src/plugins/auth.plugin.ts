import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../modules/auth/auth.service.js';

export default fp(async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // Temporary debug: log the raw Authorization header to diagnose 401s
      fastify.log.info(
        `authenticate: authorization header=${JSON.stringify(request.headers.authorization)}`
      );
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          success: false,
          message: 'Missing or malformed authorization header',
          code: 'MISSING_AUTH_HEADER',
        });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        return reply.status(401).send({
          success: false,
          message: 'Unauthorized: missing token',
          code: 'MISSING_TOKEN',
        });
      }

      // Verify token with Supabase
      const supabaseUser = await authService.verifyToken(token);

      // Sync user profile in PostgreSQL database
      const dbUser = await authService.syncUser(supabaseUser);

      // Attach user to request
      request.user = dbUser;
    } catch (err) {
      const error = err as Error;
      fastify.log.error(`Authentication error: ${error.message}`);
      return reply.status(401).send({
        success: false,
        message: error.message || 'Unauthorized',
        code: 'AUTH_FAILED',
      });
    }
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
