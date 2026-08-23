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
    class: 'block h-full bg-slate-50',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="flex flex-col h-full relative bg-white">
      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 pb-28">
        @if (goalService.isLoading() || expenseService.isLoading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="w-full bg-slate-50 border border-slate-100 rounded-2xl h-[72px] animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="mb-6 bg-white border border-slate-100 text-gray-900 p-6 relative overflow-hidden rounded-2xl shadow-sm">
            <div class="flex flex-col gap-1 relative z-10">
              <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Goal Saved
              </span>
              <span class="font-extrabold text-4xl tracking-tight text-gray-900">
                ₹{{ $safeNavigationMigration(goal()?.saved_amount) | number: '1.0-0' }}
              </span>
              <span class="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">
                Goal: ₹{{ $safeNavigationMigration(goal()?.total_amount) | number: '1.0-0' }}
              </span>
            </div>

            <div class="w-full bg-slate-50 h-2 mt-5 overflow-hidden rounded-full">
              <div
                class="h-full bg-emerald-500 transition-all duration-500 origin-left animate-[fillProgress_1s_ease-out] rounded-full"
                [style.width.%]="getProgress()"
              ></div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <h3 class="text-xs font-black text-gray-500 uppercase tracking-widest px-1 mb-1">
              Transactions
            </h3>

            @if (transactions().length > 0) {
              @for (tx of transactions(); track tx.id; let i = $index) {
                <button
                  (click)="editTransaction(tx)"
                  class="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4 text-left shadow-sm active:scale-[0.99] transition-all"
                >
                  <div class="flex items-center gap-4 flex-1 min-w-0">
                    <div class="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200 flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="font-extrabold text-base text-gray-900 truncate">Deposit</span>
                      <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{{ tx.date | date: 'MMM d, h:mm a' }}</span>
                    </div>
                  </div>
                  <span class="font-extrabold text-lg text-emerald-600">
                    +₹{{ tx.amount | number: '1.0-0' }}
                  </span>
                </button>
              }
            } @else {
              <div class="mt-4 w-full bg-[#FCFCFD] border border-solid border-slate-100 shadow-sm rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
                <div class="w-12 h-12 bg-goals-primary/10 rounded-[14px] flex items-center justify-center mb-3">
                  <svg class="w-6 h-6 text-goals-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 class="text-sm font-bold text-slate-800 mb-1">No funds added</h4>
                <p class="text-xs text-slate-500 max-w-[250px]">
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
