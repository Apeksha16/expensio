import { friendsRepository } from './friends.repository.js';
import { userRepository } from '../users/users.repository.js';
import { AppError } from '../../utils/errors.js';
import { nanoid } from 'nanoid';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';

export class FriendsService {
  async getFriends(userId: string) {
    const friends = await friendsRepository.getAcceptedFriends(userId);

    // Default balance to 0 for now. Balance calculations will be integrated with Splits.
    return friends.map((f) => ({
      ...f,
      balance: 0,
    }));
  }

  async getPendingRequests(userId: string) {
    return friendsRepository.getPendingRequests(userId);
  }

  async sendRequest(senderId: string, username: string) {
    const receiver = await userRepository.isUsernameTaken(username);
    if (!receiver) {
      throw new AppError(404, 'User not found');
    }

    // We need to fetch the user object to get the ID since isUsernameTaken just returns boolean
    const [receiverUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!receiverUser) throw new AppError(404, 'User not found');
    if (receiverUser.id === senderId) throw new AppError(400, 'Cannot send request to yourself');

    const existing = await friendsRepository.findFriendship(senderId, receiverUser.id);
    if (existing) {
      throw new AppError(400, `Friendship already exists with status: ${existing.status}`);
    }

    return friendsRepository.createRequest(nanoid(), senderId, receiverUser.id);
  }

  async respondToRequest(userId: string, requestId: string, status: 'accepted' | 'rejected') {
    const request = await friendsRepository.findById(requestId);
    if (!request) throw new AppError(404, 'Request not found');
    if (request.receiverId !== userId) throw new AppError(403, 'Unauthorized');
    if (request.status !== 'pending') throw new AppError(400, 'Request is not pending');

    return friendsRepository.updateStatus(requestId, status);
  }
}

export const friendsService = new FriendsService();
