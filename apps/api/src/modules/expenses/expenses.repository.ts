import { db } from '../../db/index.js';
import { expenses, splits, accounts } from '../../db/schema.js';
import { eq, and, gte, lte, desc, asc, sql, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { Expense, Split } from '@expensio/types';
import {
  CreateExpenseData,
  UpdateExpenseData,
  SplitData,
  PaginatedExpenses,
  ListExpensesFilters,
  ExpenseWithSplits,
} from './expenses.types.js';

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

      return { ...newExpense, splits: newSplits };
    });

    return result;
  }

  // -------------------------------------------------------------------------
  // READ — list with filters + pagination
  // -------------------------------------------------------------------------

  async findMany(userId: string, filters: ListExpensesFilters): Promise<PaginatedExpenses> {
    const conditions = [eq(expenses.userId, userId)];

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
}

export const expensesRepository = new ExpensesRepository();
