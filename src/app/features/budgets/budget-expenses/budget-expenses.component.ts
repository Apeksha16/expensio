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
import { AuthService } from '../../../core/services/auth.service';

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
        <!-- Top Summary Box -->
        <div class="bg-budget-primary/5 text-slate-800 p-6 rounded-[24px] shadow-sm border border-budget-primary/20 transition-all duration-300 relative overflow-hidden mb-2">
          <div class="relative z-10 flex flex-col gap-4">
            <!-- Header & Amount -->
            <div class="flex flex-col gap-1 mt-1">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-base text-slate-800">Total Spent</span>
                @if (!isVirtualOthers()) {
                  <span class="text-xs font-bold uppercase px-3 py-1 bg-budget-primary/10 text-budget-primary rounded-full">
                    Limit: {{ budgetAmount() | currency:'INR':'₹':'1.0-0' }}
                  </span>
                } @else {
                  <span class="text-xs font-bold uppercase px-3 py-1 bg-budget-primary/10 text-budget-primary rounded-full">
                    Unbudgeted
                  </span>
                }
              </div>
              <div class="flex items-baseline justify-center w-full mt-4">
                @if (budgetService.isLoading()) {
                  <div class="h-10 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
                } @else {
                  <span class="font-bold tracking-tight text-slate-900 leading-none text-center truncate text-[36px]">
                    {{ consumed() | currency:'INR':'₹':'1.0-0' }}
                  </span>
                }
              </div>
            </div>

            <!-- Progress Bar -->
            @if (!isVirtualOthers()) {
              <div class="flex flex-col gap-2 mt-4 pt-4 border-t border-budget-primary/10">
                <div class="flex justify-between items-center mb-1">
                   <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consumed</p>
                   <span class="text-xs font-bold text-slate-800">
                     {{ getPercent() | number:'1.0-0' }}%
                   </span>
                </div>
                <div class="h-2.5 w-full bg-budget-primary/10 rounded-full overflow-hidden flex relative z-10 shadow-inner">
                  <div
                    class="h-full transition-all duration-1000 ease-out rounded-full"
                    [style.width.%]="!budgetService.isLoading() && animateBars() ? getPercent() : 0"
                    [ngClass]="getColorClass()"
                  ></div>
                </div>
                <div class="flex justify-between items-center text-[10.5px] font-semibold mt-2">
                  @if (budgetAmount() - consumed() < 0) {
                    <span class="text-red-500">Overspent: {{ (consumed() - budgetAmount()) | currency:'INR':'₹':'1.0-0' }}</span>
                  } @else {
                    <span class="text-slate-600">Left: {{ (budgetAmount() - consumed()) | currency:'INR':'₹':'1.0-0' }}</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>

        @if (expenseService.isLoading() || budgetService.isLoading()) {
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="w-full bg-slate-50 rounded-2xl p-4 h-[88px] animate-pulse flex justify-between items-center border border-slate-100">
              <div class="flex flex-col gap-2 w-1/2">
                <div class="h-5 bg-slate-200 w-3/4"></div>
                <div class="h-3 bg-slate-200 w-1/2"></div>
              </div>
              <div class="h-6 bg-slate-200 w-16"></div>
            </div>
          }
        } @else {
          @if (budgetExpenses().length > 0) {
            @for (expense of budgetExpenses(); track expense.id) {
              <button
                (click)="editExpense(expense)"
                class="w-full bg-budget-primary/5 border border-budget-primary/20 rounded-[20px] p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
              >
                <!-- Icon -->
                <div class="flex items-center gap-3 shrink-0">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center" [ngClass]="budgetService.getCategoryTheme(expense.category).bg + ' ' + budgetService.getCategoryTheme(expense.category).text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path [attr.d]="budgetService.getCategoryIconPath(expense.category)"></path>
                    </svg>
                  </div>
                </div>

                <!-- Details -->
                <div class="flex flex-col gap-2 min-w-0 flex-1 ml-1">
                  <span class="font-bold text-[17px] text-slate-900 truncate leading-none mt-1">{{ expense.title }}</span>
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                    {{ expense.date | date: 'MMM d, h:mm a' }}
                  </span>
                </div>

                <!-- Amount & Payment Tag -->
                <div class="flex flex-col items-end gap-2 shrink-0">
                  <span class="font-extrabold text-[20px] text-slate-900 leading-none mt-1">
                    ₹{{ expense.amount % 1 === 0 ? (expense.amount | number: '1.0-0') : (expense.amount | number: '1.2-2') }}
                  </span>
                  <span class="text-[10.5px] font-bold uppercase text-slate-500 tracking-wide">
                    {{ formatPaymentMode(expense.paid_via) }}
                  </span>
                </div>
              </button>
            }
          } @else {
            <div class="mt-4 w-full bg-[#FCFCFD] border border-solid border-slate-100 shadow-sm rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
              <div class="w-12 h-12 bg-budget-primary/10 rounded-[14px] flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-budget-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    if (p >= 80) return 'bg-red-500';
    if (p >= 60) return 'bg-yellow-500';
    return 'bg-budget-primary';
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
      return 'border-expense-primary bg-expense-surface text-expense-dark';
    if (category === 'virtual-invest') {
      return 'border-goals-primary bg-goals-surface text-goals-dark';
    } else if (category.includes('(Group Split)')) {
      return 'border-friends-primary bg-friends-surface text-friends-dark';
    } else if (category.includes('(Split)')) {
      return 'border-splits-primary bg-splits-surface text-splits-dark';
    } else if (category.includes('(Subscription)')) {
      return 'border-subscriptions-primary bg-subscriptions-surface text-subscriptions-dark';
    }
    return 'border-expense-primary bg-expense-surface text-expense-dark';
  }

  formatPaymentMode(mode?: string): string {
    const m = (mode || 'UPI').toUpperCase();
    if (m.includes('CREDIT')) return 'CREDIT';
    if (m.includes('DEBIT')) return 'DEBIT';
    return m;
  }
}
