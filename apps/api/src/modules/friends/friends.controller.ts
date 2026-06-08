import { FastifyRequest, FastifyReply } from 'fastify';
import { friendsService } from './friends.service.js';
import { sendFriendRequestSchema, updateFriendRequestSchema } from './friends.schemas.js';
import {
  formatSuccessResponse,
  formatErrorResponse,
  ValidationError,
  AppError,
  UnauthorizedError,
} from '../../utils/errors.js';

export class FriendsController {
  async getFriends(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const friends = await friendsService.getFriends(request.user.id);
      return reply.send(formatSuccessResponse({ friends }));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to get friends: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async getPendingRequests(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const requests = await friendsService.getPendingRequests(request.user.id);
      return reply.send(formatSuccessResponse(requests));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to get pending requests: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async sendRequest(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = sendFriendRequestSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const friendRequest = await friendsService.sendRequest(request.user.id, result.data.username);
      return reply.status(201).send(formatSuccessResponse(friendRequest, 'Friend request sent'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to send friend request: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async respondToRequest(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = updateFriendRequestSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const updated = await friendsService.respondToRequest(
        request.user.id,
        request.params.id,
        result.data.status
      );
      return reply.send(formatSuccessResponse(updated, `Friend request ${result.data.status}`));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to respond to friend request: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async getFriendHistory(
    request: FastifyRequest<{ Params: { friendId: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const history = await friendsService.getFriendHistory(
        request.user.id,
        request.params.friendId
      );
      return reply.send(formatSuccessResponse({ history }));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to get friend history: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }
}

export const friendsController = new FriendsController();
