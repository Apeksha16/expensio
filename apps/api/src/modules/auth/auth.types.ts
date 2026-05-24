import { AuthUser } from '@expensio/types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
