import { FastifyRequest, FastifyReply } from 'fastify';
import { usersService } from './users.service.js';
import { UpdateUserProfileDto } from './users.types.js';
import { updateProfileSchema } from '@expensio/validation';

export class UsersController {
  /**
   * Get current authenticated user profile
   */
  async getMe(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const user = await usersService.getUserById(request.user.id);
      if (!user) {
        return reply.status(404).send({ error: 'User profile not found' });
      }
      return reply.send({ user });
    } catch (err) {
      const error = err as Error;
      request.log.error(`Failed to fetch user: ${error.message}`);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }

  /**
   * Update current user profile
   */
  async updateMe(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const userId = request.user.id;
    
    // Validate inputs using shared Zod schema
    const result = updateProfileSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: 'Validation failed',
        details: result.error.errors.map((e: { path: (string | number)[]; message: string }) => ({ path: e.path.join('.'), message: e.message })),
      });
    }

    const { name, username, avatarUrl, currency, timezone } = result.data;

    try {
      // Validate username uniqueness if provided
      if (username) {
        const isTaken = await usersService.isUsernameTaken(username, userId);
        if (isTaken) {
          return reply.status(400).send({ error: 'Username is already taken' });
        }
      }

      const updatedUser = await usersService.updateUser(userId, {
        name,
        username,
        avatarUrl,
        currency,
        timezone,
      });

      return reply.send({ user: updatedUser });
    } catch (err) {
      const error = err as Error;
      request.log.error(`Failed to update user profile: ${error.message}`);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  }
}

export const usersController = new UsersController();
