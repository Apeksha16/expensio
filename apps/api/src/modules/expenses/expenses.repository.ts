import { db } from '../../db/index.js';
import { expenses, splits, accounts, outboxEvents } from '../../db/schema.js';
import {
  eq,
  and,
  gte,
  lte,
  desc,
  asc,
  sql,
  inArray,
  ilike,
  isNull,
  lt,
  or,
  sum,
  SQL,
} from 'drizzle-orm';
import { nanoid } from 'nanoid';
import crypto from 'crypto';
import { Expense, Split } from '@expensio/types';
import {
  CreateExpenseData,
  UpdateExpenseData,
  SplitData,
  PaginatedExpenses,
  ListExpensesFilters,
  ExpenseWithSplits,
} from './expenses.types.js';

export type CursorFilters = {
  userId: string;
  limit: number;
  cursorDate?: string;
  cursorId?: string;
  categoryId?: string;
};

export class ExpensesRepository {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  /**
   * Inserts a new expense row and optional split rows inside a DB transaction.
   * Also decrements the account balance by the expense amount.
   */
  async create(data: CreateExpenseData, splitData?: SplitData[]): Promise<ExpenseWithSplits> {
    const expenseId = `exp_${nanoid(10)}`;

    const result = await db.transaction(async (tx) => {
      // 1. Insert expense
      const [newExpense] = await tx
        .insert(expenses)
        .values({
          id: expenseId,
          userId: data.userId,
          amount: data.amount,
          currency: data.currency,
          description: data.description ?? null,
          category: data.category,
          date: data.date,
          accountId: data.accountId,
          paymentMethod: data.paymentMethod ?? null,
          groupId: data.groupId ?? null,
          isSplit: data.isSplit,
        })
        .returning();

      // 2. Decrement account balance
      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} - ${data.amount}` })
        .where(eq(accounts.id, data.accountId));

      // 3. Insert split rows (if any)
      let newSplits: Split[] = [];
      if (splitData && splitData.length > 0) {
        newSplits = await tx
          .insert(splits)
          .values(
            splitData.map((s) => ({
              id: `spl_${nanoid(10)}`,
              expenseId: expenseId,
              userId: s.userId,
              amount: s.amount,
              percentage: s.percentage ?? null,
              status: 'pending' as const,
            }))
          )
          .returning();
      }

      // 4. Insert outbox event for Analytics & Listeners
      await tx.insert(outboxEvents).values({
        id: crypto.randomUUID(),
        eventType: 'expense.created',
        payload: {
          expenseId: newExpense.id,
          userId: data.userId,
          categoryId: newExpense.category,
          amount: newExpense.amount,
          date: newExpense.date,
        },
        status: 'pending',
      });

      return { ...newExpense, splits: newSplits };
    });

    return result;
  }

  // -------------------------------------------------------------------------
  // READ — list with filters + pagination
  // -------------------------------------------------------------------------

  async findMany(userId: string, filters: ListExpensesFilters): Promise<PaginatedExpenses> {
    const conditions = [eq(expenses.userId, userId)];

    if (filters.search) conditions.push(ilike(expenses.description, `%${filters.search}%`));
    if (filters.category) conditions.push(eq(expenses.category, filters.category));
    if (filters.startDate) conditions.push(gte(expenses.date, filters.startDate));
    if (filters.endDate) conditions.push(lte(expenses.date, filters.endDate));
    if (filters.accountId) conditions.push(eq(expenses.accountId, filters.accountId));
    if (filters.groupId) conditions.push(eq(expenses.groupId, filters.groupId));
    if (filters.minAmount) conditions.push(gte(expenses.amount, filters.minAmount));
    if (filters.maxAmount) conditions.push(lte(expenses.amount, filters.maxAmount));

    const whereClause = and(...conditions);

    // Sort column mapping
    const sortColumn =
      filters.sortBy === 'amount'
        ? expenses.amount
        : filters.sortBy === 'createdAt'
          ? expenses.createdAt
          : expenses.date;

    const orderFn = filters.sortOrder === 'asc' ? asc : desc;

    const offset = (filters.page - 1) * filters.limit;

    // Parallel: fetch rows + count
    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(expenses)
        .where(whereClause)
        .orderBy(orderFn(sortColumn))
        .limit(filters.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(expenses)
        .where(whereClause),
    ]);

    // Batch-load splits for all returned expenses
    const expenseIds = rows.map((e) => e.id);
    let splitRows: Split[] = [];
    if (expenseIds.length > 0) {
      splitRows = await db.select().from(splits).where(inArray(splits.expenseId, expenseIds));
    }

    // Group splits by expenseId
    const splitsByExpense: Record<string, Split[]> = {};
    for (const s of splitRows) {
      if (s.expenseId) {
        if (!splitsByExpense[s.expenseId]) splitsByExpense[s.expenseId] = [];
        splitsByExpense[s.expenseId].push(s);
      }
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / filters.limit);

    return {
      expenses: rows.map((e) => ({ ...e, splits: splitsByExpense[e.id] ?? [] })),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages,
        hasNextPage: filters.page < totalPages,
        hasPrevPage: filters.page > 1,
      },
    };
  }

  // -------------------------------------------------------------------------
  // READ — Keyset cursor pagination (Fix 5)
  // -------------------------------------------------------------------------

  async findManyWithCursor(
    filters: CursorFilters
  ): Promise<{
    data: ExpenseWithSplits[];
    nextCursor: { date: string; id: string } | null;
    hasNextPage: boolean;
  }> {
    const whereClause: SQL[] = [eq(expenses.userId, filters.userId), isNull(expenses.deletedAt)];

    if (filters.categoryId) {
      whereClause.push(eq(expenses.category, filters.categoryId));
    }

    if (filters.cursorDate && filters.cursorId) {
      const cDate = new Date(filters.cursorDate);
      whereClause.push(
        or(
          lt(expenses.date, cDate),
          and(eq(expenses.date, cDate), lt(expenses.id, filters.cursorId))
        )!
      );
    }

    const rows = await db
      .select()
      .from(expenses)
      .where(and(...whereClause))
      .orderBy(desc(expenses.date), desc(expenses.id))
      .limit(filters.limit + 1);

    const hasNextPage = rows.length > filters.limit;
    if (hasNextPage) {
      rows.pop();
    }

    if (rows.length === 0) {
      return { data: [], nextCursor: null, hasNextPage: false };
    }

    // Fetch splits for the expenses
    const expenseIds = rows.map((e) => e.id);
    let allSplits: any[] = [];
    if (expenseIds.length > 0) {
      allSplits = await db.select().from(splits).where(inArray(splits.expenseId, expenseIds));
    }

    const splitsByExpense = allSplits.reduce<Record<string, any[]>>((acc, s) => {
      acc[s.expenseId] = acc[s.expenseId] || [];
      acc[s.expenseId].push(s);
      return acc;
    }, {});

    const nextCursor = hasNextPage
      ? { date: rows[rows.length - 1].date.toISOString(), id: rows[rows.length - 1].id }
      : null;

    return {
      data: rows.map((e) => ({ ...e, splits: splitsByExpense[e.id] ?? [] })),
      nextCursor,
      hasNextPage,
    };
  }

  // -------------------------------------------------------------------------
  // READ — single by ID
  // -------------------------------------------------------------------------

  async findById(id: string, userId: string): Promise<ExpenseWithSplits | null> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .limit(1);

    if (!expense) return null;

    const splitRows = await db.select().from(splits).where(eq(splits.expenseId, id));

    return { ...expense, splits: splitRows };
  }

  async findByIds(ids: string[], userId: string): Promise<Expense[]> {
    if (!ids || ids.length === 0) return [];
    return db
      .select()
      .from(expenses)
      .where(and(inArray(expenses.id, ids), eq(expenses.userId, userId)));
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async update(
    id: string,
    userId: string,
    data: UpdateExpenseData,
    splitData?: SplitData[]
  ): Promise<ExpenseWithSplits> {
    // Fetch current state to compute balance delta
    const [current] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .limit(1);

    if (!current) {
      throw new Error('Expense not found or does not belong to user');
    }

    const result = await db.transaction(async (tx) => {
      // --- Account balance adjustments ---
      const amountChanged = data.amount !== undefined && data.amount !== current.amount;
      const accountChanged = data.accountId !== undefined && data.accountId !== current.accountId;

      if (accountChanged) {
        // Restore old account
        await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} + ${current.amount}` })
          .where(eq(accounts.id, current.accountId));
        // Deduct from new account
        const newAmount = data.amount ?? current.amount;
        await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} - ${newAmount}` })
          .where(eq(accounts.id, data.accountId!));
      } else if (amountChanged) {
        const delta = data.amount! - current.amount;
        await tx
          .update(accounts)
          .set({ balance: sql`${accounts.balance} - ${delta}` })
          .where(eq(accounts.id, current.accountId));
      }

      // Build update payload (only set defined fields)
      const updatePayload: Record<string, any> = { updatedAt: new Date() };
      if (data.amount !== undefined) updatePayload.amount = data.amount;
      if (data.currency !== undefined) updatePayload.currency = data.currency;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.category !== undefined) updatePayload.category = data.category;
      if (data.date !== undefined) updatePayload.date = data.date;
      if (data.accountId !== undefined) updatePayload.accountId = data.accountId;
      if ('paymentMethod' in data) updatePayload.paymentMethod = data.paymentMethod;
      if ('groupId' in data) updatePayload.groupId = data.groupId;
      if (data.isSplit !== undefined) updatePayload.isSplit = data.isSplit;

      const [updated] = await tx
        .update(expenses)
        .set(updatePayload)
        .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
        .returning();

      // Replace splits if new splitData is provided
      let updatedSplits: Split[] = [];
      if (splitData !== undefined) {
        // Remove old splits
        await tx.delete(splits).where(eq(splits.expenseId, id));

        if (splitData.length > 0) {
          updatedSplits = await tx
            .insert(splits)
            .values(
              splitData.map((s) => ({
                id: `spl_${nanoid(10)}`,
                expenseId: id,
                userId: s.userId,
                amount: s.amount,
                percentage: s.percentage ?? null,
                status: 'pending' as const,
              }))
            )
            .returning();
        }
      } else {
        // Keep existing splits
        updatedSplits = await tx.select().from(splits).where(eq(splits.expenseId, id));
      }

      // Insert outbox event for Analytics & Listeners
      await tx.insert(outboxEvents).values({
        id: crypto.randomUUID(),
        eventType: 'expense.updated',
        payload: {
          expenseId: updated.id,
          userId: updated.userId,
          categoryId: updated.category,
          amount: updated.amount,
          date: updated.date,
          previousAmount: current.amount,
        },
        status: 'pending',
      });

      return { ...updated, splits: updatedSplits };
    });

    return result;
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  async delete(id: string, userId: string): Promise<void> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.userId, userId)))
      .limit(1);

    if (!expense) {
      throw new Error('Expense not found or does not belong to user');
    }

    await db.transaction(async (tx) => {
      // Restore account balance
      await tx
        .update(accounts)
        .set({ balance: sql`${accounts.balance} + ${expense.amount}` })
        .where(eq(accounts.id, expense.accountId));

      // Splits cascade-delete via FK, but let's be explicit
      await tx.delete(splits).where(eq(splits.expenseId, id));

      await tx.delete(expenses).where(eq(expenses.id, id));

      // Insert outbox event
      await tx.insert(outboxEvents).values({
        id: crypto.randomUUID(),
        eventType: 'expense.deleted',
        payload: {
          expenseId: expense.id,
          userId: expense.userId,
          categoryId: expense.category,
          amount: expense.amount,
          date: expense.date,
        },
        status: 'pending',
      });
    });
  }

  /**
   * Bulk deletes multiple expenses owned by the user.
   * Restores balances to accounts and deletes splits.
   */
  async bulkDelete(ids: string[], userId: string): Promise<void> {
    if (ids.length === 0) return;

    const targetExpenses = await db
      .select()
      .from(expenses)
      .where(and(inArray(expenses.id, ids), eq(expenses.userId, userId)));

    if (targetExpenses.length === 0) return;

    const verifiedIds = targetExpenses.map((e) => e.id);

    await db.transaction(async (tx) => {
      // Restore balances for each account
      await Promise.all(
        targetExpenses.map((expense) =>
          tx
            .update(accounts)
            .set({ balance: sql`${accounts.balance} + ${expense.amount}` })
            .where(eq(accounts.id, expense.accountId))
        )
      );

      // Delete splits
      await tx.delete(splits).where(inArray(splits.expenseId, verifiedIds));

      // Delete expenses
      await tx.delete(expenses).where(inArray(expenses.id, verifiedIds));
    });
  }

  // -------------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------------

  /** Verify an account belongs to a user */
  async validateAccountOwnership(accountId: string, userId: string): Promise<boolean> {
    const [account] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
      .limit(1);
    return !!account;
  }

  /**
   * Retrieves an existing account ID for the user, or creates a default cash account if none exists.
   */
  async getOrCreateDefaultAccount(userId: string): Promise<string> {
    const [existing] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1);

    if (existing) {
      return existing.id;
    }

    const newAccountId = `acc_${nanoid(10)}`;
    await db.insert(accounts).values({
      id: newAccountId,
      userId: userId,
      name: 'Default Cash Account',
      type: 'cash',
      balance: 0,
      currency: 'INR',
    });

    return newAccountId;
  }

  // -------------------------------------------------------------------------
  // FINANCIAL CALCULATIONS (SPLIT-ADJUSTED)
  // -------------------------------------------------------------------------

  /**
   * Calculate category net spending in a range using split offsets.
   */
  async calculateSplitAdjustedNetSpent(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Part 1: Personal non-split expenses
    const [part1] = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.category, categoryId),
          eq(expenses.isSplit, false),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate),
          isNull(expenses.deletedAt)
        )
      );
    const personalNonSplit = part1?.total ? Number(part1.total) : 0;

    // Part 2: Personal split expenses paid by me minus splits assigned to others
    const paidByMeSplitExpenses = await db
      .select({
        id: expenses.id,
        amount: expenses.amount,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.category, categoryId),
          eq(expenses.isSplit, true),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate),
          isNull(expenses.deletedAt)
        )
      );

    let personalSplitPayerPortion = 0;
    if (paidByMeSplitExpenses.length > 0) {
      const expenseIds = paidByMeSplitExpenses.map((e) => e.id);
      const allSplits = await db
        .select({
          expenseId: splits.expenseId,
          amount: splits.amount,
        })
        .from(splits)
        .where(and(inArray(splits.expenseId, expenseIds), sql`${splits.expenseId} IS NOT NULL`));

      const splitsSumByExpense: Record<string, number> = {};
      for (const s of allSplits) {
        if (s.expenseId) {
          splitsSumByExpense[s.expenseId] = (splitsSumByExpense[s.expenseId] || 0) + s.amount;
        }
      }

      for (const exp of paidByMeSplitExpenses) {
        const othersShare = splitsSumByExpense[exp.id] || 0;
        personalSplitPayerPortion += Math.max(0, exp.amount - othersShare);
      }
    }

    // Part 3: Split liabilities assigned by others to me
    const [part3] = await db
      .select({ total: sum(splits.amount) })
      .from(splits)
      .innerJoin(expenses, eq(splits.expenseId, expenses.id))
      .where(
        and(
          eq(splits.userId, userId),
          sql`${expenses.userId} != ${userId}`,
          eq(expenses.category, categoryId),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate),
          isNull(expenses.deletedAt)
        )
      );
    const splitLiabilities = part3?.total ? Number(part3.total) : 0;

    return Number((personalNonSplit + personalSplitPayerPortion + splitLiabilities).toFixed(2));
  }

  /**
   * Calculate category net spending in bulk for a date range to avoid N+1 queries.
   */
  async calculateBulkSplitAdjustedNetSpent(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, number>> {
    const result: Record<string, number> = {};

    // Part 1: Personal non-split expenses
    const personalNonSplit = await db
      .select({ category: expenses.category, total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.isSplit, false),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate),
          isNull(expenses.deletedAt)
        )
      )
      .groupBy(expenses.category);

    for (const row of personalNonSplit) {
      if (row.category && row.total) {
        result[row.category] = (result[row.category] || 0) + Number(row.total);
      }
    }

    // Part 2: Personal split expenses paid by me minus splits assigned to others
    const paidByMeSplitExpenses = await db
      .select({
        id: expenses.id,
        category: expenses.category,
        amount: expenses.amount,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.isSplit, true),
          gte(expenses.date, startDate),
          lte(expenses.date, endDate),
          isNull(expenses.deletedAt)
        )
      );

    if (paidByMeSplitExpenses.length > 0) {
      const expenseIds = paidByMeSplitExpenses.map((e) => e.id);
      const allSplits = await db
        .select({
          expenseId: splits.expenseId,
          amount: splits.amount,
        })
        .from(splits)
        .where(and(inArray(splits.expenseId, expenseIds), sql`${splits.expenseId} IS NOT NULL`));

      const splitsSumByExpense: Record<string, number> = {};
      for (const s of allSplits) {
        if (s.expenseId) {
          splitsSumByExpense[s.expenseId] = (splitsSumByExpense[s.expenseId] || 0) + s.amount;
        }
      }

      for (const exp of paidByMeSplitExpenses) {
        const othersShare = splitsSumByExpense[exp.id] || 0;
        const myShare = Math.max(0, exp.amount - othersShare);
        result[exp.category] = (result[exp.category] || 0) + myShare;
      }
    }

    // Part 3: Split liabilities assigned by others to me
    const splitLiabilities = await db
      .select({ category: expenses.category, total: sum(splits.amount) })
      .from(splits)
      .innerJoin(expenses, eq(splits.expenseId, expenses.id))
      .where(
        and(
          eq(splits.userId, userId),
          sql`${expenses.userId} != ${userId}`,
          gte(expenses.date, startDate),
          lte(expenses.date, endDate),
          isNull(expenses.deletedAt)
        )
      )
      .groupBy(expenses.category);

    for (const row of splitLiabilities) {
      if (row.category && row.total) {
        result[row.category] = (result[row.category] || 0) + Number(row.total);
      }
    }

    return result;
  }
}

export const expensesRepository = new ExpensesRepository();
