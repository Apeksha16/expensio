import { z } from 'zod';
import { SuccessResponse } from '../../utils/errors.js';

export const createGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  members: z.array(z.string()).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
});

export const addGroupMemberSchema = z.object({
  userId: z.string(),
});

export type GroupResponse = SuccessResponse<{
  id: string;
  name: string;
  description: string;
  coverImage: string | null;
  ownerId: string;
  createdAt: string;
  members: string[]; // array of user IDs
}>;

export type GroupListResponse = SuccessResponse<{
  groups: {
    id: string;
    name: string;
    description: string;
    coverImage: string | null;
    ownerId: string;
    createdAt: string;
    members: string[];
  }[];
}>;
