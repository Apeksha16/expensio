import { User, Expense } from '@expensio/types';
import { formatCurrency, formatDate } from '@expensio/shared';

export class ExpenseService {
  async getSampleExpense() {
    const sampleUser: User = {
      id: 'u_123',
      email: 'user@expensio.com',
      name: 'Pranav Katiyar',
      createdAt: new Date(),
    };

    const sampleExpense: Expense = {
      id: 'exp_999',
      userId: sampleUser.id,
      amount: 1250.75,
      currency: 'USD',
      description: 'Cloud Server Hosting Bills',
      category: 'Infrastructure',
      date: new Date(),
      accountId: 'acc_1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      user: sampleUser,
      expense: {
        ...sampleExpense,
        formattedAmount: formatCurrency(sampleExpense.amount, sampleExpense.currency),
        formattedDate: formatDate(sampleExpense.date),
      },
    };
  }
}

export const expenseService = new ExpenseService();
