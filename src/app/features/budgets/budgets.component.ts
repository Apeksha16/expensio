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
import { AccountTrackerService } from '../../core/services/account-tracker.service';
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
        <div class="bg-budget-primary/5 text-slate-800 p-6 rounded-[24px] shadow-sm border border-budget-primary/20 transition-all duration-300 relative overflow-hidden">
          <div class="relative z-10 flex flex-col gap-4">
            <!-- Header & Amount -->
            <div class="flex flex-col gap-1 mt-1">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-base text-slate-800">Total Allocation</span>
                <span class="text-xs font-bold uppercase px-3 py-1 bg-budget-primary/10 text-budget-primary rounded-full">
                  {{ getActiveMonthLabel() }}
                </span>
              </div>
              <div class="flex items-baseline justify-center w-full mt-4 mb-2">
                @if (budgetService.isLoading()) {
                  <div class="h-10 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
                } @else {
                  <span class="font-bold tracking-tight text-slate-900 leading-none text-center truncate text-[40px]">
                    {{ totalAllocated() | currency:'INR':'₹':'1.0-0' }}
                  </span>
                }
              </div>
            </div>

            <!-- Allocation Progress -->
            <div class="flex flex-row justify-between items-center mt-4 pt-4 border-t border-budget-primary/10">
              
              <!-- Salary Limit -->
              <div class="flex flex-col">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Salary Limit</span>
                <span class="text-sm font-bold text-slate-800 tracking-[0.2em] mt-0.5 cursor-pointer active:scale-95 inline-block transition-transform" (click)="toggleMask(); $event.stopPropagation()">{{ isMasked() ? '••••••' : (salaryUnallocated() | currency:'INR':'₹':'1.0-0') }} <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-normal ml-0.5">Left</span></span>
              </div>

              <!-- Cash Limit -->
              <div class="flex flex-col items-end text-right">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cash Limit</span>
                <span class="text-sm font-bold text-slate-800 tracking-[0.2em] mt-0.5 cursor-pointer active:scale-95 inline-block transition-transform" (click)="toggleMask(); $event.stopPropagation()">{{ isMasked() ? '••••••' : (cashUnallocated() | currency:'INR':'₹':'1.0-0') }} <span class="text-[10px] text-slate-400 font-semibold uppercase tracking-normal ml-0.5">Left</span></span>
              </div>

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
                class="w-full bg-budget-primary/5 border border-budget-primary/20 rounded-[20px] p-4 flex flex-col gap-4 text-left shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all active:scale-[0.99]"
              >
                <div class="flex justify-between items-start w-full">
                  <div class="flex items-center gap-3">
                    <!-- Icon Box -->
                    <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
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
                        <span class="font-bold text-[15px] text-gray-900 cursor-pointer active:scale-95 transition-transform inline-block" (click)="toggleMask(); $event.stopPropagation()">{{ isMasked() ? '••••••' : ('₹' + (totalUnallocated() | number: '1.0-0')) }}</span>
                        @if (totalUnallocated() - getConsumed(budget.name) < 0) {
                          <span class="text-[12px] font-bold text-red-500 mt-0.5 cursor-pointer active:scale-95 transition-transform inline-block" (click)="toggleMask(); $event.stopPropagation()">{{ isMasked() ? '••••••' : ('₹' + (getConsumed(budget.name) - totalUnallocated() | number: '1.0-0')) }} overspent</span>
                        } @else {
                          <span class="text-[12px] font-bold text-emerald-500 mt-0.5 cursor-pointer active:scale-95 transition-transform inline-block" (click)="toggleMask(); $event.stopPropagation()">{{ isMasked() ? '••••••' : ('₹' + (totalUnallocated() - getConsumed(budget.name) | number: '1.0-0')) }} left</span>
                        }
                      </div>
                    } @else {
                      <div class="flex flex-col items-end">
                        <span class="font-bold text-[15px] text-gray-900">₹{{ budget.amount + (budget.rollover_amount || 0) | number: '1.0-0' }}</span>
                        @if ((budget.amount + (budget.rollover_amount || 0)) - getConsumed(budget.name) < 0) {
                          <span class="text-[12px] font-bold text-red-500 mt-0.5">₹{{ getConsumed(budget.name) - (budget.amount + (budget.rollover_amount || 0)) | number: '1.0-0' }} overspent</span>
                        } @else {
                          <span class="text-[12px] font-bold text-emerald-500 mt-0.5">₹{{ (budget.amount + (budget.rollover_amount || 0)) - getConsumed(budget.name) | number: '1.0-0' }} left</span>
                        }
                      </div>
                    }
                    <svg class="w-5 h-5 text-gray-300 ml-1" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <!-- Progress Bar inline with percentage -->
                <div class="flex items-center gap-3 w-full">
                  <div class="h-2 flex-1 bg-budget-primary/10 rounded-full overflow-hidden">
                    <div
                      class="h-full transition-all duration-1000 ease-out rounded-full"
                      [style.width.%]="!budgetService.isLoading() && animateBars() ? getPercent(budget.name, budget.id === 'virtual-others' ? totalUnallocated() : budget.amount + (budget.rollover_amount || 0)) : 0"
                      [ngClass]="getCategoryProgressColor(budget.name)"
                    ></div>
                  </div>
                  <span class="text-xs font-bold text-gray-500 w-8 text-right">{{ getPercent(budget.name, budget.id === 'virtual-others' ? totalUnallocated() : budget.amount + (budget.rollover_amount || 0)) | number: '1.0-0' }}%</span>
                </div>                
              </button>
            }
          } @else {
            <div class="mt-4 w-full bg-[#FCFCFD] border border-solid border-slate-100 shadow-sm rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
              <div class="w-12 h-12 bg-budget-primary/10 rounded-[14px] flex items-center justify-center mb-3">
                <svg class="w-6 h-6 text-budget-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  maskValues = signal<boolean>(false);
  isMasked = computed(() => this.maskValues());
  showSalaryLimit = signal(false);

  ngOnInit() {
    if (this.authService.userProfile().maskValues) {
      this.maskValues.set(true);
    }
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

  toggleMask() {
    this.maskValues.update(v => !v);
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

  accountTracker = inject(AccountTrackerService);

  cashSpend = computed(() => {
    const expenses = this.expenseService.allExpenses();
    let cash = 0;
    for (const exp of expenses) {
      if (exp.category === 'virtual-invest') continue;
      const mode = exp.paid_via?.toLowerCase() || 'upi';
      if (mode.includes('cash')) {
        cash += exp.amount;
      }
    }
    return cash;
  });

  cashLimit = computed(() => {
    return this.accountTracker.cashBalance() + this.cashSpend();
  });

  totalAllocated = computed(() => {
    return this.budgetService
      .budgets()
      .reduce((sum, b) => sum + b.amount + (b.rollover_amount || 0), 0);
  });

  salaryAllocated = computed(() => Math.min(this.totalAllocated(), this.monthlySalary()));
  salaryUnallocated = computed(() => this.monthlySalary() - this.salaryAllocated());
  salaryProgressPercent = computed(() => {
    const s = this.monthlySalary();
    return s > 0 ? (this.salaryAllocated() / s) * 100 : 0;
  });

  cashAllocated = computed(() => Math.max(0, this.totalAllocated() - this.monthlySalary()));
  cashUnallocated = computed(() => Math.max(0, this.cashLimit() - this.cashAllocated()));
  cashProgressPercent = computed(() => {
    const c = this.cashLimit();
    return c > 0 ? (this.cashAllocated() / c) * 100 : 0;
  });

  totalUnallocated = computed(() => this.salaryUnallocated() + this.cashUnallocated());

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
