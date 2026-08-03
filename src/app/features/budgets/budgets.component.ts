import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
  AfterViewInit,
  ChangeDetectionStrategy,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="flex-1 bg-white p-4 flex flex-col gap-4 pb-28">
      <!-- Top Summary Box -->
      <div class="shrink-0 bg-black text-white p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(16,185,129,1)]">
        <div class="flex justify-between items-end relative z-10">
          <div class="flex flex-col">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Total Allocation
            </span>
            @if (budgetService.isLoading()) {
              <div class="h-10 w-32 bg-gray-800 animate-pulse rounded mt-1"></div>
            } @else {
              <span class="text-4xl font-black tracking-tight">
                ₹{{ totalAllocated() | number: '1.0-0' }}
              </span>
            }
          </div>
          <div class="text-right flex flex-col cursor-pointer" (click)="showSalaryLimit.update((v) => !v)">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Salary Limit
            </span>
            @if (budgetService.isLoading()) {
              <div class="h-5 w-16 bg-gray-800 animate-pulse rounded mt-1 self-end"></div>
            } @else {
              <span class="text-sm font-black text-white transition-all select-none mt-1">
                {{ isMasked() && !showSalaryLimit() ? '••••' : '₹' + (monthlySalary() | number: '1.0-0') }}
              </span>
            }
          </div>
        </div>

        <!-- Global Progress Bar -->
        <div class="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex relative z-10 border border-gray-700">
          <div
            class="h-full bg-white transition-all duration-1000 ease-out rounded-full"
            [style.width.%]="!budgetService.isLoading() && animateBars() ? globalProgressPercent() : 0"
          ></div>
        </div>
      </div>


      <!-- Goals List -->
      <div class="flex-1 flex flex-col gap-3 mt-2">
        @if (budgetService.isLoading()) {
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="w-full bg-gray-100 rounded-2xl p-4 flex flex-col gap-3 h-[88px] animate-pulse border-2 border-gray-200">
              <div class="flex justify-between items-center w-full">
                <div class="flex flex-col gap-2 w-1/2">
                  <div class="h-5 bg-gray-200 w-2/3"></div>
                  <div class="h-3 bg-gray-200 w-1/2"></div>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <div class="h-6 bg-gray-200 w-16"></div>
                  <div class="h-2 bg-gray-200 w-20"></div>
                </div>
              </div>
            </div>
          }
        } @else {
          @if (budgetService.budgets().length > 0) {
            @for (budget of budgetService.budgets(); track budget) {
              <button
                (click)="openBudget(budget)"
                class="w-full bg-white border-2 border-black text-black rounded-2xl p-4 flex flex-col gap-3 text-left hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-[0.99]"
              >
                <div class="flex justify-between items-center w-full">
                  <div class="flex flex-col gap-0.5">
                    <span class="font-black text-lg">{{ budget.name }}</span>
                    <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      <span>Consumed: ₹{{ getConsumed(budget.name) | number: '1.0-0' }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    @if (budget.id === 'virtual-others') {
                      <div class="flex flex-col items-end">
                        <span class="font-black text-xl">₹{{ monthlySalary() - totalAllocated() | number: '1.0-0' }}</span>
                        <span class="text-[9px] font-bold uppercase tracking-widest text-gray-400">Unallocated Limit</span>
                      </div>
                    } @else {
                      <div class="flex flex-col items-end">
                        <span class="font-black text-xl">₹{{ budget.amount + (budget.rollover_amount || 0) | number: '1.0-0' }}</span>
                        @if (budget.rollover_amount) {
                          <span class="text-[9px] font-black text-emerald-600 tracking-widest uppercase border border-emerald-200 bg-emerald-50 px-1 rounded">
                            + ₹{{ budget.rollover_amount | number: '1.0-0' }} Rolled Over
                          </span>
                        }
                      </div>
                    }
                  </div>
                </div>
                <!-- Progress Bar -->
                <div class="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1 border border-gray-200">
                  <div
                    class="h-full transition-all duration-1000 ease-out rounded-full"
                    [style.width.%]="
                      !budgetService.isLoading() && animateBars()
                        ? getPercent(
                            budget.name,
                            budget.id === 'virtual-others'
                              ? monthlySalary() - totalAllocated()
                              : budget.amount + (budget.rollover_amount || 0)
                          )
                        : 0
                    "
                    [ngClass]="
                      getColorClass(
                        budget.name,
                        budget.id === 'virtual-others'
                          ? monthlySalary() - totalAllocated()
                          : budget.amount + (budget.rollover_amount || 0)
                      )
                    "
                  ></div>
                </div>
              </button>
            }
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center h-[300px]">
              <div class="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-black font-extrabold text-xl">No budgets yet</p>
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
  isMasked = computed(() => this.authService.userProfile().maskValues);
  showSalaryLimit = signal(false);

  ngOnInit() {
    this.expenseService.setMonthFilter(this.expenseService.getCurrentMonthString());
    this.monthSub = this.monthPicker.monthSelected$.subscribe((month) => {
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
    this.expenseService.setMonthFilter(this.expenseService.getCurrentMonthString());
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



  monthlySalary = computed(() => this.authService.userProfile().salary);

  totalAllocated = computed(() => {
    return this.budgetService
      .budgets()
      .reduce((sum, b) => sum + b.amount + (b.rollover_amount || 0), 0);
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
