import { Component, inject, computed, signal, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetService } from '../../core/services/budget.service';
import { ExpenseService } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { MonthPickerService } from '../../core/services/month-picker.service';
import { KeyboardService } from '../../core/services/keyboard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'flex flex-col h-full',
  },
  template: `
    <div class="flex-1 bg-gray-50 p-4 flex flex-col gap-4 pb-36">
      <!-- Top Summary Box -->
      <div
        class="bg-black text-white p-5 border border-black rounded-none flex flex-col gap-4 relative overflow-hidden"
      >
        <!-- Abstract Decoration -->
        <div
          class="absolute -right-10 -top-10 w-32 h-32 bg-gray-800 rounded-full opacity-50 blur-2xl pointer-events-none"
        ></div>

        <div class="flex justify-between items-end relative z-10">
          <div class="flex flex-col">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1"
              >Total Allocation</span
            >
            <span class="text-4xl font-extrabold tracking-tight">
              ₹{{ totalAllocated() | number: '1.0-0' }}
            </span>
          </div>
          <div class="text-right flex flex-col">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
              >Salary Limit</span
            >
            <span class="text-sm font-extrabold text-gray-300">
              ₹{{ monthlySalary() | number: '1.0-0' }}
            </span>
          </div>
        </div>

        <!-- Global Progress Bar -->
        <div class="h-2 w-full bg-gray-800 rounded-none overflow-hidden flex relative z-10">
          <div
            class="h-full bg-white transition-all duration-1000 ease-out"
            [style.width.%]="
              !budgetService.isLoading() && animateBars() ? globalProgressPercent() : 0
            "
          ></div>
        </div>
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

      <!-- Goals List -->
      <div class="flex-1 flex flex-col gap-1.5 mt-2">
        @if (budgetService.isLoading()) {
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="w-full bg-gray-200 rounded-none p-3 flex flex-col gap-2">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-col gap-2 w-1/2">
                  <div class="h-5 bg-gray-300 w-2/3 animate-pulse"></div>
                  <div class="h-3 bg-gray-300 w-1/2 animate-pulse"></div>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <div class="h-6 bg-gray-300 w-16 animate-pulse"></div>
                  <div class="h-2 bg-gray-300 w-20 animate-pulse"></div>
                </div>
              </div>
              <div class="h-1.5 w-full bg-gray-300 mt-2"></div>
            </div>
          }
        } @else {
          @if (budgetService.budgets().length > 0) {
            @for (budget of budgetService.budgets(); track budget) {
              <button
                (click)="openBudget(budget)"
                class="w-full bg-gray-200 rounded-none p-3 flex flex-col gap-2 text-left hover:bg-gray-300 transition-colors active:bg-gray-400"
              >
                <div class="flex justify-between items-center w-full">
                  <div class="flex flex-col gap-0.5">
                    <span class="font-extrabold text-lg text-black">{{ budget.name }}</span>
                    @if (budget.id !== 'virtual-others') {
                      <div class="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        <span>Consumed: ₹{{ getConsumed(budget.name) | number: '1.0-0' }}</span>
                      </div>
                    }
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    @if (budget.id === 'virtual-others') {
                      <span class="font-extrabold text-xl text-gray-500">₹{{ getConsumed(budget.name) | number: '1.0-0' }}</span>
                    } @else {
                      <div class="flex flex-col items-end">
                        <span class="font-extrabold text-xl">₹{{ (budget.amount + (budget.rollover_amount || 0)) | number: '1.0-0' }}</span>
                        @if (budget.rollover_amount) {
                          <span class="text-[9px] font-bold text-green-600 tracking-widest uppercase">+ ₹{{ budget.rollover_amount | number: '1.0-0' }} Rolled Over</span>
                        }
                      </div>
                    }
                  </div>
                </div>
                <!-- Progress Bar -->
                @if (budget.id !== 'virtual-others') {
                  <div class="h-1.5 w-full bg-gray-300 rounded-none overflow-hidden mt-2">
                    <div
                      class="h-full transition-all duration-1000 ease-out"
                      [style.width.%]="
                        !budgetService.isLoading() && animateBars()
                          ? getPercent(budget.name, budget.amount + (budget.rollover_amount || 0))
                          : 0
                      "
                      [ngClass]="getColorClass(budget.name, budget.amount + (budget.rollover_amount || 0))"
                    ></div>
                  </div>
                }
              </button>
            }
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p class="text-gray-500 font-extrabold text-xl">No budgets yet</p>
              <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                Tap the + button below to create your first budget.
              </p>
            </div>
          }
        }
      </div>
    </div>

  `,
})
export class Budgets implements OnInit, AfterViewInit {
  budgetService = inject(BudgetService);
  expenseService = inject(ExpenseService);
  private authService = inject(AuthService);
  monthPicker = inject(MonthPickerService);
  private keyboardService = inject(KeyboardService);
  private router = inject(Router);
  private monthSub: any;
  animateBars = signal(false);

  ngOnInit() {
    this.monthSub = this.monthPicker.monthSelected$.subscribe(month => {
      this.onMonthSelected(month);
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.animateBars.set(true);
    }, 50);
  }

  ngOnDestroy() {
    if (this.monthSub) this.monthSub.unsubscribe();
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

  monthlySalary = computed(() => this.authService.userProfile().salary);

  totalAllocated = computed(() => {
    return this.budgetService.budgets().reduce((sum, b) => sum + b.amount + (b.rollover_amount || 0), 0);
  });

  globalProgressPercent = computed(() => {
    const salary = this.monthlySalary();
    if (!salary) return 0;
    return Math.min(100, (this.totalAllocated() / salary) * 100);
  });

  getConsumed(budgetName: string): number {
    return this.expenseService.getConsumedForCategory(budgetName);
  }

  getPercent(budgetName: string, total: number): number {
    if (!total) return 0;
    const consumed = this.getConsumed(budgetName);
    return Math.min(100, (consumed / total) * 100);
  }

  getColorClass(budgetName: string, total: number): string {
    const p = this.getPercent(budgetName, total);
    if (p >= 80) return 'bg-red-600';
    if (p >= 60) return 'bg-yellow-500';
    return 'bg-black';
  }

  openBudget(budget: any) {
    this.router.navigate(['/budgets', budget.name]);
  }
}
