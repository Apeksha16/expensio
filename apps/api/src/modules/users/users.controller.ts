import { FastifyRequest, FastifyReply } from 'fastify';
import { usersService } from './users.service.js';
import {
  updateProfileSchema,
  completeOnboardingSchema,
  updateMpinSchema,
} from '@expensio/validation';
import {
  formatErrorResponse,
  formatSuccessResponse,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  AppError,
} from '../../utils/errors.js';
import { hashMpin, verifyMpin, mpinRateLimiter, clearMpinRateLimit } from '../../utils/security.js';

export class UsersController {
  /**
   * Get current authenticated user profile
   */
  async getMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const user = await usersService.getUserById(request.user.id);
      if (!user) {
        throw new NotFoundError('User profile not found');
      }

      return reply.send(
        formatSuccessResponse({
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
          monthlySalary: user.monthlySalary,
          currency: user.currency,
          timezone: user.timezone,
          isOnboardingCompleted: user.isOnboardingCompleted,
        })
      );
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to fetch user: ${error.message}`);

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  /**
   * Update current user profile
   */
  async updateMe(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const userId = request.user.id;

      // Validate inputs using shared Zod schema
      const result = updateProfileSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const { name, username, avatarUrl, currency, timezone, monthlySalary } = result.data;

      // Validate username uniqueness if provided
      if (username) {
        const isTaken = await usersService.isUsernameTaken(username, userId);
        if (isTaken) {
          throw new ValidationError('Username is already taken');
        }
      }

      const updatedUser = await usersService.updateUser(userId, {
        name,
        username,
        avatarUrl,
        currency,
        timezone,
        monthlySalary,
      });

      return reply.send(formatSuccessResponse(updatedUser, 'Profile updated successfully'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to update user profile: ${error.message}`);

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  /**
   * Complete user onboarding
   */
  async completeOnboarding(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const userId = request.user.id;

      // Validate input
      const result = completeOnboardingSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const { name, monthlySalary, mpin } = result.data;

      // Complete onboarding
      const updatedUser = await usersService.completeOnboarding(userId, {
        name,
        monthlySalary,
        mpin,
      });

      return reply.status(200).send(
        formatSuccessResponse(
          {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            username: updatedUser.username,
            avatarUrl: updatedUser.avatarUrl,
            monthlySalary: updatedUser.monthlySalary,
            currency: updatedUser.currency,
            timezone: updatedUser.timezone,
            isOnboardingCompleted: updatedUser.isOnboardingCompleted,
          },
          'Onboarding completed successfully'
        )
      );
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to complete onboarding: ${error.message}`);

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  /**
   * Update authenticated user's MPIN
   */
  async updateMpin(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const userId = request.user.id;

      // 1. Validate request body using Zod schema
      const result = updateMpinSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const { currentMpin, newMpin } = result.data;

      // 2. Enforce rate limiting
      mpinRateLimiter(userId);

      // 3. Fetch user profile from database
      const user = await usersService.getUserById(userId);
      if (!user) {
        throw new NotFoundError('User profile not found');
      }

      // 4. Verify current MPIN if it is set in database
      if (user.mpin) {
        const isValid = verifyMpin(currentMpin, user.mpin);
        if (!isValid) {
          throw new AppError(400, 'Current MPIN is incorrect', 'INVALID_MPIN');
        }
      }

      // 5. Hash new MPIN and store it
      const newMpinHash = hashMpin(newMpin);
      await usersService.updateMpin(userId, newMpinHash);

      // 6. Reset rate limiter history on success
      clearMpinRateLimit(userId);

      return reply.send(formatSuccessResponse(undefined, 'MPIN updated successfully'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to update MPIN: ${error.message}`);

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  /**
   * Search for a user by username
   */
  async searchUser(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { username } = request.query as { username?: string };
      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        throw new ValidationError(
          'Valid username query parameter of at least 3 characters is required'
        );
      }

      const foundUser = await usersService.searchUserByUsername(username.trim());
      if (!foundUser) {
        throw new NotFoundError('friend not found/ or username doesnt exist');
      }

      return reply.send(
        formatSuccessResponse(
          {
            id: foundUser.id,
            name: foundUser.name,
            username: foundUser.username,
            avatarUrl: foundUser.avatarUrl,
          },
          'User found'
        )
      );
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to search user: ${error.message}`);

      if (error instanceof AppError) {
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      }

      return reply.status(500).send(formatErrorResponse(error));
    }
  }
}

export const usersController = new UsersController();
