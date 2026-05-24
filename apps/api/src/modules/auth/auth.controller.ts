import { FastifyRequest, FastifyReply } from 'fastify';

export class AuthController {
  async syncProfile(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ error: 'User profile not loaded' });
    }
    return reply.send({ user: request.user });
  }
}

export const authController = new AuthController();
