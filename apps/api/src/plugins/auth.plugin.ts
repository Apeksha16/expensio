import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../modules/auth/auth.service.js';
import { userRepository } from '../modules/users/users.repository.js';

export default fp(
  async function authPlugin(fastify: FastifyInstance) {
    fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({
            success: false,
            error: {
              code: 'MISSING_AUTH_HEADER',
              message: 'Missing or malformed authorization header',
            },
          });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
          return reply.status(401).send({
            success: false,
            error: {
              code: 'MISSING_TOKEN',
              message: 'Unauthorized: missing token',
            },
          });
        }

        // Verify token with Supabase
        const supabaseUser = await authService.verifyToken(token);

        // Check if user exists in database
        const dbUser = await userRepository.findBySupabaseId(supabaseUser.id);

        // Attach both to request
        request.supabaseUser = supabaseUser;
        request.user = dbUser || undefined;

        // Reject if user is not in database and we are not on the /auth/me or /auth/sync endpoints
        const isAuthMe =
          request.url.includes('/api/v1/auth/me') || request.url.includes('/api/v1/auth/sync');
        if (!dbUser && !isAuthMe) {
          return reply.status(401).send({
            success: false,
            error: {
              code: 'USER_NOT_FOUND',
              message: 'User profile not found in database. Please register/sync first.',
            },
          });
        }
      } catch (err) {
        const error = err as Error;
        fastify.log.error(`Authentication error: ${error.message}`);
        return reply.status(401).send({
          success: false,
          error: {
            code: 'AUTH_FAILED',
            message: error.message || 'Unauthorized',
          },
        });
      }
    });
  },
  { name: 'auth-plugin' }
);

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
