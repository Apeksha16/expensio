export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
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
