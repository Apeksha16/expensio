import { db } from '../../db/index.js';
import { groups, groupMembers, users } from '../../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';

export class GroupsRepository {
  async createGroup(
    id: string,
    name: string,
    description: string,
    coverImageUrl: string,
    ownerId: string
  ) {
    const [group] = await db
      .insert(groups)
      .values({
        id,
        name,
        description,
        coverImageUrl,
        ownerId,
      })
      .returning();
    return group;
  }

  async addMember(
    id: string,
    groupId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member' = 'member'
  ) {
    const [member] = await db
      .insert(groupMembers)
      .values({
        id,
        groupId,
        userId,
        role,
      })
      .returning();
    return member;
  }

  async removeMember(groupId: string, userId: string) {
    const [deleted] = await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .returning();
    return deleted;
  }

  async getGroupById(groupId: string) {
    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    return group || null;
  }

  async getGroupMembers(groupId: string) {
    const members = await db
      .select({
        id: groupMembers.id,
        userId: groupMembers.userId,
        role: groupMembers.role,
        joinedAt: groupMembers.createdAt,
      })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
    return members;
  }

  async isUserInGroup(groupId: string, userId: string) {
    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);
    return !!member;
  }

  async getUserGroups(userId: string) {
    const userGroups = await db
      .select({
        group: groups,
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .where(eq(groupMembers.userId, userId));

    const result = [];
    for (const { group } of userGroups) {
      const members = await this.getGroupMembers(group.id);
      result.push({
        ...group,
        members: members.map((m) => m.userId),
      });
    }

    return result;
  }
}

export const groupsRepository = new GroupsRepository();
