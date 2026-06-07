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
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .optional()
    .nullable(),
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
    .number({ invalid_type_error: 'Monthly salary must be a number' })
    .positive('Monthly salary must be a positive number')
    .max(100000000, 'Salary exceeds reasonable limit')
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
  mpin: z.string().regex(/^\d{4}$|^\d{6}$/, 'MPIN must be exactly 4 or 6 digits'),
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

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be greater than zero'),
  period: z.enum(['monthly', 'yearly'], { required_error: 'Period is required' }),
  startDate: z
    .string({ required_error: 'Start date is required' })
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z
    .string({ required_error: 'End date is required' })
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero').optional(),
  period: z.enum(['monthly', 'yearly']).optional(),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid start date')
    .optional(),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid end date')
    .optional(),
});

export const budgetFilterSchema = z.object({
  period: z.enum(['monthly', 'yearly']).optional(),
  categoryId: z.string().optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetFiltersInput = z.infer<typeof budgetFilterSchema>;

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

export const updateMpinSchema = z
  .object({
    currentMpin: z.string().min(1, 'Current MPIN is required'),
    newMpin: z.string().regex(/^\d{4}$|^\d{6}$/, 'New MPIN must be exactly 4 or 6 digits'),
    confirmMpin: z.string().min(1, 'Confirm MPIN is required'),
  })
  .refine((data) => data.newMpin === data.confirmMpin, {
    message: 'New MPIN and Confirm MPIN must match',
    path: ['confirmMpin'],
  });

export type UpdateMpinInput = z.infer<typeof updateMpinSchema>;

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

export const VALID_CATEGORIES = [
  'Food',
  'Shopping',
  'Bills & Utilities',
  'Health',
  'Investments',
  'Entertainment',
  'Education',
  'Transport',
  'Credit Card',
  'Udhaari',
  'Rent',
  'Travel',
  'Gifts',
  'Others',
] as const;

export type ExpenseCategory = (typeof VALID_CATEGORIES)[number];

export const VALID_PAYMENT_METHODS = ['Credit Card', 'Debit Card', 'Cash', 'UPI'] as const;
export type PaymentMethod = (typeof VALID_PAYMENT_METHODS)[number];

export const createExpenseSchema = z
  .object({
    amount: z
      .number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number',
      })
      .positive('Amount must be greater than 0')
      .max(10_000_000, 'Amount exceeds maximum limit'),
    currency: z.string().length(3, 'Currency must be a 3-character ISO code').default('INR'),
    description: z.string().max(255, 'Description must be at most 255 characters').optional(),
    note: z.string().max(255, 'Note must be at most 255 characters').optional(),
    category: z.enum(VALID_CATEGORIES, {
      errorMap: () => ({ message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` }),
    }),
    date: z
      .string({ required_error: 'Date is required' })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date must be a valid date string',
      }),
    accountId: z.string().min(1, 'Account ID is required').optional(), // made optional to support fallback default account
    paymentMethod: z.enum(VALID_PAYMENT_METHODS, {
      required_error: 'Payment method is required',
    }),
    groupId: z.string().optional(),
    splitWith: z.array(z.string().min(1)).optional(),
    splitType: z.enum(['equal', 'percentage']).default('equal'),
    splitPercentages: z.record(z.string(), z.number().min(0).max(100)).optional(),
  })
  .refine(
    (data) => {
      if (data.splitType === 'percentage' && data.splitWith && data.splitWith.length > 0) {
        if (!data.splitPercentages) return false;
        const total = Object.values(data.splitPercentages).reduce((sum, v) => sum + v, 0);
        return Math.abs(total - 100) < 0.01; // allow tiny float drift
      }
      return true;
    },
    {
      message: 'Split percentages must sum to exactly 100 when using percentage split type',
      path: ['splitPercentages'],
    }
  );

export const updateExpenseSchema = z
  .object({
    amount: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .positive('Amount must be greater than 0')
      .max(10_000_000, 'Amount exceeds maximum limit')
      .optional(),
    currency: z.string().length(3, 'Currency must be a 3-character ISO code').optional(),
    description: z.string().max(255, 'Description must be at most 255 characters').optional(),
    note: z.string().max(255, 'Note must be at most 255 characters').optional(),
    category: z
      .enum(VALID_CATEGORIES, {
        errorMap: () => ({ message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}` }),
      })
      .optional(),
    date: z
      .string()
      .refine((val) => !isNaN(Date.parse(val)), {
        message: 'Date must be a valid date string',
      })
      .optional(),
    accountId: z.string().min(1).optional(),
    paymentMethod: z.enum(VALID_PAYMENT_METHODS).optional().nullable(),
    groupId: z.string().optional().nullable(),
    splitWith: z.array(z.string().min(1)).optional(),
    splitType: z.enum(['equal', 'percentage']).optional(),
    splitPercentages: z.record(z.string(), z.number().min(0).max(100)).optional(),
  })
  .refine(
    (data) => {
      if (data.splitType === 'percentage' && data.splitWith && data.splitWith.length > 0) {
        if (!data.splitPercentages) return false;
        const total = Object.values(data.splitPercentages).reduce((sum, v) => sum + v, 0);
        return Math.abs(total - 100) < 0.01;
      }
      return true;
    },
    {
      message: 'Split percentages must sum to exactly 100 when using percentage split type',
      path: ['splitPercentages'],
    }
  );

export const listExpensesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.enum(VALID_CATEGORIES).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  accountId: z.string().optional(),
  groupId: z.string().optional(),
  minAmount: z.coerce.number().positive().optional(),
  maxAmount: z.coerce.number().positive().optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  sort: z
    .enum(['date-desc', 'date-asc', 'amount-desc', 'amount-asc', 'date', 'amount', 'createdAt'])
    .optional(),
});

export const expenseFilterSchema = listExpensesQuerySchema;

export const bulkDeleteExpenseSchema = z.object({
  ids: z
    .array(z.string().min(1), {
      required_error: 'Expense IDs are required',
    })
    .min(1, 'At least one expense ID must be provided'),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
export type ExpenseFilterInput = z.infer<typeof expenseFilterSchema>;
export type BulkDeleteExpenseInput = z.infer<typeof bulkDeleteExpenseSchema>;

export const analyticsFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});

export type AnalyticsFiltersInput = z.infer<typeof analyticsFiltersSchema>;
