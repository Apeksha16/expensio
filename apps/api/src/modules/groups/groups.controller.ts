import { FastifyRequest, FastifyReply } from 'fastify';
import { groupsService } from './groups.service.js';
import { createGroupSchema, addGroupMemberSchema } from './groups.schemas.js';
import {
  formatSuccessResponse,
  formatErrorResponse,
  ValidationError,
  AppError,
  UnauthorizedError,
} from '../../utils/errors.js';

export class GroupsController {
  async getGroups(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();
      const groups = await groupsService.getUserGroups(request.user.id);
      return reply.send(formatSuccessResponse({ groups }));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to get groups: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async createGroup(request: FastifyRequest, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = createGroupSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const { name, description, coverImage, members } = result.data;
      const group = await groupsService.createGroup(
        request.user.id,
        name,
        description,
        coverImage,
        members
      );
      return reply.status(201).send(formatSuccessResponse(group, 'Group created successfully'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to create group: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async addMember(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    try {
      if (!request.user) throw new UnauthorizedError();

      const result = addGroupMemberSchema.safeParse(request.body);
      if (!result.success) {
        throw new ValidationError('Validation failed', {
          errors: result.error.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
      }

      const member = await groupsService.addMember(
        request.user.id,
        request.params.id,
        result.data.userId
      );
      return reply.send(formatSuccessResponse(member, 'Member added to group'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to add group member: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }

  async removeMember(
    request: FastifyRequest<{ Params: { id: string; userId: string } }>,
    reply: FastifyReply
  ) {
    try {
      if (!request.user) throw new UnauthorizedError();

      await groupsService.removeMember(request.user.id, request.params.id, request.params.userId);
      return reply.send(formatSuccessResponse(null, 'Member removed from group'));
    } catch (err) {
      const error = err as Error | AppError;
      request.log.error(`Failed to remove group member: ${error.message}`);
      if (error instanceof AppError)
        return reply.status(error.statusCode).send(formatErrorResponse(error));
      return reply.status(500).send(formatErrorResponse(error));
    }
  }
}

export const groupsController = new GroupsController();
