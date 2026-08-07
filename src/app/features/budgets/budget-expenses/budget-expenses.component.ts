import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="h-full bg-white flex flex-col relative w-full overflow-hidden">
      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pb-28 pt-4 flex flex-col gap-3">
        <div class="bg-emerald-600 text-white p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden shrink-0 shadow-lg shadow-emerald-600/20 mb-2">
          <!-- Abstract Decoration -->
          <div class="flex justify-between items-end relative z-10">
            <div class="flex flex-col">
              @if (budgetService.isLoading()) {
                <div class="h-4 w-24 bg-gray-800 animate-pulse rounded mb-1"></div>
                <div class="h-10 w-32 bg-gray-800 animate-pulse rounded mt-1"></div>
              } @else {
                <span class="text-[10px] font-black text-emerald-100/70 uppercase tracking-widest mb-1">
                  {{ budgetName() }}
                </span>
                <span class="text-4xl font-black tracking-tight">
                  ₹{{ consumed() | number: '1.0-0' }}
                </span>
              }
            </div>
            <div class="text-right flex flex-col">
              @if (budgetService.isLoading()) {
                <div class="h-4 w-16 bg-gray-800 animate-pulse rounded mb-1 self-end"></div>
                <div class="h-5 w-20 bg-gray-800 animate-pulse rounded mt-1 self-end"></div>
              } @else {
                @if (isVirtualOthers()) {
                  <span class="text-[10px] font-black text-emerald-100/70 uppercase tracking-widest">
                    Unbudgeted
                  </span>
                } @else {
                  <span class="text-[10px] font-black text-emerald-100/70 uppercase tracking-widest">
                    Limit
                  </span>
                  <span class="text-sm font-black text-white mt-1">
                    ₹{{ budgetAmount() | number: '1.0-0' }}
                  </span>
                }
              }
            </div>
          </div>

          <!-- Progress Bar -->
          @if (!isVirtualOthers()) {
            <div class="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex relative z-10 border border-gray-700">
              <div
                class="h-full transition-all duration-1000 ease-out rounded-full"
                [style.width.%]="!budgetService.isLoading() && animateBars() ? getPercent() : 0"
                [ngClass]="getColorClass()"
              ></div>
            </div>
          }
        </div>

        @if (expenseService.isLoading() || budgetService.isLoading()) {
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="w-full bg-gray-100 rounded-2xl p-4 h-[88px] animate-pulse flex justify-between items-center border-2 border-gray-200">
              <div class="flex flex-col gap-2 w-1/2">
                <div class="h-5 bg-gray-200 w-3/4"></div>
                <div class="h-3 bg-gray-200 w-1/2"></div>
              </div>
              <div class="h-6 bg-gray-200 w-16"></div>
            </div>
          }
        } @else {
          @if (budgetExpenses().length > 0) {
            @for (expense of budgetExpenses(); track expense.id) {
              <button
                (click)="editExpense(expense)"
                class="w-full bg-budget-primary/[0.03] border border-budget-primary/10 rounded-[20px] p-4 flex justify-between items-center text-left shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-md hover:bg-budget-primary/[0.06] transition-all active:scale-[0.99]"
              >
                <div class="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                  <span class="font-extrabold text-base text-gray-900 truncate">{{ expense.title }}</span>
                  <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest min-w-0 text-gray-500">
                    <span class="truncate">{{ expense.category }}</span>
                    <span class="flex-shrink-0 border-l-2 border-gray-300 h-3"></span>
                    <span class="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      {{ expense.date | date: 'MMM d, y • h:mm a' }}
                    </span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2 flex-shrink-0">
                  <span class="font-black text-lg text-black">
                    ₹{{ expense.amount | number: '1.0-0' }}
                  </span>
                  <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {{ expense.paid_via }}
                  </span>
                </div>
              </button>
            }
          } @else {
            <div class="mt-4 w-full bg-[#FCFCFD] border border-dashed border-gray-200 rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
              <div class="w-12 h-12 bg-indigo-50 rounded-[14px] flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-[#5421E6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h4 class="text-sm font-bold text-slate-800 mb-1">No expenses</h4>
              <p class="text-xs text-slate-500 max-w-[250px]">
                You haven't added any expenses for this budget yet.
              </p>
            </div>
          }
        }
      </main>
    </div>
  `,
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
    const budget = this.budgetService.budgets().find((b) => b.name === this.budgetName());
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
    return this.expenseService['allExpenses']().filter((e) => {
      const eCat = e.category.toLowerCase();
      return (
        eCat === catLower ||
        eCat === `${catLower} (split)` ||
        eCat === `${catLower} (group split)` ||
        eCat === `${catLower} (subscription)`
      );
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
      const goalName = expense.title.startsWith('Goal: ')
        ? expense.title.replace('Goal: ', '')
        : expense.title;
      const goal = this.goalService.goals().find((g) => g.name === goalName);
      if (goal) {
        this.goalService.openAddFundsSheet(goal, expense);
      } else {
        this.toastService.showError('Goal not found.');
      }
      return;
    }

    if (expense.category.includes('(Subscription)')) {
      const sub = this.subscriptionService.subscriptions().find((s) => s.title === expense.title);
      if (sub) {
        this.subscriptionService.openBottomSheet(sub);
      } else {
        this.toastService.showError('Subscription not found.');
      }
      return;
    }

    if (expense.id.startsWith('split_')) {
      const splitId = expense.id.replace('split_', '');
      const existingSplit = this.splitService.splits().find((s) => s.id === splitId);
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
    if (!category)
      return 'border-expense-primary bg-expense-surface hover:bg-expense-light text-expense-dark';
    if (category === 'virtual-invest') {
      return 'border-goals-primary bg-goals-surface hover:bg-goals-light text-goals-dark';
    } else if (category.includes('(Group Split)')) {
      return 'border-friends-primary bg-friends-surface hover:bg-friends-light text-friends-dark';
    } else if (category.includes('(Split)')) {
      return 'border-splits-primary bg-splits-surface hover:bg-splits-light text-splits-dark';
    } else if (category.includes('(Subscription)')) {
      return 'border-subscriptions-primary bg-subscriptions-surface hover:bg-subscriptions-light text-subscriptions-dark';
    }
    return 'border-expense-primary bg-expense-surface hover:bg-expense-light text-expense-dark';
  }
}
