// Re-export shared validation schemas for convenience within the module
export {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
  VALID_CATEGORIES,
  VALID_PAYMENT_METHODS,
} from '@expensio/validation';
export type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesQuery,
  ExpenseCategory,
  PaymentMethod,
} from '@expensio/validation';
