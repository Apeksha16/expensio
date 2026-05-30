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

export const authLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const authRegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const authSyncSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type AuthLoginInput = z.infer<typeof authLoginSchema>;
export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
export type AuthSyncInput = z.infer<typeof authSyncSchema>;
