import { z } from 'zod';
import { SuccessResponse } from '../../utils/errors.js';

export const sendFriendRequestSchema = z.object({
  username: z.string().min(3),
});

export const updateFriendRequestSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

export type FriendRequestResponse = SuccessResponse<{
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: string;
}>;

export type FriendResponse = SuccessResponse<{
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  balance: number;
}>;

export type FriendListResponse = SuccessResponse<{
  friends: {
    id: string; // The friend's user ID
    friendshipId: string; // The ID of the friendship record
    name: string;
    username: string;
    avatarUrl: string | null;
    balance: number;
  }[];
}>;

export type PendingRequestsResponse = SuccessResponse<{
  inbound: {
    id: string;
    senderId: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    createdAt: string;
  }[];
  outbound: {
    id: string;
    receiverId: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    createdAt: string;
  }[];
}>;
