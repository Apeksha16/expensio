import { analyticsRepository } from './analytics.repository.js';
import { AnalyticsResponse, MonthlyTrend, CategoryAnalytics } from '@expensio/types';
import { AnalyticsFiltersInput } from '@expensio/validation';

export class AnalyticsService {
  /**
   * Calculate full analytics metrics and monthly trends for the user
   */
  async getAnalyticsSummary(
    userId: string,
    filters: AnalyticsFiltersInput
  ): Promise<AnalyticsResponse> {
    const now = new Date();
    let start: Date;
    let end: Date;

    // 1. Establish date range boundaries for target period
    if (filters.startDate && filters.endDate) {
      start = new Date(filters.startDate);
      end = new Date(filters.endDate);
    } else if (filters.month && filters.year) {
      start = new Date(filters.year, filters.month - 1, 1, 0, 0, 0, 0);
      end = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
    } else {
      // Default to current month
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // 2. Establish boundaries for the comparative previous period
    let prevStart: Date;
    let prevEnd: Date;
    if (filters.month && filters.year) {
      prevStart = new Date(filters.year, filters.month - 2, 1, 0, 0, 0, 0);
      prevEnd = new Date(filters.year, filters.month - 1, 0, 23, 59, 59, 999);
    } else if (filters.startDate && filters.endDate) {
      const diff = end.getTime() - start.getTime();
      prevStart = new Date(start.getTime() - diff - 1);
      prevEnd = new Date(start.getTime() - 1);
    } else {
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }

    // 3. Query all raw aggregates in parallel to optimize DB load
    // If the request is for an exact month, we can use the aggregated table
    let currentMonthSpend = 0;
    let previousMonthSpend = 0;
    let categoryRows: { category: string; amount: number }[] = [];
    let allBudgets: any[] = [];
    let salary = 0;

    const isExactMonth = filters.month && filters.year && !filters.startDate;
    const currentMonthStr = isExactMonth
      ? `${filters.year}-${String(filters.month).padStart(2, '0')}`
      : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthNum = filters.month ? filters.month - 1 : now.getMonth();
    const prevYearNum =
      prevMonthNum === 0
        ? filters.year
          ? filters.year - 1
          : now.getFullYear() - 1
        : filters.year || now.getFullYear();
    const prevMonthAdjusted = prevMonthNum === 0 ? 12 : prevMonthNum;
    const prevMonthStr = `${prevYearNum}-${String(prevMonthAdjusted).padStart(2, '0')}`;

    if (isExactMonth || (!filters.startDate && !filters.endDate && !filters.month)) {
      // Use aggregate tables
      const results = await Promise.all([
        analyticsRepository.getUserSalary(userId),
        analyticsRepository.getMonthlyExpensesSumAggregated(userId, currentMonthStr),
        analyticsRepository.getMonthlyExpensesSumAggregated(userId, prevMonthStr),
        analyticsRepository.getCategoryBreakdownAggregated(userId, currentMonthStr),
        analyticsRepository.getBudgets(userId),
      ]);
      salary = results[0] || 0;
      currentMonthSpend = results[1];
      previousMonthSpend = results[2];
      categoryRows = results[3];
      allBudgets = results[4];
    } else {
      // Custom date range, fallback to raw expenses
      const results = await Promise.all([
        analyticsRepository.getUserSalary(userId),
        analyticsRepository.getExpensesSum(userId, start, end),
        analyticsRepository.getExpensesSum(userId, prevStart, prevEnd),
        analyticsRepository.getCategoryBreakdown(userId, start, end),
        analyticsRepository.getBudgets(userId),
      ]);
      salary = results[0] || 0;
      currentMonthSpend = results[1];
      previousMonthSpend = results[2];
      categoryRows = results[3];
      allBudgets = results[4];
    }

    const userSalary = salary || 0;

    // 4. Spend Change Percentage
    let spendChangePercentage = 0;
    if (previousMonthSpend === 0) {
      spendChangePercentage = currentMonthSpend === 0 ? 0 : 100;
    } else {
      spendChangePercentage = Math.round(
        ((currentMonthSpend - previousMonthSpend) / previousMonthSpend) * 100
      );
    }

    // 5. Savings calculations
    const monthlySavings = userSalary - currentMonthSpend;
    const savingsRate = userSalary > 0 ? Math.round((monthlySavings / userSalary) * 100) : 0;

    // 6. Highest category spend
    let highestCategory = null;
    if (categoryRows.length > 0) {
      const sortedCategories = [...categoryRows].sort((a, b) => b.amount - a.amount);
      highestCategory = {
        category: sortedCategories[0].category,
        amount: sortedCategories[0].amount,
      };
    }

    // 7. Category Breakdown with percentages
    const categoryBreakdown: CategoryAnalytics[] = categoryRows.map((cat) => {
      const percentage =
        currentMonthSpend > 0 ? Math.round((cat.amount / currentMonthSpend) * 100) : 0;
      return {
        category: cat.category,
        amount: cat.amount,
        percentage,
      };
    });

    // 8. Most Consumed Budget
    // Find active budgets overlapping this month and compare utilization percentage
    const currentMonthBudgets = allBudgets.filter((b) => {
      const bStart = new Date(b.startDate);
      const bEnd = new Date(b.endDate);
      return b.period === 'monthly' && bStart <= end && bEnd >= start;
    });

    const categoryBreakdownMap = categoryRows.reduce(
      (acc, row) => {
        acc[row.category] = row.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    let mostConsumedBudget = null;
    let maxUtilization = -1;

    for (const budget of currentMonthBudgets) {
      const spent = categoryBreakdownMap[budget.categoryId] || 0;
      const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      if (percentage > maxUtilization) {
        maxUtilization = percentage;
        mostConsumedBudget = {
          category: budget.categoryId,
          percentage,
        };
      }
    }

    // 9. Generate Monthly Trend data for the last 12 months
    const trendStartDate = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);
    const trendEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const historicalAggregates = await analyticsRepository.getMonthlyAggregatesInRange(
      userId,
      trendStartDate,
      trendEndDate
    );
    const aggregatesMap = new Map(historicalAggregates.map((a) => [a.month, a.amount]));

    const monthlyTrends: MonthlyTrend[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });
      const sqlMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Expenses in this month using O(1) map lookup
      const monthExpensesSum = aggregatesMap.get(sqlMonthKey) || 0;

      // Budgets active in this month
      const activeBudgetsInMonth = allBudgets.filter((b) => {
        const bStart = new Date(b.startDate);
        const bEnd = new Date(b.endDate);
        return b.period === 'monthly' && bStart <= mEnd && bEnd >= mStart;
      });
      const monthBudgetSum = activeBudgetsInMonth.reduce((sum, b) => sum + b.amount, 0);

      // Savings in this month
      const monthSavings = userSalary - monthExpensesSum;

      monthlyTrends.push({
        month: monthLabel,
        expenses: monthExpensesSum,
        budget: monthBudgetSum,
        savings: monthSavings,
      });
    }

    return {
      summary: {
        currentMonthSpend,
        previousMonthSpend,
        spendChangePercentage,
        monthlySavings,
        savingsRate,
        highestCategory,
        mostConsumedBudget,
      },
      categoryBreakdown,
      monthlyTrends,
    };
  }
}

export const analyticsService = new AnalyticsService();
