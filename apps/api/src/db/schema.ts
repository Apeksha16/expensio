import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  index,
  boolean,
  uuid,
  jsonb,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

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
  mpin: text('mpin'),
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
    currency: text('currency').default('INR').notNull(),
    description: text('description'),
    category: text('category').notNull(),
    date: timestamp('date').notNull(),
    accountId: text('account_id')
      .references(() => accounts.id, { onDelete: 'cascade' })
      .notNull(),
    paymentMethod: text('payment_method'),
    groupId: text('group_id').references(() => groups.id, { onDelete: 'set null' }),
    isSplit: boolean('is_split').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => {
    return {
      expensesUserIdIdx: index('expenses_user_id_idx').on(table.userId),
      expensesAccountIdIdx: index('expenses_account_id_idx').on(table.accountId),
      expensesDateIdx: index('expenses_date_idx').on(table.date),
      expensesDeletedAtIdx: index('expenses_deleted_at_idx').on(table.deletedAt),
      expensesUserIdDateIdx: index('expenses_user_id_date_idx').on(table.userId, table.date),
      expensesBudgetCritIdx: index('expenses_budget_crit_idx').on(
        table.userId,
        table.category,
        table.date
      ),
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
    isRolloverEnabled: boolean('is_rollover_enabled').default(false).notNull(),
    alertThreshold: doublePrecision('alert_threshold').default(80).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      budgetsUserIdIdx: index('budgets_user_id_idx').on(table.userId),
      budgetsCategoryIdIdx: index('budgets_category_id_idx').on(table.categoryId),
      budgetsDateRangeIdx: index('budgets_date_range_idx').on(table.startDate, table.endDate),
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

// Group expenses have been merged into standard expenses table.

export const splits = pgTable(
  'splits',
  {
    id: text('id').primaryKey(),
    expenseId: text('expense_id')
      .references(() => expenses.id, { onDelete: 'cascade' })
      .notNull(),
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

export const recurringExpenses = pgTable(
  'recurring_expenses',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    amount: doublePrecision('amount').notNull(),
    currency: text('currency').default('INR').notNull(),
    description: text('description'),
    categoryId: text('category_id').notNull(),
    accountId: text('account_id')
      .references(() => accounts.id, { onDelete: 'cascade' })
      .notNull(),
    frequency: text('frequency')
      .$type<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>()
      .notNull(),
    type: text('type').$type<'standard' | 'subscription'>().default('standard').notNull(),
    provider: text('provider'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date'),
    lastGeneratedDate: timestamp('last_generated_date'),
    nextGenerationDate: timestamp('next_generation_date').notNull(),
    status: text('status').$type<'active' | 'paused' | 'cancelled'>().default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      recurringUserIdIdx: index('recurring_expenses_user_id_idx').on(table.userId),
      recurringNextGenIdx: index('idx_recurring_next_gen')
        .on(table.nextGenerationDate)
        .where(sql`status = 'active'`),
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

export const outboxEvents = pgTable(
  'outbox_events',
  {
    id: text('id').primaryKey(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    status: text('status').$type<'pending' | 'processed' | 'failed'>().default('pending').notNull(),
    retryCount: integer('retry_count').default(0).notNull(),
    lastError: text('last_error'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
  },
  (table) => {
    return {
      outboxStatusIdx: index('outbox_status_idx').on(table.status),
    };
  }
);

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    key: text('key').notNull(),
    path: text('path').notNull(),
    method: text('method').notNull(),
    responseBody: jsonb('response_body'),
    statusCode: integer('status_code'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      idempotencyKeyIdx: index('idx_idempotency_key').on(table.userId, table.key),
      uniqueUserKey: uniqueIndex('unq_user_key').on(table.userId, table.key),
    };
  }
);

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      pushSubUserIdIdx: index('push_sub_user_id_idx').on(table.userId),
    };
  }
);
