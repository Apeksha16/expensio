import { db } from '../../db/index.js';
import { friendships, users, splits, expenses } from '../../db/schema.js';
import { eq, or, and, not } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';

export class FriendsRepository {
  /**
   * Find a friendship record between two users
   */
  async findFriendship(userId1: string, userId2: string) {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.senderId, userId1), eq(friendships.receiverId, userId2)),
          and(eq(friendships.senderId, userId2), eq(friendships.receiverId, userId1))
        )
      )
      .limit(1);
    return friendship || null;
  }

  /**
   * Find a specific friendship by its ID
   */
  async findById(id: string) {
    const [friendship] = await db.select().from(friendships).where(eq(friendships.id, id)).limit(1);
    return friendship || null;
  }

  /**
   * Create a new friend request
   */
  async createRequest(id: string, senderId: string, receiverId: string) {
    const [request] = await db
      .insert(friendships)
      .values({
        id,
        senderId,
        receiverId,
        status: 'pending',
      })
      .returning();
    return request;
  }

  /**
   * Update friendship status
   */
  async updateStatus(id: string, status: 'accepted' | 'rejected' | 'blocked') {
    const [updated] = await db
      .update(friendships)
      .set({ status })
      .where(eq(friendships.id, id))
      .returning();
    return updated;
  }

  /**
   * Get all pending requests (inbound and outbound)
   */
  async getPendingRequests(userId: string) {
    const inbound = await db
      .select({
        id: friendships.id,
        senderId: users.id,
        name: users.name,
        username: users.username,
        avatarUrl: users.avatarUrl,
        createdAt: friendships.createdAt,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.senderId, users.id))
      .where(and(eq(friendships.receiverId, userId), eq(friendships.status, 'pending')));

    const outbound = await db
      .select({
        id: friendships.id,
        receiverId: users.id,
        name: users.name,
        username: users.username,
        avatarUrl: users.avatarUrl,
        createdAt: friendships.createdAt,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.receiverId, users.id))
      .where(and(eq(friendships.senderId, userId), eq(friendships.status, 'pending')));

    return { inbound, outbound };
  }

  /**
   * Get all accepted friends
   */
  async getAcceptedFriends(userId: string) {
    // Friends where user is sender
    const sentFriends = await db
      .select({
        friendshipId: friendships.id,
        id: users.id,
        name: users.name,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.receiverId, users.id))
      .where(and(eq(friendships.senderId, userId), eq(friendships.status, 'accepted')));

    // Friends where user is receiver
    const receivedFriends = await db
      .select({
        friendshipId: friendships.id,
        id: users.id,
        name: users.name,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.senderId, users.id))
      .where(and(eq(friendships.receiverId, userId), eq(friendships.status, 'accepted')));

    return [...sentFriends, ...receivedFriends];
  }
}

export const friendsRepository = new FriendsRepository();
