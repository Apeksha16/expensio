import { db } from '../../db/index.js';
import { recurringExpenses } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';

export class SubscriptionAnalyticsService {
  async getSubscriptionInsights(userId: string) {
    const subscriptions = await db
      .select()
      .from(recurringExpenses)
      .where(and(eq(recurringExpenses.userId, userId), eq(recurringExpenses.type, 'subscription')));

    const activeSubscriptions = subscriptions.filter((s) => s.status === 'active');

    // Calculate Monthly Commitment
    let totalMonthlyCommitment = 0;
    let totalAnnualCommitment = 0;

    activeSubscriptions.forEach((sub) => {
      let monthly = sub.amount;
      switch (sub.frequency) {
        case 'daily':
          monthly = sub.amount * 30.44;
          break;
        case 'weekly':
          monthly = sub.amount * 4.33;
          break;
        case 'monthly':
          monthly = sub.amount;
          break;
        case 'quarterly':
          monthly = sub.amount / 3;
          break;
        case 'yearly':
          monthly = sub.amount / 12;
          break;
      }
      totalMonthlyCommitment += monthly;
      totalAnnualCommitment += monthly * 12;
    });

    const upcomingRenewals = activeSubscriptions
      .filter((s) => s.nextGenerationDate)
      .sort(
        (a, b) =>
          new Date(a.nextGenerationDate).getTime() - new Date(b.nextGenerationDate).getTime()
      )
      .slice(0, 5);

    return {
      totalActive: activeSubscriptions.length,
      totalMonthlyCommitment: Math.round(totalMonthlyCommitment),
      totalAnnualCommitment: Math.round(totalAnnualCommitment),
      upcomingRenewals,
    };
  }
}

export const subscriptionAnalyticsService = new SubscriptionAnalyticsService();
