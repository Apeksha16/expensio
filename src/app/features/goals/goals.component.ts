import { Component, inject, signal, computed } from '@angular/core';
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
  template: `
    <div class="h-full bg-gray-50 p-4 flex flex-col gap-4">
      @if (goalService.isLoading()) {
        <!-- Shimmer -->
        <div class="flex flex-col gap-1.5 pb-36 mt-2">
          @for (i of [1, 2, 3]; track i) {
            <div class="w-full bg-gray-200 rounded-none p-4 flex items-center gap-4 h-[100px] animate-pulse">
              <div class="h-10 w-10 bg-gray-300 rounded-full shrink-0"></div>
              <div class="flex flex-col gap-2 flex-1">
                <div class="h-4 bg-gray-300 w-1/3"></div>
                <div class="h-3 bg-gray-300 w-1/2"></div>
                <div class="h-2 bg-gray-300 w-full mt-2"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="flex-1 flex flex-col gap-3 pb-36 mt-2">
          @if (activeGoals().length > 0) {
            @for (goal of activeGoals(); track goal.id) {
              <button
                (click)="openTransactions(goal.id)"
                class="w-full bg-white border-2 border-black rounded-none p-4 flex flex-col gap-3 text-left hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-black text-white flex items-center justify-center shrink-0 rounded-none">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                      <path [attr.d]="getGoalIconPath(goal.icon)"></path>
                    </svg>
                  </div>
                  <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                    <span class="font-extrabold text-lg text-black truncate">{{ goal.name }}</span>
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Target: {{ goal.target_date | date:'MMM yyyy' }}</span>
                  </div>
                  <div class="flex flex-col items-end shrink-0">
                    <span class="font-extrabold text-lg text-black">₹{{ goal.calculated_installment | number: '1.0-0' }}</span>
                    <span class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{{ goal.frequency }}</span>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="w-full flex flex-col gap-1 mt-1">
                  <div class="flex justify-between text-[10px] font-bold text-black uppercase tracking-widest">
                    <span>₹{{ goal.saved_amount | number: '1.0-0' }} Saved</span>
                    <span>₹{{ goal.total_amount | number: '1.0-0' }} Goal</span>
                  </div>
                  <div class="h-2 w-full bg-gray-200 border border-gray-300 overflow-hidden">
                    <div class="h-full bg-black transition-all duration-500 origin-left animate-[fillProgress_1s_ease-out]" [style.width.%]="getProgress(goal)"></div>
                  </div>
                </div>

                <div class="flex justify-between items-center w-full gap-2 mt-2 pt-3 border-t border-gray-100">
                  @if (paidGoalsThisMonth().has(goal.id)) {
                    <span class="text-[10px] font-extrabold text-green-600 uppercase tracking-widest flex items-center gap-1">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                      Paid this month
                    </span>
                  } @else if (goalService.isGoalDueThisMonth(goal)) {
                    <span class="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                      Due · ₹{{ goal.calculated_installment | number: '1.0-0' }}
                    </span>
                  } @else {
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      No Payment Due
                    </span>
                  }
                  <button
                    (click)="addFunds($event, goal)"
                    class="bg-black text-white px-4 py-1.5 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    Add Funds
                  </button>
                </div>
              </button>
            }
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p class="text-gray-500 font-extrabold text-xl">No active goals</p>
              <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                Tap the + button to create a new savings goal.
              </p>
            </div>
          }
          
          @if (archivedGoals().length > 0) {
            <div class="mt-8 mb-4">
               <h3 class="font-extrabold text-black uppercase tracking-widest text-sm">Archived Goals</h3>
            </div>
            @for (goal of archivedGoals(); track goal.id) {
              <div class="w-full bg-white border-2 border-black rounded-none p-4 flex flex-col gap-3 text-left opacity-75">
                <div class="flex justify-between items-center w-full pb-3 border-b border-gray-100">
                  <span class="font-black text-green-600 uppercase tracking-widest text-xs flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Goal Achieved 🎉
                  </span>
                </div>
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-black text-white flex items-center justify-center shrink-0 rounded-none">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                      <path [attr.d]="getGoalIconPath(goal.icon)"></path>
                    </svg>
                  </div>
                  <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                    <span class="font-extrabold text-lg text-black truncate">{{ goal.name }}</span>
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Achieved</span>
                  </div>
                  <div class="flex flex-col items-end shrink-0">
                    <span class="font-extrabold text-lg text-black">₹{{ goal.total_amount | number: '1.0-0' }}</span>
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

  activeGoals = computed(() => this.goalService.goals().filter(g => g.saved_amount < g.total_amount || g.total_amount === 0));
  archivedGoals = computed(() => this.goalService.goals().filter(g => g.saved_amount >= g.total_amount && g.total_amount > 0));

  paidGoalsThisMonth = computed(() => {
    const month = this.expenseService.activeMonth();
    const ids = this.expenseService.allExpenses()
      .filter(e => e.category === 'virtual-invest' && e.date.startsWith(month))
      .map(e => {
         if (e.goal_id) return e.goal_id;
         // Fallback for older expenses
         const title = e.title.startsWith('Goal: ') ? e.title.replace('Goal: ', '') : e.title;
         const matchingGoal = this.goalService.goals().find(g => g.name === title);
         return matchingGoal ? matchingGoal.id : null;
      })
      .filter(id => id !== null);
    return new Set(ids);
  });

  getProgress(goal: Goal): number {
    if (!goal.total_amount) return 0;
    return Math.min(100, Math.round((goal.saved_amount / goal.total_amount) * 100));
  }

  getGoalIconPath(iconPath: string): string {
    const defaultPremiumPath = 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5';
    // Automatically upgrade old, generic icons (gift box or line chart) to the new premium Target icon
    if (!iconPath || iconPath.startsWith('M20 12v10H4V12') || iconPath.startsWith('M2.25 18L9 11.25')) {
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
