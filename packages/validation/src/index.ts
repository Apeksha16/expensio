import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional().nullable(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
    .optional()
    .nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').or(z.string().length(0)).optional().nullable(),
  currency: z.string().min(3).max(3).optional(),
  timezone: z.string().optional(),
  monthlySalary: z
    .number()
    .nonnegative('Monthly salary must be a positive number')
    .optional()
    .nullable(),
  isOnboardingCompleted: z.boolean().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional().nullable(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional().nullable(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
    .optional()
    .nullable(),
  avatarUrl: z.string().url('Invalid avatar URL').or(z.string().length(0)).optional().nullable(),
  currency: z.string().min(3).max(3).optional(),
  timezone: z.string().optional(),
  monthlySalary: z
    .number()
    .nonnegative('Monthly salary must be a positive number')
    .optional()
    .nullable(),
  isOnboardingCompleted: z.boolean().optional(),
});

export const completeOnboardingSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  monthlySalary: z.number().positive('Monthly salary must be greater than 0'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;

export const ExpenseSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3).default('USD'),
  description: z.string().max(255).optional(),
  category: z.string().min(1, 'Category is required'),
  date: z.date().or(z.string().transform((val) => new Date(val))),
  accountId: z.string().min(1, 'AccountId is required'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const BudgetSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Budget limit must be positive'),
  period: z.enum(['monthly', 'yearly']),
  startDate: z.date().or(z.string().transform((val) => new Date(val))),
  endDate: z.date().or(z.string().transform((val) => new Date(val))),
});

export const GroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Group name must be at least 3 characters'),
  description: z.string().max(500).optional(),
  coverImage: z.string().url('Invalid cover image URL').optional(),
  ownerId: z.string().optional(),
  createdAt: z.date().optional(),
});

export const SettlementSchema = z.object({
  id: z.string().optional(),
  payerId: z.string(),
  receiverId: z.string(),
  amount: z.number().positive('Settlement amount must be positive'),
  status: z.enum(['pending', 'settled']),
  settledAt: z.date().optional(),
});

export type UserInput = z.infer<typeof UserSchema>;
export type ExpenseInput = z.infer<typeof ExpenseSchema>;
export type BudgetInput = z.infer<typeof BudgetSchema>;
export type GroupInput = z.infer<typeof GroupSchema>;
export type SettlementInput = z.infer<typeof SettlementSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
