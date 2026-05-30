import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  index,
  boolean,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  supabaseAuthId: uuid('supabase_auth_id').unique(),
  email: text('email').notNull().unique(),
  name: text('name'),
  username: text('username').unique(),
  avatarUrl: text('avatar_url'),
  provider: text('provider').default('google').notNull(),
  currency: text('currency').default('INR').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  monthlySalary: doublePrecision('monthly_salary'),
  isOnboardingCompleted: boolean('is_onboarding_completed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accounts = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'bank' | 'cash' | 'credit_card' | 'savings'
    balance: doublePrecision('balance').default(0).notNull(),
    currency: text('currency').default('USD').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      accountsUserIdIdx: index('accounts_user_id_idx').on(table.userId),
    };
  }
);

export const expenses = pgTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    amount: doublePrecision('amount').notNull(),
    currency: text('currency').default('USD').notNull(),
    description: text('description'),
    category: text('category').notNull(),
    date: timestamp('date').notNull(),
    accountId: text('account_id')
      .references(() => accounts.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      expensesUserIdIdx: index('expenses_user_id_idx').on(table.userId),
      expensesAccountIdIdx: index('expenses_account_id_idx').on(table.accountId),
      expensesDateIdx: index('expenses_date_idx').on(table.date),
    };
  }
);

export const budgets = pgTable(
  'budgets',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    categoryId: text('category_id').notNull(),
    amount: doublePrecision('amount').notNull(),
    period: text('period').$type<'monthly' | 'yearly'>().default('monthly').notNull(),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
  },
  (table) => {
    return {
      budgetsUserIdIdx: index('budgets_user_id_idx').on(table.userId),
      budgetsCategoryIdIdx: index('budgets_category_id_idx').on(table.categoryId),
    };
  }
);

export const friendships = pgTable(
  'friendships',
  {
    id: text('id').primaryKey(),
    senderId: text('sender_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    receiverId: text('receiver_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    status: text('status')
      .$type<'pending' | 'accepted' | 'rejected' | 'blocked'>()
      .default('pending')
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      friendshipsSenderIdIdx: index('friendships_sender_id_idx').on(table.senderId),
      friendshipsReceiverIdIdx: index('friendships_receiver_id_idx').on(table.receiverId),
      friendshipsStatusIdx: index('friendships_status_idx').on(table.status),
    };
  }
);

export const groups = pgTable(
  'groups',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    coverImageUrl: text('cover_image_url'),
    ownerId: text('owner_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      groupsOwnerIdIdx: index('groups_owner_id_idx').on(table.ownerId),
    };
  }
);

export const groupMembers = pgTable(
  'group_members',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .references(() => groups.id, { onDelete: 'cascade' })
      .notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    role: text('role').$type<'owner' | 'admin' | 'member'>().default('member').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      groupMembersGroupIdIdx: index('group_members_group_id_idx').on(table.groupId),
      groupMembersUserIdIdx: index('group_members_user_id_idx').on(table.userId),
    };
  }
);

export const groupExpenses = pgTable(
  'group_expenses',
  {
    id: text('id').primaryKey(),
    groupId: text('group_id')
      .references(() => groups.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    amount: doublePrecision('amount').notNull(),
    paidBy: text('paid_by')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      groupExpensesGroupIdIdx: index('group_expenses_group_id_idx').on(table.groupId),
      groupExpensesPaidByIdx: index('group_expenses_paid_by_idx').on(table.paidBy),
    };
  }
);

export const splits = pgTable(
  'splits',
  {
    id: text('id').primaryKey(),
    expenseId: text('expense_id').references(() => expenses.id, { onDelete: 'cascade' }),
    groupExpenseId: text('group_expense_id').references(() => groupExpenses.id, {
      onDelete: 'cascade',
    }),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    amount: doublePrecision('amount').notNull(),
    percentage: doublePrecision('percentage'),
    status: text('status').$type<'pending' | 'settled'>().default('pending').notNull(),
  },
  (table) => {
    return {
      splitsExpenseIdIdx: index('splits_expense_id_idx').on(table.expenseId),
      splitsGroupExpenseIdIdx: index('splits_group_expense_id_idx').on(table.groupExpenseId),
      splitsUserIdIdx: index('splits_user_id_idx').on(table.userId),
    };
  }
);

export const notifications = pgTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      notificationsUserIdIdx: index('notifications_user_id_idx').on(table.userId),
      notificationsIsReadIdx: index('notifications_is_read_idx').on(table.isRead),
    };
  }
);

export const settlements = pgTable(
  'settlements',
  {
    id: text('id').primaryKey(),
    payerId: text('payer_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    receiverId: text('receiver_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    amount: doublePrecision('amount').notNull(),
    status: text('status').$type<'pending' | 'settled'>().default('pending').notNull(),
    settledAt: timestamp('settled_at'),
  },
  (table) => {
    return {
      settlementsPayerIdIdx: index('settlements_payer_id_idx').on(table.payerId),
      settlementsReceiverIdIdx: index('settlements_receiver_id_idx').on(table.receiverId),
    };
  }
);

export const syncQueue = pgTable(
  'sync_queue',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    payload: text('payload').notNull(),
    status: text('status').$type<'pending' | 'completed' | 'failed'>().default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      syncQueueStatusIdx: index('sync_queue_status_idx').on(table.status),
    };
  }
);
