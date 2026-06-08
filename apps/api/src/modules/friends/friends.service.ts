import { friendsRepository } from './friends.repository.js';
import { userRepository } from '../users/users.repository.js';
import { AppError } from '../../utils/errors.js';
import { nanoid } from 'nanoid';
import { db } from '../../db/index.js';
import { users, expenses, splits, settlements } from '../../db/schema.js';
import { eq, and, or, sum, isNull } from 'drizzle-orm';

export class FriendsService {
  async getFriends(userId: string) {
    const friends = await friendsRepository.getAcceptedFriends(userId);
    if (friends.length === 0) return [];

    // Query pending splits where this user is the payer (others owe this user)
    const owedToMe = await db
      .select({
        friendId: splits.userId,
        total: sum(splits.amount),
      })
      .from(splits)
      .innerJoin(expenses, eq(splits.expenseId, expenses.id))
      .where(
        and(eq(expenses.userId, userId), eq(splits.status, 'pending'), isNull(expenses.deletedAt))
      )
      .groupBy(splits.userId);

    // Query pending splits where this user is the debtor (this user owes others)
    const iOwe = await db
      .select({
        friendId: expenses.userId,
        total: sum(splits.amount),
      })
      .from(splits)
      .innerJoin(expenses, eq(splits.expenseId, expenses.id))
      .where(
        and(eq(splits.userId, userId), eq(splits.status, 'pending'), isNull(expenses.deletedAt))
      )
      .groupBy(expenses.userId);

    const owedMap: Record<string, number> = {};
    const oweMap: Record<string, number> = {};

    owedToMe.forEach((row) => {
      if (row.friendId && row.total) {
        owedMap[row.friendId] = parseFloat(row.total);
      }
    });

    iOwe.forEach((row) => {
      if (row.friendId && row.total) {
        oweMap[row.friendId] = parseFloat(row.total);
      }
    });

    return friends.map((f) => {
      const positive = owedMap[f.id] || 0;
      const negative = oweMap[f.id] || 0;
      return {
        ...f,
        balance: parseFloat((positive - negative).toFixed(2)),
      };
    });
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

  async getFriendHistory(userId: string, friendId: string) {
    // 1. Fetch split expenses paid by user where friend is the debtor
    const userPaidSplits = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        note: expenses.description,
        category: expenses.category,
        date: expenses.date,
        isSplit: expenses.isSplit,
        splitAmount: splits.amount,
        splitStatus: splits.status,
      })
      .from(splits)
      .innerJoin(expenses, eq(splits.expenseId, expenses.id))
      .where(
        and(eq(expenses.userId, userId), eq(splits.userId, friendId), isNull(expenses.deletedAt))
      );

    // 2. Fetch split expenses paid by friend where user is the debtor
    const friendPaidSplits = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
        note: expenses.description,
        category: expenses.category,
        date: expenses.date,
        isSplit: expenses.isSplit,
        splitAmount: splits.amount,
        splitStatus: splits.status,
      })
      .from(splits)
      .innerJoin(expenses, eq(splits.expenseId, expenses.id))
      .where(
        and(eq(expenses.userId, friendId), eq(splits.userId, userId), isNull(expenses.deletedAt))
      );

    // 3. Fetch settlements between user and friend
    const settlementsBetween = await db
      .select()
      .from(settlements)
      .where(
        or(
          and(eq(settlements.payerId, userId), eq(settlements.receiverId, friendId)),
          and(eq(settlements.payerId, friendId), eq(settlements.receiverId, userId))
        )
      );

    // 4. Merge and format everything
    const historyList = [];

    // Format splits paid by user (friend owes user)
    for (const split of userPaidSplits) {
      historyList.push({
        type: 'split' as const,
        id: split.id,
        title: split.note || 'Split Expense',
        category: split.category,
        amount: split.amount,
        date: split.date,
        splitAmount: split.splitAmount,
        whoPaid: 'you' as const,
        status: split.splitStatus,
      });
    }

    // Format splits paid by friend (user owes friend)
    for (const split of friendPaidSplits) {
      historyList.push({
        type: 'split' as const,
        id: split.id,
        title: split.note || 'Split Expense',
        category: split.category,
        amount: split.amount,
        date: split.date,
        splitAmount: split.splitAmount,
        whoPaid: 'friend' as const,
        status: split.splitStatus,
      });
    }

    // Format settlements
    for (const settle of settlementsBetween) {
      historyList.push({
        type: 'settlement' as const,
        id: settle.id,
        title: settle.payerId === userId ? 'You settled up' : 'Friend settled up',
        amount: settle.amount,
        date: settle.settledAt || new Date(),
        whoPaid: settle.payerId === userId ? ('you' as const) : ('friend' as const),
        status: settle.status,
      });
    }

    // Sort chronologically by date descending
    historyList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return historyList;
  }
}

export const friendsService = new FriendsService();
