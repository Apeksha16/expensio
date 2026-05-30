export interface User {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  currency?: string | null;
  timezone?: string | null;
  monthlySalary?: number | null;
  isOnboarded?: boolean | null;
  createdAt: Date;
  updatedAt?: Date | null;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  description?: string;
  category: string;
  date: Date;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
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
  startDate: Date;
  endDate: Date;
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
  expenseId?: string;
  groupExpenseId?: string;
  userId: string;
  amount: number;
  percentage?: number;
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
