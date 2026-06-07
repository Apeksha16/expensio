import { groupsRepository } from './groups.repository.js';
import { AppError, UnauthorizedError } from '../../utils/errors.js';
import { nanoid } from 'nanoid';

export class GroupsService {
  async createGroup(
    ownerId: string,
    name: string,
    description: string = '',
    coverImage: string = '',
    members: string[] = []
  ) {
    const groupId = nanoid();
    const group = await groupsRepository.createGroup(
      groupId,
      name,
      description,
      coverImage,
      ownerId
    );

    // Add the owner as an admin/owner member
    await groupsRepository.addMember(nanoid(), groupId, ownerId, 'owner');

    // Add other members
    for (const userId of members) {
      if (userId !== ownerId) {
        await groupsRepository.addMember(nanoid(), groupId, userId, 'member');
      }
    }

    const allMembers = await groupsRepository.getGroupMembers(groupId);

    return {
      ...group,
      members: allMembers.map((m) => m.userId),
    };
  }

  async getUserGroups(userId: string) {
    return groupsRepository.getUserGroups(userId);
  }

  async addMember(userId: string, groupId: string, targetUserId: string) {
    // Only members can add other members? Or only owner?
    // Let's assume any member can add another member for now
    const isMember = await groupsRepository.isUserInGroup(groupId, userId);
    if (!isMember) {
      throw new UnauthorizedError('You are not a member of this group');
    }

    const targetIsMember = await groupsRepository.isUserInGroup(groupId, targetUserId);
    if (targetIsMember) {
      throw new AppError(400, 'User is already a member');
    }

    return groupsRepository.addMember(nanoid(), groupId, targetUserId, 'member');
  }

  async removeMember(userId: string, groupId: string, targetUserId: string) {
    const group = await groupsRepository.getGroupById(groupId);
    if (!group) throw new AppError(404, 'Group not found');

    if (group.ownerId !== userId && userId !== targetUserId) {
      throw new UnauthorizedError('Only the group owner can remove other members');
    }

    if (group.ownerId === targetUserId) {
      throw new AppError(400, 'Cannot remove the group owner');
    }

    return groupsRepository.removeMember(groupId, targetUserId);
  }
}

export const groupsService = new GroupsService();
