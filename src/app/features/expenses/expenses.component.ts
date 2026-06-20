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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService, Expense } from '../../core/services/expense.service';
import { MonthPickerService } from '../../core/services/month-picker.service';
import { ToastService } from '../../core/services/toast.service';
import { KeyboardService } from '../../core/services/keyboard.service';
import { SplitService } from '../../core/services/split.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  template: `
    <div class="h-full bg-gray-50 p-4 flex flex-col gap-4">
      <!-- Header Area -->
      <div class="bg-black text-white p-5 border border-black rounded-none">
        <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
          Total Expenses
        </h2>
        <p class="text-4xl font-extrabold tracking-tight">₹{{ getTotal() | number: '1.2-2' }}</p>
      </div>

      <!-- Filter Row -->
      <div class="flex justify-between items-center mt-2">
        <button
          (click)="openMonthPicker()"
          class="flex items-center gap-2 px-3 py-1.5 bg-white border border-black rounded-none font-bold text-sm hover:bg-black hover:text-white transition-colors"
        >
          <span>{{ getActiveMonthLabel() }}</span>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="3"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      <!-- Expense List -->
      <div class="flex-1 flex flex-col gap-1.5 pb-36 mt-2">
        @if (expenseService.isLoading()) {
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div
              class="w-full bg-gray-200 rounded-none p-3 h-20 animate-pulse flex justify-between items-center"
            >
              <div class="flex flex-col gap-2 w-1/2">
                <div class="h-4 bg-gray-300 w-3/4"></div>
                <div class="h-3 bg-gray-300 w-1/2"></div>
              </div>
              <div class="h-6 bg-gray-300 w-16"></div>
            </div>
          }
        } @else {
          @if (expenseService.expenses().length > 0) {
            @for (expense of expenseService.expenses(); track trackById($index, expense)) {
              <button
                (click)="editExpense(expense)"
                class="w-full bg-gray-200 rounded-none p-3 flex justify-between items-center text-left hover:bg-gray-300 transition-colors active:bg-gray-400 border-l-4"
                [ngClass]="getCategoryColor(expense.category)"
              >
                <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                  <span class="font-extrabold text-lg text-black truncate">{{ expense.title }}</span>
                  <div
                    class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest min-w-0"
                  >
                    <span class="truncate">{{ expense.category }}</span>
                    <span class="flex-shrink-0">•</span>
                    <span class="whitespace-nowrap flex-shrink-0">{{ expense.date | date: 'MMM d, h:mm a' }}</span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2 flex-shrink-0">
                  <span class="font-extrabold text-xl"
                    >₹{{ expense.amount | number: '1.2-2' }}</span
                  >
                </div>
              </button>
            }
            <!-- Infinite Scroll Trigger -->
            <div
              #scrollTrigger
              class="h-10 flex items-center justify-center border-b border-transparent"
            >
              @if (expenseService.hasMore()) {
                <svg
                  class="animate-spin h-6 w-6 text-black"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              }
            </div>
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div
                class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6"
              >
                <svg
                  class="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p class="text-gray-500 font-extrabold text-xl">No expenses yet</p>
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
  private monthSub: any;

  @ViewChild('scrollTrigger') scrollTrigger!: ElementRef;
  private observer: IntersectionObserver | null = null;

  ngOnInit() {
    this.monthSub = this.monthPicker.monthSelected$.subscribe(month => {
      this.onMonthSelected(month);
    });
  }

  ngAfterViewInit() {
    const options = { root: null, rootMargin: '0px', threshold: 0.1 };
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && this.expenseService.hasMore()) {
        // Simulate network delay for effect
        setTimeout(() => this.expenseService.loadMore(), 500);
      }
    }, options);

    if (this.scrollTrigger) {
      this.observer.observe(this.scrollTrigger.nativeElement);
    }
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
    if (this.monthSub) this.monthSub.unsubscribe();
  }

  trackById(index: number, expense: Expense): string {
    return expense.id;
  }

  getTotal() {
    return this.expenseService.expenses().reduce((sum, exp) => sum + exp.amount, 0);
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

  getCategoryColor(category: string): string {
    if (!category) return 'border-gray-400';
    const colors = [
      'border-red-500',
      'border-blue-500',
      'border-green-500',
      'border-yellow-500',
      'border-purple-500',
      'border-pink-500',
      'border-indigo-500',
      'border-teal-500',
      'border-orange-500',
    ];
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  async editExpense(expense: Expense) {
    if (expense.id.startsWith('split_')) {
      const splitId = expense.id.replace('split_', '');
      const { data, error } = await this.supabaseService.client
        .from('split_expenses')
        .select('*, participants:split_participants(*)')
        .eq('id', splitId)
        .single();
        
      if (!error && data) {
        this.splitService.openAddSplitSheet(data as any);
      } else {
        this.toastService.showError('Could not load split expense.');
      }
      return;
    }
    this.expenseService.openBottomSheet(expense);
  }
}
