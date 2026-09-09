import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService, Expense } from '../../core/services/expense.service';
import { MonthPickerService } from '../../core/services/month-picker.service';
import { ToastService } from '../../core/services/toast.service';
import { KeyboardService } from '../../core/services/keyboard.service';
import { SplitService } from '../../core/services/split.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { GoalService } from '../../core/services/goal.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { BudgetService } from '../../core/services/budget.service';
import { AuthService } from '../../core/services/auth.service';
import { AccountTrackerService } from '../../core/services/account-tracker.service';
import { IconService } from '../../core/services/icon.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div
      class="h-full bg-white flex flex-col overflow-hidden select-none font-sans"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd($event)"
    >
      <!-- Pull to Refresh Indicator -->
      <div
        class="w-full shrink-0 flex justify-center items-center overflow-hidden transition-all duration-200 ease-out"
        [style.height.px]="refreshing() ? 60 : pullDistance()"
      >
        @if (refreshing()) {
          <svg
            class="animate-spin h-6 w-6 text-slate-800"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        } @else if (pullDistance() > 0) {
          <div class="text-xs font-bold text-slate-500 uppercase tracking-widest flex flex-col items-center gap-1">
            <svg
              class="w-5 h-5 transition-transform"
              [class.rotate-180]="pullDistance() > 60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
            {{ pullDistance() > 60 ? 'Release to refresh' : 'Pull to refresh' }}
          </div>
        }
      </div>

      <div class="px-5 pt-5 pb-2 shrink-0">
        @if (expenseService.isLoading()) {
          <!-- Skeleton Loader -->
          <div class="bg-slate-50/50 p-6 rounded-[24px] shadow-sm border border-slate-100 relative overflow-hidden">
            <div class="flex flex-col gap-1">
              <div class="h-[14px] bg-slate-200 w-24 animate-pulse rounded-full"></div>
              <div class="h-8 bg-slate-200 w-32 animate-pulse rounded-lg mt-0.5"></div>
            </div>
          </div>
        } @else {
          <!-- Total Spend Summary Card -->
          <div class="bg-expense-primary/5 text-slate-800 p-6 rounded-[24px] shadow-sm border border-expense-primary/20 transition-all duration-300 relative overflow-hidden">
            <div class="relative z-10 flex flex-col gap-4">
              <!-- Header & Amount -->
              <div class="flex flex-col gap-1 mt-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-bold text-base text-slate-800">Total Spend</span>
                  <span class="text-xs font-bold uppercase px-3 py-1 bg-expense-primary/10 text-expense-primary rounded-full">
                    {{ getActiveMonthLabel() }}
                  </span>
                </div>
                <div class="flex items-baseline justify-center w-full mt-4 mb-2">
                  <span class="font-bold tracking-tight text-slate-900 leading-none text-center truncate text-[40px]">
                    {{ getTotal() | currency:'INR':'₹':'1.0-0' }}
                  </span>
                </div>
              </div>

              <!-- Salary Progress -->
              <div class="flex flex-col gap-1.5 mt-4 pt-4 border-t border-expense-primary/10">
                <div class="flex justify-between items-end">
                   <div class="flex flex-col">
                     <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Salary Account</span>
                     <span class="text-sm font-bold text-slate-800 tracking-[0.2em] mt-0.5 cursor-pointer active:scale-95 inline-block transition-transform" (click)="toggleMask(); $event.stopPropagation()">{{ isMasked() ? '••••••' : (monthlySalary() - spendData().salary | currency:'INR':'₹':'1.0-0') }} <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-normal ml-0.5">Left</span></span>
                   </div>
                   <div class="text-right flex flex-col">
                     <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total</span>
                     <span class="text-xs font-bold text-slate-600 tracking-[0.2em] mt-0.5 cursor-pointer active:scale-95 inline-block transition-transform" (click)="toggleMask(); $event.stopPropagation()">{{ isMasked() ? '••••••' : (monthlySalary() | currency:'INR':'₹':'1.0-0') }}</span>
                   </div>
                </div>
                <div class="h-2 w-full bg-emerald-500/15 rounded-full overflow-hidden flex relative z-10 shadow-inner mt-1">
                  <div
                    class="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                    [style.width.%]="animateBars() && monthlySalary() > 0 ? (spendData().salary / monthlySalary()) * 100 : 0"
                  ></div>
                </div>
              </div>

              <!-- Cash Progress -->
              <div class="flex flex-col gap-1.5 mt-3">
                <div class="flex justify-between items-end">
                   <div class="flex flex-col">
                     <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cash Account</span>
                     <span class="text-sm font-bold text-slate-800 tracking-[0.2em] mt-0.5 cursor-pointer active:scale-95 inline-block transition-transform" (click)="toggleMask(); $event.stopPropagation()">{{ isMasked() ? '••••••' : (accountTracker.cashBalance() | currency:'INR':'₹':'1.0-0') }} <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-normal ml-0.5">Left</span></span>
                   </div>
                   <div class="text-right flex flex-col">
                     <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Total</span>
                     <span class="text-xs font-bold text-slate-600 tracking-[0.2em] mt-0.5 cursor-pointer active:scale-95 inline-block transition-transform" (click)="toggleMask(); $event.stopPropagation()">{{ isMasked() ? '••••••' : (accountTracker.cashBalance() + spendData().cash | currency:'INR':'₹':'1.0-0') }}</span>
                   </div>
                </div>
                <div class="h-2 w-full bg-pink-500/15 rounded-full overflow-hidden flex relative z-10 shadow-inner mt-1">
                  <div
                    class="h-full bg-pink-500 transition-all duration-1000 ease-out"
                    [style.width.%]="animateBars() && (accountTracker.cashBalance() + spendData().cash) > 0 ? (spendData().cash / (accountTracker.cashBalance() + spendData().cash)) * 100 : 0"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <div #scrollContainer class="flex-1 overflow-y-auto px-5 pb-32">
        @if (expenseService.isLoading()) {
          <div class="flex flex-col gap-3 mt-4">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="bg-slate-50/50 border border-slate-100 rounded-[20px] p-4 flex items-center gap-3 shadow-sm">
                <div class="w-12 h-12 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div class="h-4 bg-slate-200 w-32 animate-pulse rounded-full"></div>
                  <div class="h-3 bg-slate-200 w-24 animate-pulse rounded-full"></div>
                </div>
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                  <div class="h-4 bg-slate-200 w-16 animate-pulse rounded-full"></div>
                  <div class="h-2.5 bg-slate-200 w-10 animate-pulse rounded-full"></div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Expense List -->
          @if (expenseService.expenses().length === 0) {
            <div class="w-full bg-white border border-solid border-expense-primary/20 shadow-sm rounded-[24px] p-8 flex flex-col items-center justify-center text-center mt-4">
              <div class="w-12 h-12 bg-expense-primary/10 rounded-[14px] flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-expense-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h4 class="text-sm font-bold text-slate-800 mb-1">No expenses found</h4>
              <p class="text-xs text-slate-500">You haven't added any expenses for this month yet.</p>
            </div>
          } @else {
            <div class="flex flex-col gap-3 mt-4">
              @for (expense of expenseService.expenses(); track trackById($index, expense)) {
                <button
                  (click)="editExpense(expense)"
                  class="w-full bg-expense-primary/5 border border-expense-primary/20 rounded-[20px] p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                >
                  <!-- Icon -->
                  <div class="flex items-center gap-3 shrink-0">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center" [ngClass]="budgetService.getCategoryTheme(expense.category).bg + ' ' + budgetService.getCategoryTheme(expense.category).text">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path [attr.d]="expense.icon ? iconService.getIconById(expense.icon).svg : budgetService.getCategoryIconPath(expense.category)"></path>
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
              
              <!-- Infinite Scroll Trigger -->
              <div #scrollTrigger class="h-4 mt-2"></div>
              @if (expenseService.hasMore() && expenseService.expenses().length > 0) {
                <div class="flex justify-center py-4">
                  <svg class="animate-spin h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class Expenses implements OnInit, AfterViewInit, OnDestroy {
  expenseService = inject(ExpenseService);
  monthPicker = inject(MonthPickerService);
  toastService = inject(ToastService);
  keyboardService = inject(KeyboardService);
  splitService = inject(SplitService);
  supabaseService = inject(SupabaseService);
  goalService = inject(GoalService);
  subscriptionService = inject(SubscriptionService);
  budgetService = inject(BudgetService);
  authService = inject(AuthService);
  accountTracker = inject(AccountTrackerService);
  iconService = inject(IconService);
  private monthSub: any;

  animateBars = signal(false);
  maskValues = signal<boolean>(false);
  isMasked = computed(() => this.maskValues());

  monthlySalary = computed(() => this.authService.userProfile().salary || 0);

  toggleMask() {
    this.maskValues.update(v => !v);
  }

  spendData = computed(() => {
    const expenses = this.expenseService.allExpenses();
    const totals = { cash: 0, salary: 0 };
    for (const exp of expenses) {
      if (exp.category === 'virtual-invest') continue;
      
      const mode = exp.paid_via?.toLowerCase() || 'upi';
      if (mode.includes('cash')) {
        totals.cash += exp.amount;
      } else {
        totals.salary += exp.amount; // UPI, Card, etc.
      }
    }
    return totals;
  });

  private observer: IntersectionObserver | null = null;
  private isObserving = false;
  private scrollTriggerEl: ElementRef | undefined;
  
  @ViewChild('scrollContainer') scrollContainerEl?: ElementRef<HTMLElement>;

  // Pull to refresh state
  pullStartY = 0;
  pullMoveY = 0;
  isPulling = signal(false);
  refreshing = signal(false);

  pullDistance = computed(() => {
    if (!this.isPulling()) return 0;
    const dist = this.pullMoveY - this.pullStartY;
    return dist > 0 ? Math.min(dist * 0.4, 100) : 0;
  });

  @ViewChild('scrollTrigger') set scrollTrigger(el: ElementRef | undefined) {
    this.scrollTriggerEl = el;
    this.tryObserve();
  }

  ngOnInit() {
    if (this.authService.userProfile().maskValues) {
      this.maskValues.set(true);
    }
    const options = { root: null, rootMargin: '0px', threshold: 0.1 };
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && this.expenseService.hasMore()) {
        setTimeout(() => this.expenseService.loadMore(), 500);
      }
    }, options);

    this.monthSub = this.monthPicker.monthSelected$.subscribe((month) => {
      this.onMonthSelected(month);
    });
  }

  ngAfterViewInit() {
    this.tryObserve();
    setTimeout(() => this.animateBars.set(true), 100);
  }

  private tryObserve() {
    if (this.scrollTriggerEl && this.observer && !this.isObserving) {
      this.observer.observe(this.scrollTriggerEl.nativeElement);
      this.isObserving = true;
    }
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
    if (this.monthSub) this.monthSub.unsubscribe();
    this.expenseService.setMonthFilter(this.expenseService.getCurrentMonthString());
  }

  onTouchStart(event: TouchEvent) {
    const el = this.scrollContainerEl?.nativeElement;
    const scrollTop = el ? el.scrollTop : 0;
    if (scrollTop <= 0) {
      this.pullStartY = event.touches[0].clientY;
      this.isPulling.set(true);
    }
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isPulling()) return;
    const currentY = event.touches[0].clientY;
    if (currentY > this.pullStartY) {
      this.pullMoveY = currentY;
    } else {
      this.isPulling.set(false);
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isPulling()) return;
    if (this.pullDistance() >= 60 && !this.refreshing()) {
      this.refreshing.set(true);
      this.refreshData();
    }
    this.isPulling.set(false);
    this.pullStartY = 0;
    this.pullMoveY = 0;
  }

  async refreshData() {
    await this.expenseService.refreshExpenses();
    setTimeout(() => {
      this.refreshing.set(false);
    }, 500);
  }

  trackById(index: number, expense: Expense): string {
    return expense.id;
  }

  getTotal() {
    return this.expenseService.monthlyTotalSpend();
  }



  formatPaymentMode(mode?: string): string {
    const m = (mode || 'UPI').toUpperCase();
    if (m.includes('CREDIT')) return 'CREDIT';
    if (m.includes('DEBIT')) return 'DEBIT';
    return m;
  }

  getActiveMonthLabel() {
    const val = this.expenseService.activeMonth();
    if (!val) return 'Select Month';
    const [year, month] = val.split('-');
    const d = new Date(parseInt(year), parseInt(month) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  onMonthSelected(month: string) {
    this.expenseService.setMonthFilter(month);
  }



  async editExpense(expense: Expense) {
    if (expense.category === 'virtual-invest') {
      const goalName = expense.title.startsWith('Goal: ')
        ? expense.title.replace('Goal: ', '')
        : expense.title;
      const goal = this.goalService.goals().find((g) => g.name === goalName);
      if (goal) {
        this.goalService.openAddFundsSheet(goal, null, expense);
      } else {
        this.toastService.showError('Goal Not Found', 'This goal is no longer available.');
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
}
