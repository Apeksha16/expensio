import { z } from 'zod';
import { updateProfileSchema } from '@expensio/validation';

export const updateProfileBodySchema = updateProfileSchema;

export const completeOnboardingSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  monthlySalary: z.number().positive('Monthly salary must be greater than 0'),
});

export const userResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    currency: z.string(),
    timezone: z.string(),
    createdAt: z.any(),
    updatedAt: z.any(),
  }),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
