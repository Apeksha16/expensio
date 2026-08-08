import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GoalService, Goal } from '../../core/services/goal.service';
import { ExpenseService } from '../../core/services/expense.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { AddFundsSheetComponent } from '../../shared/ui/add-funds-sheet/add-funds-sheet.component';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="h-full bg-white p-4 flex flex-col gap-4">
      @if (goalService.isLoading()) {
        <!-- Shimmer -->
        <div class="flex flex-col gap-3 pb-28 mt-2">
          @for (i of [1, 2, 3]; track i) {
            <div class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 h-[100px] animate-pulse">
              <div class="h-10 w-10 bg-slate-200 rounded-xl shrink-0 border border-gray-300"></div>
              <div class="flex flex-col gap-2 flex-1">
                <div class="h-4 bg-slate-200 w-1/3"></div>
                <div class="h-3 bg-slate-200 w-1/2"></div>
                <div class="h-2 bg-slate-200 w-full mt-2"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <!-- Top Summary Box -->
        <div class="bg-white text-gray-900 border border-slate-100 p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden shadow-sm mt-2">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Total Goals Savings
          </span>
          <span class="text-4xl font-extrabold tracking-tight text-gray-900">
            ₹{{ goalService.totalSaved() | number: '1.0-0' }}
          </span>
        </div>

        <div class="flex-1 flex flex-col gap-4 pb-28 mt-2">
          @if (activeGoals().length > 0) {
            @for (goal of activeGoals(); track goal.id) {
              <button
                (click)="openTransactions(goal.id)"
                class="w-full bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 text-left shadow-sm transition-all active:scale-[0.99]"
              >
                <div class="flex items-start gap-4 w-full">
                  <div class="w-12 h-12 bg-goals-primary/10 border border-goals-primary/20 text-goals-primary flex items-center justify-center shrink-0 rounded-xl">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                      <path [attr.d]="getGoalIconPath(goal.icon)"></path>
                    </svg>
                  </div>
                  <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                    <span class="font-extrabold text-lg text-gray-900 truncate">{{ goal.name }}</span>
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Target: {{ goal.target_date | date: 'MMM yyyy' }}
                    </span>
                  </div>
                  <div class="flex flex-col items-end shrink-0">
                    <span class="font-extrabold text-lg text-gray-900">
                      ₹{{ goal.calculated_installment | number: '1.0-0' }}
                    </span>
                    <span class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      {{ goal.frequency }}
                    </span>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="w-full flex flex-col gap-1 mt-1">
                  <div class="flex justify-between text-xs font-bold text-gray-700 uppercase tracking-widest">
                    <span>₹{{ goal.saved_amount | number: '1.0-0' }} Saved</span>
                    <span>₹{{ goal.total_amount | number: '1.0-0' }} Goal</span>
                  </div>
                  <div class="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-goals-primary transition-all duration-500 origin-left animate-[fillProgress_1s_ease-out]"
                      [style.width.%]="getProgress(goal)"
                    ></div>
                  </div>
                </div>

                <div class="flex justify-between items-center w-full gap-2 mt-2 pt-3 border-t border-slate-100 border-dashed">
                  @if (paidGoalsThisMonth().has(goal.id)) {
                    <span class="text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1 border border-emerald-200 bg-emerald-50 px-2 py-1 rounded">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                      Paid this month
                    </span>
                  } @else if (goalService.isGoalDueThisMonth(goal)) {
                    <span class="text-xs font-bold text-red-700 uppercase tracking-widest border border-red-200 bg-red-50 px-2 py-1 rounded">
                      Due · ₹{{ goal.calculated_installment | number: '1.0-0' }}
                    </span>
                  } @else {
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded border border-slate-100">
                      No Payment Due
                    </span>
                  }
                  <button
                    (click)="addFunds($event, goal)"
                    class="bg-goals-primary text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md active:scale-[0.95] transition-all flex items-center gap-2"
                  >
                    Add Funds
                  </button>
                </div>
              </button>
            }
          } @else {
            <div class="mt-4 w-full bg-[#FCFCFD] border border-solid border-slate-100 shadow-sm rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
              <div class="w-12 h-12 bg-goals-primary/10 rounded-[14px] flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-goals-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h4 class="text-sm font-bold text-slate-800 mb-1">No active goals</h4>
              <p class="text-xs text-slate-500 max-w-[250px]">
                Tap the + button to create a new savings goal.
              </p>
            </div>
          }

          @if (archivedGoals().length > 0) {
            <div class="mt-6 mb-2">
              <h3 class="font-bold text-gray-700 uppercase tracking-widest text-sm px-1">
                Archived Goals
              </h3>
            </div>
            @for (goal of archivedGoals(); track goal.id) {
              <div class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 text-left opacity-75">
                <div class="flex justify-between items-center w-full pb-3 border-b border-slate-100 border-dashed">
                  <span class="font-bold text-goals-primary uppercase tracking-widest text-xs flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Goal Achieved 🎉
                  </span>
                </div>
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-slate-200 text-gray-500 border border-gray-300 flex items-center justify-center shrink-0 rounded-xl">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                      <path [attr.d]="getGoalIconPath(goal.icon)"></path>
                    </svg>
                  </div>
                  <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                    <span class="font-extrabold text-lg text-gray-900 truncate">{{ goal.name }}</span>
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">Achieved</span>
                  </div>
                  <div class="flex flex-col items-end shrink-0">
                    <span class="font-extrabold text-lg text-gray-900">₹{{ goal.total_amount | number: '1.0-0' }}</span>
                    <span class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Total</span>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      }
    </div>
  `,
})
export class GoalsComponent {
  goalService = inject(GoalService);
  expenseService = inject(ExpenseService);
  confirmService = inject(ConfirmService);
  router = inject(Router);

  activeGoals = computed(() =>
    this.goalService.goals().filter((g) => g.saved_amount < g.total_amount || g.total_amount === 0),
  );
  archivedGoals = computed(() =>
    this.goalService.goals().filter((g) => g.saved_amount >= g.total_amount && g.total_amount > 0),
  );

  paidGoalsThisMonth = computed(() => {
    const month = this.expenseService.activeMonth();
    const ids = this.expenseService
      .allExpenses()
      .filter((e) => e.category === 'virtual-invest' && e.date.startsWith(month))
      .map((e) => {
        if (e.goal_id) return e.goal_id;
        // Fallback for older expenses
        const title = e.title.startsWith('Goal: ') ? e.title.replace('Goal: ', '') : e.title;
        const matchingGoal = this.goalService.goals().find((g) => g.name === title);
        return matchingGoal ? matchingGoal.id : null;
      })
      .filter((id) => id !== null);
    return new Set(ids);
  });

  getProgress(goal: Goal): number {
    if (!goal.total_amount) return 0;
    return Math.min(100, Math.round((goal.saved_amount / goal.total_amount) * 100));
  }

  getGoalIconPath(iconPath: string): string {
    const defaultPremiumPath =
      'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5';
    // Automatically upgrade old, generic icons (gift box or line chart) to the new premium Target icon
    if (
      !iconPath ||
      iconPath.startsWith('M20 12v10H4V12') ||
      iconPath.startsWith('M2.25 18L9 11.25')
    ) {
      return defaultPremiumPath;
    }
    return iconPath;
  }

  addFunds(event: Event, goal: Goal) {
    event.stopPropagation();
    this.goalService.openAddFundsSheet(goal);
  }

  openTransactions(id: string) {
    this.router.navigate(['/goals', id]);
  }

  getDueMessage(installmentDate: number): string {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const actualDueDay = Math.min(installmentDate, daysInMonth);

    const dueDate = new Date(currentYear, currentMonth, actualDueDay);
    const today = new Date(currentYear, currentMonth, now.getDate());

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `Due in ${diffDays} day(s)`;
    } else if (diffDays === 0) {
      return 'Due Today';
    } else {
      return `Overdue by ${Math.abs(diffDays)} day(s)`;
    }
  }

  getDueMessageClass(installmentDate: number): string {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const actualDueDay = Math.min(installmentDate, daysInMonth);

    const dueDate = new Date(currentYear, currentMonth, actualDueDay);
    const today = new Date(currentYear, currentMonth, now.getDate());

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return 'text-orange-600';
    } else if (diffDays === 0) {
      return 'text-red-500';
    } else {
      return 'text-red-600 font-extrabold';
    }
  }
}
