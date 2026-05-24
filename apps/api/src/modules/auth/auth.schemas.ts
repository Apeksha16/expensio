import { z } from 'zod';

export const syncResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    createdAt: z.any(),
  }),
});
