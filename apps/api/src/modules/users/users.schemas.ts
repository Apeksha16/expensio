import { z } from 'zod';
import {
  updateProfileSchema,
  completeOnboardingSchema,
  CompleteOnboardingInput,
} from '@expensio/validation';

export const updateProfileBodySchema = updateProfileSchema;

export { completeOnboardingSchema };

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

export type { CompleteOnboardingInput };
