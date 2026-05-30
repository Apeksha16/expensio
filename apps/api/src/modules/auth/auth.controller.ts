import { FastifyRequest, FastifyReply } from 'fastify';

export class AuthController {
  async syncProfile(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        message: 'User profile not loaded',
        code: 'UNAUTHORIZED',
      });
    }
    return reply.send({
      success: true,
      data: {
        user: request.user,
        isOnboardingCompleted: request.user.isOnboardingCompleted || false,
      },
    });
  }
}

export const authController = new AuthController();
