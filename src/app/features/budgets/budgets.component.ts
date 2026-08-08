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
    <div class="flex-1 bg-white flex flex-col h-full overflow-hidden">
      <!-- Top Fixed Section -->
      <div class="px-5 pt-5 pb-2 shrink-0">
        <!-- Top Summary Box -->
      <div class="shrink-0 bg-emerald-600 text-white p-5 rounded-[24px] flex flex-col relative overflow-hidden shadow-lg shadow-emerald-600/20">
        <div class="flex items-start justify-between relative z-10">
          <!-- Left side: Icon + Total Allocation -->
          <div class="flex items-center gap-3">
            <!-- Icon Box -->
            <div class="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.2 15.8A10 10 0 1 1 8.2 2.8" />
                <path d="M23 11A10 10 0 0 0 13 1v10z" />
              </svg>
            </div>
            <div class="flex flex-col">
              <span class="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-0.5">
                Total Allocation
              </span>
              @if (budgetService.isLoading()) {
                <div class="h-8 w-24 bg-white/20 animate-pulse rounded"></div>
              } @else {
                <span class="text-2xl font-bold tracking-tight">
                  ₹{{ monthlySalary() | number: '1.0-0' }}
                </span>
              }
            </div>
          </div>

          <!-- Right side: Allocated -->
          <div class="flex flex-col items-end gap-1">
            <div class="flex items-center gap-2">
              <div class="flex flex-col items-end">
                <span class="text-xs font-bold text-emerald-100 uppercase tracking-wider mb-0.5">
                  Allocated
                </span>
                @if (budgetService.isLoading()) {
                  <div class="h-6 w-16 bg-white/20 animate-pulse rounded"></div>
                } @else {
                  <span class="text-lg font-bold text-white">
                    ₹{{ totalAllocated() | number: '1.0-0' }}
                  </span>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Progress bar section -->
        <div class="mt-6 flex flex-col gap-2 relative z-10">
          <div class="h-2 w-full bg-emerald-700/50 rounded-full overflow-hidden flex">
            <div class="h-full bg-white transition-all duration-1000 ease-out rounded-full"
                 [style.width.%]="!budgetService.isLoading() && animateBars() ? globalProgressPercent() : 0"></div>
          </div>
          <div class="flex justify-between items-center text-xs font-medium">
            <span class="text-emerald-50">{{ globalProgressPercent() | number: '1.0-0' }}% of total allocation used</span>
            <span class="text-white">₹{{ monthlySalary() - totalAllocated() | number: '1.0-0' }} left</span>
          </div>
        </div>
      </div>

      </div>

      <!-- Scrollable Budgets List -->
      <div class="flex-1 overflow-y-auto px-5 pb-32 flex flex-col gap-3">
        @if (budgetService.isLoading()) {
          @for (i of [1, 2, 3, 4, 5]; track i) {
            <div class="w-full bg-slate-50 rounded-2xl p-4 flex flex-col gap-3 h-[90px] animate-pulse border border-slate-100">
              <div class="flex justify-between items-center w-full">
                <div class="flex items-center gap-3 w-1/2">
                  <div class="w-12 h-12 bg-slate-200 rounded-2xl shrink-0"></div>
                  <div class="flex flex-col gap-2 w-full">
                    <div class="h-4 bg-slate-200 w-2/3 rounded"></div>
                    <div class="h-3 bg-slate-200 w-1/2 rounded"></div>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-1">
                  <div class="h-5 bg-slate-200 w-16 rounded"></div>
                  <div class="h-3 bg-slate-200 w-12 rounded"></div>
                </div>
              </div>
            </div>
          }
        } @else {
          @if (budgetService.budgets().length > 0) {
            @for (budget of budgetService.budgets(); track budget) {
              <button
                (click)="openBudget(budget)"
                class="w-full bg-budget-primary/[0.03] border border-budget-primary/10 rounded-2xl p-4 flex flex-col gap-4 text-left shadow-sm transition-all active:scale-[0.99]"
              >
                <div class="flex justify-between items-start w-full">
                  <div class="flex items-center gap-3">
                    <!-- Icon Box -->
                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                         [ngClass]="getCategoryIconBg(budget.name)">
                      <svg class="w-6 h-6" [ngClass]="getCategoryIconColor(budget.name)" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
                        <path [attr.d]="budget.icon_path || getCategoryFallbackIconPath(budget.name)" />
                      </svg>
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-[15px] text-gray-900 leading-tight">{{ budget.name }}</span>
                      <span class="text-[12px] font-medium text-gray-500 mt-0.5">Spent ₹{{ getConsumed(budget.name) | number: '1.0-0' }}</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    @if (budget.id === 'virtual-others') {
                      <div class="flex flex-col items-end">
                        <span class="font-bold text-[15px] text-gray-900">₹{{ monthlySalary() - totalAllocated() | number: '1.0-0' }}</span>
                        <span class="text-[12px] font-bold text-emerald-500 mt-0.5">₹{{ (monthlySalary() - totalAllocated()) - getConsumed(budget.name) | number: '1.0-0' }} left</span>
                      </div>
                    } @else {
                      <div class="flex flex-col items-end">
                        <span class="font-bold text-[15px] text-gray-900">₹{{ budget.amount + (budget.rollover_amount || 0) | number: '1.0-0' }}</span>
                        <span class="text-[12px] font-bold text-emerald-500 mt-0.5">₹{{ (budget.amount + (budget.rollover_amount || 0)) - getConsumed(budget.name) | number: '1.0-0' }} left</span>
                      </div>
                    }
                    <svg class="w-5 h-5 text-gray-300 ml-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <!-- Progress Bar inline with percentage -->
                <div class="flex items-center gap-3 w-full">
                  <div class="h-2 flex-1 bg-slate-50 rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all duration-1000 ease-out rounded-full"
                      [style.width.%]="!budgetService.isLoading() && animateBars() ? getPercent(budget.name, budget.id === 'virtual-others' ? monthlySalary() - totalAllocated() : budget.amount + (budget.rollover_amount || 0)) : 0"
                      [ngClass]="getCategoryProgressColor(budget.name)"
                    ></div>
                  </div>
                  <span class="text-xs font-bold text-gray-500 w-8 text-right">{{ getPercent(budget.name, budget.id === 'virtual-others' ? monthlySalary() - totalAllocated() : budget.amount + (budget.rollover_amount || 0)) | number: '1.0-0' }}%</span>
                </div>
              </button>
            }
          } @else {
            <div class="mt-4 w-full bg-[#FCFCFD] border border-solid border-slate-100 shadow-sm rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
              <div class="w-12 h-12 bg-budget-surface rounded-[14px] flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-budget-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 class="text-sm font-bold text-slate-800 mb-1">No budgets yet</h4>
              <p class="text-xs text-slate-500 max-w-[250px]">
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

  getCategoryIconBg(budgetName: string): string {
    return 'bg-emerald-50'; // Unified green theme
  }

  getCategoryIconColor(budgetName: string): string {
    return 'text-budget-primary'; // Unified green theme
  }

  getCategoryProgressColor(budgetName: string): string {
    return 'bg-budget-primary'; // Unified green theme
  }

  getCategoryFallbackIconPath(budgetName: string): string {
    const name = budgetName.toLowerCase();
    if (name.includes('shop')) return 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z';
    if (name.includes('food') || name.includes('din')) return 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'; // actually spoon/fork but a generic icon works
    if (name.includes('trans') || name.includes('auto') || name.includes('car')) return 'M5 10h14l-1.5-4H6.5L5 10zm0 0v8a2 2 0 002 2h1a2 2 0 002-2v-1h4v1a2 2 0 002 2h1a2 2 0 002-2v-8M9 14a1 1 0 11-2 0 1 1 0 012 0zm8 0a1 1 0 11-2 0 1 1 0 012 0z';
    if (name.includes('health') || name.includes('med')) return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z';
    if (name.includes('entertain') || name.includes('fun')) return 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z';
    return 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4'; // sliders for others
  }
}
