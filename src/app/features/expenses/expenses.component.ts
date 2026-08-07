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
      class="h-full bg-[#FAFAFA] flex flex-col overflow-hidden select-none font-sans"
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
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex flex-col items-center gap-1">
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
          <div class="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden">
            <div class="flex flex-col gap-1">
              <div class="h-[14px] bg-slate-100 w-24 animate-pulse rounded-full"></div>
              <div class="h-8 bg-slate-100 w-32 animate-pulse rounded-lg mt-0.5"></div>
            </div>
          </div>
        } @else {
          <!-- Total Spend Summary Card -->
          <div class="bg-[#5421E6] p-6 rounded-[24px] shadow-[0_8px_30px_rgb(84,33,230,0.3)] relative overflow-hidden">
            <div class="relative z-10 flex flex-col gap-4">
              <!-- Header & Amount -->
              <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold uppercase tracking-widest text-white/70">Total Spend</span>
                  <span class="text-[10px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                    {{ getActiveMonthLabel() }}
                  </span>
                </div>
                <div class="flex items-baseline gap-1 mt-1">
                  <span class="text-[36px] leading-none font-black text-white tracking-tight">
                    {{ getTotal() | currency:'INR':'symbol':'1.0-0' }}
                  </span>
                  @if (monthlySalary() > 0) {
                    <span class="text-sm font-bold text-white/60">
                      / {{ monthlySalary() | currency:'INR':'symbol':'1.0-0' }}
                    </span>
                  }
                </div>
              </div>

              <!-- Progress Bar -->
              @if (monthlySalary() > 0) {
                <div class="flex flex-col gap-2 mt-2">
                  <div class="h-2 w-full bg-black/20 rounded-full overflow-hidden flex relative z-10 border border-black/10">
                    <div
                      class="h-full bg-emerald-400 transition-all duration-1000 ease-out"
                      [style.width.%]="animateBars() ? progressWidths().upi : 0"
                    ></div>
                    <div
                      class="h-full bg-yellow-400 transition-all duration-1000 ease-out"
                      [style.width.%]="animateBars() ? progressWidths().credit : 0"
                    ></div>
                    <div
                      class="h-full bg-pink-400 transition-all duration-1000 ease-out"
                      [style.width.%]="animateBars() ? progressWidths().cash : 0"
                    ></div>
                  </div>
                  <div class="flex justify-between items-center text-[10.5px] font-semibold mt-1">
                    <div class="flex gap-3">
                      <span class="flex items-center gap-1.5 text-white/80"><div class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div> UPI</span>
                      <span class="flex items-center gap-1.5 text-white/80"><div class="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]"></div> Card</span>
                      <span class="flex items-center gap-1.5 text-white/80"><div class="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.5)]"></div> Cash</span>
                    </div>
                    <span class="text-white/80">
                      {{ (progressWidths().upi + progressWidths().credit + progressWidths().cash) | number:'1.0-0' }}%
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <div #scrollContainer class="flex-1 overflow-y-auto px-5 pb-32">
        @if (expenseService.isLoading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="bg-white border border-gray-100 rounded-[20px] p-4 flex items-center gap-3 shadow-[0_2px_12px_rgb(0,0,0,0.03)]">
                <div class="w-12 h-12 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
                <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div class="h-4 bg-slate-100 w-32 animate-pulse rounded-full"></div>
                  <div class="h-3 bg-slate-100 w-24 animate-pulse rounded-full"></div>
                </div>
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                  <div class="h-4 bg-slate-100 w-16 animate-pulse rounded-full"></div>
                  <div class="h-2.5 bg-slate-100 w-10 animate-pulse rounded-full"></div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Expense List -->
          @if (expenseService.expenses().length === 0) {
            <div class="w-full bg-[#FCFCFD] border border-dashed border-gray-200 rounded-[24px] p-10 flex flex-col items-center justify-center text-center mt-4">
              <div class="w-16 h-16 bg-indigo-50 rounded-[16px] flex items-center justify-center mb-4">
                <svg class="w-8 h-8 text-[#5421E6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h4 class="text-base font-bold text-slate-800 mb-2">No expenses found</h4>
              <p class="text-sm text-slate-500">You haven't added any expenses for this month yet.</p>
            </div>
          } @else {
            <div class="flex flex-col gap-3">
              @for (expense of expenseService.expenses(); track trackById($index, expense)) {
                <button
                  (click)="editExpense(expense)"
                  class="w-full bg-white border border-gray-100 rounded-[20px] p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-md"
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
                    <div class="flex flex-col gap-1.5">
                      <div class="flex items-center gap-1.5 text-slate-400">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <line x1="16" y1="2" x2="16" y2="6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <line x1="8" y1="2" x2="8" y2="6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <line x1="3" y1="10" x2="21" y2="10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span class="text-[11px] font-medium">{{ expense.date | date: 'MMM d, yyyy • hh:mm a' }}</span>
                      </div>
                    </div>
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
                  <svg class="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
  private monthSub: any;

  animateBars = signal(false);

  monthlySalary = computed(() => this.authService.userProfile().salary || 0);

  spendByMode = computed(() => {
    // We use allExpenses() so the progress bar reflects every transaction in the month,
    // not just the paginated subset currently visible on screen.
    const expenses = this.expenseService.allExpenses();
    const totals = { cash: 0, credit: 0, upi: 0 };
    for (const exp of expenses) {
      if (exp.category === 'virtual-invest') continue; // Optional: Exclude internal transfers/investments if needed
      
      const mode = exp.paid_via?.toLowerCase() || 'cash';
      if (mode.includes('credit') || mode.includes('card')) totals.credit += exp.amount;
      else if (mode.includes('upi')) totals.upi += exp.amount;
      else totals.cash += exp.amount;
    }
    return totals;
  });

  progressWidths = computed(() => {
    const salary = this.monthlySalary();
    const totals = this.spendByMode();
    if (!salary || salary === 0) {
      return { cash: 0, credit: 0, upi: 0 };
    }
    // Calculate widths as percentage of total salary
    const cashPct = (totals.cash / salary) * 100;
    const creditPct = (totals.credit / salary) * 100;
    const upiPct = (totals.upi / salary) * 100;
    
    return { 
      cash: Math.max(0, Math.min(cashPct, 100)), 
      credit: Math.max(0, Math.min(creditPct, 100 - cashPct)), 
      upi: Math.max(0, Math.min(upiPct, 100 - cashPct - creditPct)) 
    };
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
}
