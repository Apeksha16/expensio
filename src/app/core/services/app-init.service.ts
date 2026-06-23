import { Injectable, inject, computed } from '@angular/core';
import { AuthService } from './auth.service';
import { BudgetService } from './budget.service';
import { ExpenseService } from './expense.service';
import { GoalService } from './goal.service';
import { SubscriptionService } from './subscription.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  private authService = inject(AuthService);
  private budgetService = inject(BudgetService);
  private expenseService = inject(ExpenseService);
  private goalService = inject(GoalService);
  private subscriptionService = inject(SubscriptionService);

  readonly isReady = computed(() => {
    // Wait for auth to be checked
    if (!this.authService.isInitialized()) {
      return false;
    }

    // If logged out, we are ready (shows login screen)
    if (!this.authService.currentUser()) {
      return true;
    }

    // If logged in, wait for all core data to finish loading
    const budgetsLoading = this.budgetService.isLoading();
    const expensesLoading = this.expenseService.isLoading();
    const goalsLoading = this.goalService.isLoading();
    const subscriptionsLoading = this.subscriptionService.isLoading();

    // If any service is still loading, the app is not ready
    if (budgetsLoading || expensesLoading || goalsLoading || subscriptionsLoading) {
      return false;
    }

    return true;
  });
}
