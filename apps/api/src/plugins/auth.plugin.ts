import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authService } from '../modules/auth/auth.service.js';

export default fp(async function authPlugin(fastify: FastifyInstance) {
  fastify.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return reply.status(401).send({ error: 'Missing or malformed authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
          return reply.status(401).send({ error: 'Unauthorized: missing token' });
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
        return reply.status(401).send({ error: error.message || 'Unauthorized' });
      }
    }
  );
});

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
