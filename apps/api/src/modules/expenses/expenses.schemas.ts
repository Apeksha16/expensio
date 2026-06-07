// Re-export shared validation schemas for convenience within the module
export {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
  bulkDeleteExpenseSchema,
  VALID_CATEGORIES,
  VALID_PAYMENT_METHODS,
} from '@expensio/validation';
export type {
  CreateExpenseInput,
  UpdateExpenseInput,
  ListExpensesQuery,
  BulkDeleteExpenseInput,
  ExpenseCategory,
  PaymentMethod,
} from '@expensio/validation';
