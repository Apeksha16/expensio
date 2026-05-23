import { pgTable, text, timestamp, doublePrecision, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'bank' | 'cash' | 'credit_card' | 'savings'
  balance: doublePrecision('balance').default(0).notNull(),
  currency: text('currency').default('USD').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    accountsUserIdIdx: index('accounts_user_id_idx').on(table.userId),
  };
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').default('USD').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  date: timestamp('date').notNull(),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    expensesUserIdIdx: index('expenses_user_id_idx').on(table.userId),
    expensesAccountIdIdx: index('expenses_account_id_idx').on(table.accountId),
    expensesDateIdx: index('expenses_date_idx').on(table.date),
  };
});

export const budgets = pgTable('budgets', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  categoryId: text('category_id').notNull(),
  amount: doublePrecision('amount').notNull(),
  period: text('period').$type<'monthly' | 'yearly'>().default('monthly').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
}, (table) => {
  return {
    budgetsUserIdIdx: index('budgets_user_id_idx').on(table.userId),
    budgetsCategoryIdIdx: index('budgets_category_id_idx').on(table.categoryId),
  };
});
