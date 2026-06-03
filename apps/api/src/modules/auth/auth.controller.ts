import { FastifyRequest, FastifyReply } from 'fastify';
import { userRepository } from '../users/users.repository.js';

export class AuthController {
  async getMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.supabaseUser) {
        return reply.status(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User profile not loaded. Supabase authentication is required.',
          },
        });
      }

      let dbUser = request.user;
      if (!dbUser) {
        // Auto-create user record and initialize profile (isOnboardingCompleted = false)
        dbUser = await userRepository.syncFromSupabase(request.supabaseUser);
      }

      return reply.send({
        success: true,
        data: {
          user: dbUser,
          onboardingComplete: dbUser.isOnboardingCompleted || false,
          isOnboardingCompleted: dbUser.isOnboardingCompleted || false,
        },
      });
    } catch (err) {
      const error = err as Error;
      request.log.error(`getMe controller failed: ${error.message}`);
      return reply.status(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error during profile sync',
        },
      });
    }
  }
}

export const authController = new AuthController();
