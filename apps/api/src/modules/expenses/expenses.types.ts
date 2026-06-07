import { Expense, Split } from '@expensio/types';

export interface ExpenseWithSplits extends Expense {
  splits?: Split[];
}

export interface CreateExpenseData {
  userId: string;
  amount: number;
  currency: string;
  description?: string;
  category: string;
  date: Date;
  accountId: string;
  paymentMethod?: string;
  groupId?: string;
  isSplit: boolean;
}

export interface UpdateExpenseData {
  amount?: number;
  currency?: string;
  description?: string;
  category?: string;
  date?: Date;
  accountId?: string;
  paymentMethod?: string | null;
  groupId?: string | null;
  isSplit?: boolean;
}

export interface SplitData {
  userId: string;
  amount: number;
  percentage?: number;
}

export interface PaginatedExpenses {
  expenses: ExpenseWithSplits[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ListExpensesFilters {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  accountId?: string;
  groupId?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy: 'date' | 'amount' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
