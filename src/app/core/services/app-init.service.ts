import { Injectable, inject, signal, effect, untracked } from '@angular/core';
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

  readonly isReady = signal(false);

  constructor() {
    effect(() => {
      // If already ready, only reset if user logs out
      if (this.isReady()) {
        if (!this.authService.currentUser() && this.authService.isInitialized()) {
          // Keep it ready for the login screen
        }
        return;
      }

      if (!this.authService.isInitialized()) return;

      if (!this.authService.currentUser()) {
        untracked(() => this.isReady.set(true));
        return;
      }

      const budgetsLoading = this.budgetService.isLoading();
      const expensesLoading = this.expenseService.isLoading();
      const goalsLoading = this.goalService.isLoading();
      const subscriptionsLoading = this.subscriptionService.isLoading();

      if (!budgetsLoading && !expensesLoading && !goalsLoading && !subscriptionsLoading) {
        untracked(() => this.isReady.set(true));
      }
    });
  }
}
