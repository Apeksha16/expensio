import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BudgetService } from '../../../core/services/budget.service';
import { ExpenseService, Expense } from '../../../core/services/expense.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { SplitService } from '../../../core/services/split.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';
import { GoalService } from '../../../core/services/goal.service';
import { SubscriptionService } from '../../../core/services/subscription.service';

@Component({
  selector: 'app-budget-expenses',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  template: `
    <div class="h-full bg-gray-50 flex flex-col relative w-full overflow-hidden">
      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto bg-gray-50 relative pb-20 p-4 flex flex-col gap-1.5">
        <div class="bg-budget-primary text-white p-5 rounded-none flex flex-col gap-4 relative overflow-hidden shrink-0 mb-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <!-- Abstract Decoration -->
          <div class="absolute -right-10 -top-10 w-32 h-32 bg-gray-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>

          <div class="flex justify-between items-end relative z-10">
            <div class="flex flex-col">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{{ budgetName() }}</span>
              <span class="text-4xl font-extrabold tracking-tight">₹{{ consumed() | number: '1.0-0' }}</span>
            </div>
            <div class="text-right flex flex-col">
              @if (isVirtualOthers()) {
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unbudgeted</span>
              } @else {
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Limit</span>
                <span class="text-sm font-extrabold text-gray-300">₹{{ budgetAmount() | number: '1.0-0' }}</span>
              }
            </div>
          </div>

          <!-- Progress Bar -->
          @if (!isVirtualOthers()) {
            <div class="h-2 w-full bg-gray-800 rounded-none overflow-hidden flex relative z-10">
              <div
                class="h-full transition-all duration-1000 ease-out"
                [style.width.%]="!budgetService.isLoading() && animateBars() ? getPercent() : 0"
                [ngClass]="getColorClass()"
              ></div>
            </div>
          }
        </div>

        @if (expenseService.isLoading() || budgetService.isLoading()) {
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="w-full bg-gray-200 rounded-none p-3 h-20 animate-pulse flex justify-between items-center">
              <div class="flex flex-col gap-2 w-1/2">
                <div class="h-4 bg-gray-300 w-3/4"></div>
                <div class="h-3 bg-gray-300 w-1/2"></div>
              </div>
              <div class="h-6 bg-gray-300 w-16"></div>
            </div>
          }
        } @else {
          @if (budgetExpenses().length > 0) {
            @for (expense of budgetExpenses(); track expense.id) {
              <button
                (click)="editExpense(expense)"
                class="w-full bg-gray-200 rounded-none p-3 flex justify-between items-center text-left hover:bg-gray-300 transition-colors active:bg-gray-400 border-l-4"
                [ngClass]="getCategoryColor(expense.category)"
              >
                <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                  <span class="font-extrabold text-lg text-black truncate">{{ expense.title }}</span>
                  <div class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest min-w-0">
                    <span class="truncate">{{ expense.category }}</span>
                    <span class="flex-shrink-0">•</span>
                    <span class="whitespace-nowrap flex-shrink-0">{{ expense.date | date: 'MMM d, h:mm a' }}</span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2 flex-shrink-0">
                  <span class="font-extrabold text-xl">₹{{ expense.amount | number: '1.2-2' }}</span>
                </div>
              </button>
            }
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center mt-12">
              <div class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p class="text-gray-500 font-extrabold text-xl">No expenses</p>
              <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                You haven't added any expenses for this budget yet.
              </p>
            </div>
          }
        }
      </main>
    </div>
  `
})
export class BudgetExpenses implements OnInit {
  route = inject(ActivatedRoute);
  router = inject(Router);
  location = inject(Location);
  budgetService = inject(BudgetService);
  expenseService = inject(ExpenseService);
  keyboardService = inject(KeyboardService);
  splitService = inject(SplitService);
  supabaseService = inject(SupabaseService);
  toastService = inject(ToastService);
  goalService = inject(GoalService);
  subscriptionService = inject(SubscriptionService);

  budgetName = signal<string>('');
  animateBars = signal(false);

  budgetAmount = computed(() => {
    const budget = this.budgetService.budgets().find(b => b.name === this.budgetName());
    return budget ? budget.amount + (budget.rollover_amount || 0) : 0;
  });

  consumed = computed(() => {
    return this.getConsumed();
  });

  isVirtualOthers = computed(() => {
    return this.budgetName() === 'Others' && this.budgetAmount() === 0;
  });

  budgetExpenses = computed(() => {
    const name = this.budgetName();
    if (!name) return [];
    
    const catLower = name.toLowerCase();
    // Use allExpenses to bypass the 15-item master list pagination limit
    return this.expenseService['allExpenses']().filter(e => {
      const eCat = e.category.toLowerCase();
      return eCat === catLower || eCat === `${catLower} (split)` || eCat === `${catLower} (group split)` || eCat === `${catLower} (subscription)`;
    });
  });

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const name = params.get('name');
      if (name) {
        this.budgetName.set(name);
      }
    });

    setTimeout(() => {
      this.animateBars.set(true);
    }, 100);
  }

  getConsumed(): number {
    return this.expenseService.getConsumedForCategory(this.budgetName());
  }

  getPercent(): number {
    const total = this.budgetAmount();
    if (!total) return 0;
    const consumed = this.getConsumed();
    return Math.min(100, (consumed / total) * 100);
  }

  getColorClass(): string {
    const p = this.getPercent();
    if (p >= 80) return 'bg-red-600';
    if (p >= 60) return 'bg-yellow-500';
    return 'bg-white'; // the background is black, so white bar looks better, or matching main page
  }

  async editExpense(expense: Expense) {
    if (expense.category === 'virtual-invest') {
      const goalName = expense.title.startsWith('Goal: ') ? expense.title.replace('Goal: ', '') : expense.title;
      const goal = this.goalService.goals().find(g => g.name === goalName);
      if (goal) {
        this.goalService.openAddFundsSheet(goal, expense);
      } else {
        this.toastService.showError('Goal not found.');
      }
      return;
    }

    if (expense.category.includes('(Subscription)')) {
      const sub = this.subscriptionService.subscriptions().find(s => s.title === expense.title);
      if (sub) {
        this.subscriptionService.openBottomSheet(sub);
      } else {
        this.toastService.showError('Subscription not found.');
      }
      return;
    }

    if (expense.id.startsWith('split_')) {
      const splitId = expense.id.replace('split_', '');
      const existingSplit = this.splitService.splits().find(s => s.id === splitId);
      if (existingSplit) {
        this.splitService.openAddSplitSheet(existingSplit);
      } else {
        // Fallback if not loaded
        const { data, error } = await this.supabaseService.client
          .from('split_expenses')
          .select('*')
          .eq('id', splitId)
          .single();
          
        if (!error && data) {
          this.splitService.openAddSplitSheet(data as any);
        } else {
          this.toastService.showError("Couldn't load split expense.");
        }
      }
      return;
    }
    this.expenseService.openBottomSheet(expense);
  }

  getCategoryColor(category: string): string {
    if (!category) return 'border-black';
    if (category === 'virtual-invest') {
      return 'border-amber-500';
    } else if (category.includes('(Group Split)')) {
      return 'border-teal-500';
    } else if (category.includes('(Split)')) {
      return 'border-blue-600';
    } else if (category.includes('(Subscription)')) {
      return 'border-pink-500';
    }
    return 'border-black';
  }
}
