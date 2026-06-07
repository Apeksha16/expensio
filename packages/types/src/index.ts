export interface User {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  currency?: string | null;
  timezone?: string | null;
  monthlySalary?: number | null;
  isOnboardingCompleted?: boolean | null;
  mpin?: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description?: string | null;
  note?: string | null;
  category: string;
  date: Date | string;
  accountId: string;
  paymentMethod?: string | null;
  groupId?: string | null;
  isSplit: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'bank' | 'cash' | 'credit_card' | 'savings';
  balance: number;
  currency: string;
  createdAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: Date | string;
  endDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  ownerId?: string;
  createdAt: Date;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'owner' | 'admin' | 'member';
}

export interface GroupExpense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  paidBy: string;
  note?: string;
  createdAt: Date;
}

export interface Split {
  id: string;
  expenseId?: string | null;
  groupExpenseId?: string | null;
  userId: string;
  amount: number;
  percentage?: number | null;
  status: 'pending' | 'settled';
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Settlement {
  id: string;
  payerId: string;
  receiverId: string;
  amount: number;
  status: 'pending' | 'settled';
  settledAt?: Date;
}

export interface SyncQueue {
  id: string;
  type: string;
  payload: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export type AuthUser = User;

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: any | null;
}

export interface CreateExpenseRequest {
  amount: number;
  category: string;
  paymentMethod: string;
  date: string;
  note?: string;
  accountId?: string;
  groupId?: string;
  splitWith?: string[];
  splitType?: 'equal' | 'percentage';
  splitPercentages?: Record<string, number>;
}

export interface UpdateExpenseRequest {
  amount?: number;
  category?: string;
  paymentMethod?: string;
  date?: string;
  note?: string;
  accountId?: string;
  groupId?: string;
  splitWith?: string[];
  splitType?: 'equal' | 'percentage';
  splitPercentages?: Record<string, number>;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  accountId?: string;
  groupId?: string;
  minAmount?: number;
  maxAmount?: number;
  sort?: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'date' | 'amount' | 'createdAt';
  sortBy?: 'date' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseListResponse {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface BulkDeleteExpenseRequest {
  ids: string[];
}

export interface DashboardSummaryResponse {
  monthlySalary: number;
  totalExpenses: number;
  remainingBalance: number;
  spendingPercentage: number;
  expensesThisMonth: number;
  totalTransactions: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  recentExpenses: Expense[];
  budgetSummary?: {
    totalBudgetLimit: number;
    totalSpent: number;
    overallUtilization: number;
    activeBudgetsCount: number;
    isSalaryAllocationExceeded: boolean;
    topConsumedBudget: {
      categoryId: string;
      utilizationPercentage: number;
      spentAmount: number;
      budgetAmount: number;
    } | null;
  };
}

export interface BudgetSummary {
  id: string;
  categoryId: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
}

export interface CreateBudgetRequest {
  categoryId: string;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
}

export interface UpdateBudgetRequest {
  amount?: number;
  period?: 'monthly' | 'yearly';
  startDate?: string;
  endDate?: string;
}

export interface BudgetFilters {
  period?: 'monthly' | 'yearly';
  categoryId?: string;
}

export interface BudgetListResponse {
  budgets: BudgetSummary[];
}

export interface AnalyticsSummary {
  currentMonthSpend: number;
  previousMonthSpend: number;
  spendChangePercentage: number;
  monthlySavings: number;
  savingsRate: number;
  highestCategory: {
    category: string;
    amount: number;
  } | null;
  mostConsumedBudget: {
    category: string;
    percentage: number;
  } | null;
}

export interface CategoryAnalytics {
  category: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrend {
  month: string;
  expenses: number;
  budget: number;
  savings: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  categoryBreakdown: CategoryAnalytics[];
  monthlyTrends: MonthlyTrend[];
}

export interface AppNotificationType {
  id: string;
  userId: string;
  type: 'budget_threshold' | 'budget_exceeded' | 'system';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface SocketEventPayloads {
  'budget.threshold.crossed': {
    budgetId: string;
    categoryId: string;
    utilization: number;
    threshold: number;
    message: string;
  };
  'budget.exceeded': {
    budgetId: string;
    categoryId: string;
    spent: number;
    limit: number;
    message: string;
  };
  'dashboard.invalidated': {
    reason: string;
  };
}
