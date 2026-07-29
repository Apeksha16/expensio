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

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="h-full bg-white flex flex-col relative">
      <!-- Fixed Header Container (keeps padding consistent) -->
      <div class="px-4 pt-4 shrink-0">
        <!-- Header Area -->
        <div class="bg-black text-white p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(13,148,136,1)] flex flex-col gap-1 relative overflow-hidden">
          <h2 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0 opacity-80">
            Total Expenses
          </h2>
          <p class="text-4xl font-extrabold tracking-tight">₹{{ getTotal() % 1 === 0 ? (getTotal() | number: '1.0-0') : (getTotal() | number: '1.2-2') }}</p>
        </div>

        <!-- Filter Row -->
        <div class="flex justify-between items-center mt-5 mb-2">
          <button
            (click)="openMonthPicker()"
            class="flex items-center gap-2 px-4 py-2 bg-white text-black border-2 border-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-[0.98]"
          >
            <span>{{ getActiveMonthLabel() }}</span>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Expense List (Scrollable Area) -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pb-28">
        @if (expenseService.isLoading()) {
          <div class="flex flex-col gap-3 mt-2">
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <div class="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl h-[76px] animate-pulse"></div>
            }
          </div>
        } @else {
          @if (expenseService.expenses().length > 0) {
            <div class="flex flex-col gap-3 mt-2">
              @for (expense of expenseService.expenses(); track trackById($index, expense)) {
                <button
                  (click)="editExpense(expense)"
                  class="w-full bg-white border-2 border-black rounded-2xl p-3.5 flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <!-- Icon -->
                  <div class="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shrink-0 bg-gray-100">
                    <span class="text-base font-black text-black">{{ expense.title.charAt(0).toUpperCase() }}</span>
                  </div>

                  <!-- Details -->
                  <div class="flex flex-col gap-1 min-w-0 flex-1">
                    <span class="font-extrabold text-sm text-gray-900 truncate">{{ expense.title }}</span>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md border border-gray-200 truncate max-w-[130px]">
                        {{ expense.category }}
                      </span>
                      <span class="text-[10px] font-semibold text-gray-400">
                        {{ expense.date | date: 'MMM d, h:mm a' }}
                      </span>
                    </div>
                  </div>

                  <!-- Amount & Payment Tag -->
                  <div class="flex flex-col items-end gap-0.5 shrink-0">
                    <span class="font-black text-base text-gray-900">
                      ₹{{ expense.amount % 1 === 0 ? (expense.amount | number: '1.0-0') : (expense.amount | number: '1.2-2') }}
                    </span>
                    <span class="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                      {{ expense.paid_via || 'UPI' }}
                    </span>
                  </div>
                </button>
              }
            </div>
            
            <!-- Infinite Scroll Trigger -->
            <div #scrollTrigger class="h-10 flex items-center justify-center border-b border-transparent mt-4">
              @if (expenseService.hasMore()) {
                <svg class="animate-spin h-6 w-6 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
            </div>
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center h-full min-h-[300px]">
              <div class="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p class="text-black font-extrabold text-xl">No expenses yet</p>
              <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                Tap the + button below to add your first expense.
              </p>
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
  private monthSub: any;

  private observer: IntersectionObserver | null = null;
  private isObserving = false;
  private scrollTriggerEl: ElementRef | undefined;

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

  trackById(index: number, expense: Expense): string {
    return expense.id;
  }

  getTotal() {
    return this.expenseService.monthlyTotalSpend();
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

  openMonthPicker() {
    this.monthPicker.open(this.expenseService.activeMonth());
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
