import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GoalService } from '../../../core/services/goal.service';
import { ExpenseService } from '../../../core/services/expense.service';

@Component({
  selector: 'app-goal-transactions',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full bg-gray-50',
  },
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col h-full relative">
      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 pb-36">
        @if (goalService.isLoading() || expenseService.isLoading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="w-full bg-gray-200 rounded-none h-[72px] animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="mb-6 bg-goals-primary text-white p-6 relative overflow-hidden rounded-none">
            <div class="relative z-10 flex flex-col">
              <span
                class="text-[10px] font-bold text-goals-surface opacity-80 uppercase tracking-widest"
                >Saved Amount</span
              >
              <span class="text-3xl font-extrabold tracking-tight"
                >₹{{ $safeNavigationMigration(goal()?.saved_amount) | number: '1.0-0' }}</span
              >
              <span class="text-[10px] font-bold text-white uppercase tracking-widest mt-1"
                >Goal: ₹{{ $safeNavigationMigration(goal()?.total_amount) | number: '1.0-0' }}</span
              >
            </div>

            <div class="w-full bg-white/20 h-2 mt-5 overflow-hidden rounded-none">
              <div
                class="h-full bg-white transition-all duration-500 origin-left animate-[fillProgress_1s_ease-out]"
                [style.width.%]="getProgress()"
              ></div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <h3
              class="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest px-1 mb-1"
            >
              Transactions
            </h3>

            @if (transactions().length > 0) {
              @for (tx of transactions(); track tx.id; let i = $index) {
                <button
                  (click)="editTransaction(tx)"
                  class="w-full bg-white border-2 border-gray-100 p-4 flex items-center justify-between gap-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <div class="flex items-center gap-4 min-w-0">
                    <div
                      class="w-10 h-10 bg-green-50 text-green-600 rounded-none border border-green-200 flex items-center justify-center shrink-0"
                    >
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="font-bold text-gray-900 truncate">{{
                        getTransactionName(i)
                      }}</span>
                      <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{
                        tx.date | date: 'MMM d, y, h:mm a'
                      }}</span>
                    </div>
                  </div>
                  <span class="font-extrabold text-green-600 shrink-0"
                    >+₹{{ tx.amount | number: '1.0-0' }}</span
                  >
                </button>
              }
            } @else {
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <div
                  class="w-16 h-16 bg-gray-200 rounded-none border-2 border-gray-300 flex items-center justify-center mb-4"
                >
                  <svg
                    class="w-8 h-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <p class="text-gray-500 font-extrabold text-lg">No funds added</p>
                <p
                  class="text-gray-400 font-bold text-[11px] uppercase tracking-widest mt-1 max-w-[200px]"
                >
                  Add funds to see history here.
                </p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class GoalTransactionsComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  goalService = inject(GoalService);
  expenseService = inject(ExpenseService);

  goalId = computed(() => this.route.snapshot.paramMap.get('id'));

  goal = computed(() => {
    return this.goalService.goals().find((g) => g.id === this.goalId());
  });

  transactions = computed(() => {
    const currentGoal = this.goal();
    if (!currentGoal) return [];

    // Support both old 'Goal: [Name]' and new '[Name]' formats
    return this.expenseService['allExpenses']().filter(
      (e) =>
        e.category === 'virtual-invest' &&
        (e.title === currentGoal.name || e.title === `Goal: ${currentGoal.name}`),
    );
  });

  getProgress(): number {
    const g = this.goal();
    if (!g || !g.total_amount) return 0;
    return Math.min(100, Math.round((g.saved_amount / g.total_amount) * 100));
  }

  getTransactionName(index: number): string {
    const total = this.transactions().length;
    const currentGoal = this.goal();
    // Assuming transactions are sorted descending by date
    return `${currentGoal?.name || 'Transaction'} ${total - index}`;
  }

  editTransaction(tx: any) {
    const g = this.goal();
    if (g) {
      this.goalService.openAddFundsSheet(g, tx);
    }
  }

  getGoalIconPath(iconPath: string): string {
    const defaultPremiumPath =
      'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5';
    if (
      !iconPath ||
      iconPath.startsWith('M20 12v10H4V12') ||
      iconPath.startsWith('M2.25 18L9 11.25')
    ) {
      return defaultPremiumPath;
    }
    return iconPath;
  }
}
