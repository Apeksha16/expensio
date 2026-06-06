import { expensesRepository } from './expenses.repository.js';
import { ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { CreateExpenseInput, UpdateExpenseInput, ListExpensesQuery } from './expenses.schemas.js';
import {
  PaginatedExpenses,
  SplitData,
  ExpenseWithSplits,
  ListExpensesFilters,
} from './expenses.types.js';

export class ExpensesService {
  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------

  async createExpense(userId: string, input: CreateExpenseInput): Promise<ExpenseWithSplits> {
    // 1. Verify account ownership
    const accountValid = await expensesRepository.validateAccountOwnership(input.accountId, userId);
    if (!accountValid) {
      throw new ValidationError('Account not found or does not belong to you', {
        field: 'accountId',
      });
    }

    // 2. Compute split rows
    const splitData = this.computeSplits(
      input.amount,
      input.splitWith,
      input.splitType,
      input.splitPercentages
    );

    const isSplit = splitData.length > 0;

    return expensesRepository.create(
      {
        userId,
        amount: input.amount,
        currency: input.currency ?? 'INR',
        description: input.description,
        category: input.category,
        date: new Date(input.date),
        accountId: input.accountId,
        paymentMethod: input.paymentMethod,
        groupId: input.groupId,
        isSplit,
      },
      splitData
    );
  }

  // -------------------------------------------------------------------------
  // LIST
  // -------------------------------------------------------------------------

  async listExpenses(userId: string, query: ListExpensesQuery): Promise<PaginatedExpenses> {
    const filters: ListExpensesFilters = {
      page: query.page,
      limit: query.limit,
      category: query.category,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      accountId: query.accountId,
      groupId: query.groupId,
      minAmount: query.minAmount,
      maxAmount: query.maxAmount,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    return expensesRepository.findMany(userId, filters);
  }

  // -------------------------------------------------------------------------
  // GET ONE
  // -------------------------------------------------------------------------

  async getExpense(id: string, userId: string): Promise<ExpenseWithSplits> {
    const expense = await expensesRepository.findById(id, userId);
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }
    return expense;
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------

  async updateExpense(
    id: string,
    userId: string,
    input: UpdateExpenseInput
  ): Promise<ExpenseWithSplits> {
    // Ensure expense exists and belongs to user
    const existing = await expensesRepository.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('Expense not found');
    }

    // Validate new accountId if provided
    if (input.accountId) {
      const accountValid = await expensesRepository.validateAccountOwnership(
        input.accountId,
        userId
      );
      if (!accountValid) {
        throw new ValidationError('Account not found or does not belong to you', {
          field: 'accountId',
        });
      }
    }

    // Compute new splits only if splitWith is explicitly provided in the update
    let splitData: SplitData[] | undefined;
    if (input.splitWith !== undefined) {
      const effectiveAmount = input.amount ?? existing.amount;
      const effectiveSplitType = input.splitType ?? 'equal';
      splitData = this.computeSplits(
        effectiveAmount,
        input.splitWith,
        effectiveSplitType,
        input.splitPercentages
      );
    }

    const isSplit = splitData !== undefined ? splitData.length > 0 : existing.isSplit;

    return expensesRepository.update(
      id,
      userId,
      {
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        category: input.category,
        date: input.date ? new Date(input.date) : undefined,
        accountId: input.accountId,
        paymentMethod: input.paymentMethod,
        groupId: input.groupId,
        isSplit,
      },
      splitData
    );
  }

  // -------------------------------------------------------------------------
  // DELETE
  // -------------------------------------------------------------------------

  async deleteExpense(id: string, userId: string): Promise<void> {
    // findById enforces ownership implicitly
    const existing = await expensesRepository.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('Expense not found');
    }
    await expensesRepository.delete(id, userId);
  }

  // -------------------------------------------------------------------------
  // PRIVATE HELPERS
  // -------------------------------------------------------------------------

  /**
   * Calculates split amounts/percentages for each user in splitWith.
   * Only produces splits for the friends — the owner's own share is NOT stored
   * as a split row (the expense itself represents their portion).
   */
  private computeSplits(
    amount: number,
    splitWith?: string[],
    splitType: 'equal' | 'percentage' = 'equal',
    splitPercentages?: Record<string, number>
  ): SplitData[] {
    if (!splitWith || splitWith.length === 0) return [];

    const totalPeople = splitWith.length + 1; // friends + payer

    if (splitType === 'percentage' && splitPercentages) {
      return splitWith.map((userId) => {
        const pct = splitPercentages[userId] ?? 0;
        return {
          userId,
          amount: parseFloat(((amount * pct) / 100).toFixed(2)),
          percentage: pct,
        };
      });
    }

    // Equal split
    const shareAmount = parseFloat((amount / totalPeople).toFixed(2));
    const equalPct = parseFloat((100 / totalPeople).toFixed(2));

    return splitWith.map((userId) => ({
      userId,
      amount: shareAmount,
      percentage: equalPct,
    }));
  }
}

export const expensesService = new ExpensesService();
