import { z } from 'zod';

export const createRecurringSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional().default('INR'),
  description: z.string().optional(),
  categoryId: z.string(),
  accountId: z.string(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  type: z.enum(['standard', 'subscription']).optional().default('standard'),
  provider: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export const updateRecurringSchema = createRecurringSchema.partial();

export type CreateRecurringPayload = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringPayload = z.infer<typeof updateRecurringSchema>;
