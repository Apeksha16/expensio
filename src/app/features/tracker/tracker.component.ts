import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountTrackerService, AccountType } from '../../core/services/account-tracker.service';
import { MonthPickerService } from '../../core/services/month-picker.service';
import { HapticService } from '../../core/services/haptic.service';
import { ToastService } from '../../core/services/toast.service';
import { AmountInputDirective } from '../../shared/ui/amount-input.directive';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule, FormsModule, AmountInputDirective],
  template: `
    <div class="h-full overflow-y-auto space-y-6 pb-28 px-4 pt-4">

      <!-- Top Summary Header & Action Buttons -->
      <div class="bg-tracker-primary text-white p-5 rounded-[24px] shadow-xl shadow-tracker-primary/20 flex flex-col relative overflow-hidden">
        <div class="flex justify-between items-center mb-3">
          <span class="text-xs font-extrabold uppercase tracking-widest text-tracker-light/80">Total Net Worth</span>
          <div class="flex items-center gap-2">
            <button
              (click)="openWizard()"
              class="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-full transition-colors flex items-center gap-1 backdrop-blur-md"
            >
              <span>⚙️ Setup Balances</span>
            </button>
            <button
              (click)="openMonthPicker()"
              class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-full transition-colors flex items-center gap-1.5 backdrop-blur-md"
            >
              <span>📅 {{ formatMonth(trackerService.activeMonth()) }}</span>
            </button>
          </div>
        </div>
        <div class="text-3xl font-black tracking-tight">
          ₹{{ trackerService.totalBalance().toLocaleString() }}
        </div>
      </div>

      <!-- End of Month Salary Rollover Banner -->
      <div class="bg-gradient-to-br from-tracker-surface to-tracker-primary/10 p-5 border border-tracker-primary/20 rounded-[24px] shadow-sm relative overflow-hidden">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-tracker-primary text-white font-black text-[10px] uppercase tracking-wider rounded-full mb-2">
              <span>⚡ Month-End Savings Auto-Rollover</span>
            </div>
            <h3 class="text-lg font-black text-gray-900 leading-tight">
              Salary Surplus to Savings
            </h3>
            <p class="text-xs font-semibold text-gray-600 mt-1">
              At the end of the month, any amount remaining in your Salary Account automatically moves into Savings!
            </p>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-tracker-primary/20 flex items-center justify-center text-2xl flex-shrink-0">
            🏦
          </div>
        </div>

        @if (trackerService.currentMonthRollover()) {
          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-2">
            <span class="text-base">✅</span>
            <span>
              Rolled over ₹{{ trackerService.currentMonthRollover()?.rolled_over_amount?.toLocaleString() }} into Savings for {{ formatMonth(trackerService.activeMonth()) }}.
            </span>
          </div>
        } @else {
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 mt-1 border-t border-tracker-primary/20/50">
            <div>
              <span class="text-xs font-bold text-gray-500 block">Current Salary Surplus</span>
              <span class="text-xl font-black text-tracker-dark">
                ₹{{ trackerService.salarySurplusForActiveMonth().toLocaleString() }}
              </span>
            </div>

            <button
              (click)="triggerRollover()"
              [disabled]="trackerService.salarySurplusForActiveMonth() <= 0 || trackerService.isLoading()"
              class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Roll Over to Savings 🚀</span>
            </button>
          </div>
        }
      </div>

      <!-- Accounts Cards Grid -->
      <div class="space-y-4">
        <div class="flex justify-between items-center px-1">
          <h3 class="text-xs font-extrabold uppercase tracking-widest text-gray-500">
            Your Accounts (3 Types)
          </h3>
          <span class="text-[11px] font-bold text-tracker-primary">Cash expenses deduct from Cash Account</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <!-- Salary Account Card -->
          <div class="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99] relative group">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-xl">💳</div>
                <div>
                  <h4 class="font-black text-base text-gray-900">Salary Account</h4>
                  <span class="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">Primary Income</span>
                </div>
              </div>
            </div>
            <div class="text-2xl font-black text-gray-900 mb-4">
              ₹{{ trackerService.salaryBalance().toLocaleString() }}
            </div>
            <div class="flex gap-2">
              <button
                (click)="openDeposit('Salary')"
                class="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-extrabold text-xs transition-colors"
              >
                + Deposit
              </button>
              <button
                (click)="openTransfer('Salary')"
                class="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-extrabold text-xs transition-colors"
              >
                Transfer 🔄
              </button>
            </div>
          </div>

          <!-- Cash Account Card -->
          <div class="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99] relative group">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-xl">💵</div>
                <div>
                  <h4 class="font-black text-base text-gray-900">Cash Account</h4>
                  <span class="text-[10px] font-extrabold uppercase text-amber-600 tracking-wider">Physical Wallet</span>
                </div>
              </div>
            </div>
            <div class="text-2xl font-black text-gray-900 mb-4">
              ₹{{ trackerService.cashBalance().toLocaleString() }}
            </div>
            <div class="flex gap-2">
              <button
                (click)="openDeposit('Cash')"
                class="flex-1 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-extrabold text-xs transition-colors"
              >
                + Cash Add
              </button>
              <button
                (click)="openExpense('Cash')"
                class="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-extrabold text-xs transition-colors"
              >
                - Spend
              </button>
            </div>
          </div>

          <!-- Savings Account Card -->
          <div class="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99] relative group">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-xl">🐷</div>
                <div>
                  <h4 class="font-black text-base text-gray-900">Savings Account</h4>
                  <span class="text-[10px] font-extrabold uppercase text-emerald-600 tracking-wider">Monthly Accumulator</span>
                </div>
              </div>
            </div>
            <div class="text-2xl font-black text-gray-900 mb-4">
              ₹{{ trackerService.savingsBalance().toLocaleString() }}
            </div>
            <div class="flex gap-2">
              <button
                (click)="openDeposit('Savings')"
                class="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-extrabold text-xs transition-colors"
              >
                + Deposit
              </button>
              <button
                (click)="openTransfer('Savings')"
                class="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-extrabold text-xs transition-colors"
              >
                Transfer 🔄
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Quick Action Buttons Bar -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          (click)="trackerService.openBottomSheet('deposit', 'Salary')"
          class="py-3 bg-white hover:bg-gray-50 border border-gray-100 rounded-[20px] font-extrabold text-xs text-gray-900 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <span>➕ Add Deposit</span>
        </button>
        <button
          (click)="trackerService.openBottomSheet('withdrawal', 'Cash')"
          class="py-3 bg-white hover:bg-gray-50 border border-gray-100 rounded-[20px] font-extrabold text-xs text-gray-900 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <span>💸 Record Expense</span>
        </button>
        <button
          (click)="trackerService.openBottomSheet('transfer', 'Salary')"
          class="py-3 bg-white hover:bg-gray-50 border border-gray-100 rounded-[20px] font-extrabold text-xs text-gray-900 shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <span>🔄 Transfer Funds</span>
        </button>
        <button
          (click)="triggerRollover()"
          [disabled]="trackerService.salarySurplusForActiveMonth() <= 0"
          class="py-3 bg-tracker-surface hover:bg-tracker-primary/20 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 text-tracker-dark rounded-[20px] font-extrabold text-xs shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          <span>⚡ Month Rollover</span>
        </button>
      </div>

      <!-- Transaction History Section -->
      <div class="bg-white border border-gray-100 p-5 rounded-[24px] shadow-sm">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h3 class="font-black text-base text-gray-900 tracking-tight">
            Transaction History ({{ formatMonth(trackerService.activeMonth()) }})
          </h3>

          <!-- Filter Pills -->
          <div class="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 no-scrollbar">
            @for (filter of filterOptions; track filter) {
              <button
                (click)="selectedFilter.set(filter)"
                [class.bg-tracker-primary]="selectedFilter() === filter"
                [class.text-white]="selectedFilter() === filter"
                [class.bg-gray-100]="selectedFilter() !== filter"
                [class.text-gray-600]="selectedFilter() !== filter"
                class="px-4 py-1.5 text-xs font-extrabold rounded-full transition-colors whitespace-nowrap"
              >
                {{ filter }}
              </button>
            }
          </div>
        </div>

        <!-- Transactions List -->
        @if (filteredTransactions().length === 0) {
          <div class="text-center py-10 bg-gray-50 rounded-2xl text-gray-400 font-semibold text-sm">
            No transactions found for this period.
          </div>
        } @else {
          <div class="space-y-1">
            @for (tx of filteredTransactions(); track tx.id) {
              <div class="py-3 flex items-center justify-between gap-3 px-2 hover:bg-gray-50 rounded-xl transition-colors">
                <div class="flex items-center gap-3">
                  <div
                    [class.bg-emerald-50]="tx.transaction_type === 'Income' || tx.transaction_type === 'Rollover'"
                    [class.bg-red-50]="tx.transaction_type === 'Expense'"
                    [class.bg-blue-50]="tx.transaction_type === 'Transfer'"
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  >
                    @if (tx.transaction_type === 'Income') { 💰 }
                    @else if (tx.transaction_type === 'Expense') { 💸 }
                    @else if (tx.transaction_type === 'Rollover') { 🏦 }
                    @else { 🔄 }
                  </div>
                  <div>
                    <div class="font-extrabold text-sm text-gray-900">
                      {{ tx.description || tx.transaction_type }}
                    </div>
                    <div class="flex items-center gap-2 text-[11px] font-bold text-gray-500">
                      <span class="px-2 py-0.5 bg-gray-100 rounded-md text-gray-700">
                        {{ tx.account_type }}
                        @if (tx.target_account_type) { ➔ {{ tx.target_account_type }} }
                      </span>
                      <span>{{ formatDate(tx.date) }}</span>
                    </div>
                  </div>
                </div>

                <div
                  [class.text-emerald-600]="tx.transaction_type === 'Income' || tx.transaction_type === 'Rollover'"
                  [class.text-red-600]="tx.transaction_type === 'Expense'"
                  [class.text-gray-900]="tx.transaction_type === 'Transfer'"
                  class="font-black text-base text-right whitespace-nowrap"
                >
                  {{ tx.transaction_type === 'Expense' ? '-' : (tx.transaction_type === 'Transfer' ? '' : '+') }}₹{{ tx.amount.toLocaleString() }}
                </div>
              </div>
            }
          </div>
        }
      </div>

    </div>

    <!-- Step-by-Step Initial Setup Wizard Modal -->
    @if (isWizardOpen()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
          <button
            (click)="closeWizard()"
            class="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 font-bold transition-colors"
          >
            ✕
          </button>

          <!-- Step Indicator -->
          <div class="flex items-center justify-between mb-6 pr-10">
            <span class="text-xs font-black uppercase tracking-widest text-tracker-primary">
              Account Setup Wizard
            </span>
            <span class="px-2.5 py-1 bg-tracker-surface rounded-full font-extrabold text-[10px] text-tracker-dark uppercase tracking-widest">
              Step {{ wizardStep() }} of 3
            </span>
          </div>

          <!-- Step 1: Salary Account -->
          @if (wizardStep() === 1) {
            <div class="space-y-6">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl">💳</div>
                <div>
                  <h3 class="font-black text-xl text-gray-900">Salary Account</h3>
                  <p class="text-xs font-medium text-gray-500 mt-0.5">First, enter your monthly salary or current Salary balance.</p>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-extrabold uppercase tracking-widest text-gray-700 mb-2">
                  Salary Account Balance (₹)
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</span>
                  <input
                    type="text"
                    appAmountInput
                    [(ngModel)]="salaryVal"
                    placeholder="e.g. 50000"
                    class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-black focus:bg-white focus:border-tracker-primary focus:ring-2 focus:ring-tracker-primary/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-2">
                <button
                  (click)="closeWizard()"
                  class="px-5 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full font-extrabold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  (click)="nextWizardStep()"
                  class="px-6 py-3 bg-tracker-primary hover:bg-tracker-dark text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-tracker-primary/30 active:scale-95 transition-all"
                >
                  Next ➔
                </button>
              </div>
            </div>
          }

          <!-- Step 2: Cash Account -->
          @if (wizardStep() === 2) {
            <div class="space-y-6">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-3xl">💵</div>
                <div>
                  <h3 class="font-black text-xl text-gray-900">Cash Account</h3>
                  <p class="text-xs font-medium text-gray-500 mt-0.5">Next, enter the cash in hand or cash wallet balance.</p>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-extrabold uppercase tracking-widest text-gray-700 mb-2">
                  Cash Account Balance (₹)
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</span>
                  <input
                    type="text"
                    appAmountInput
                    [(ngModel)]="cashVal"
                    placeholder="e.g. 5000"
                    class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-black focus:bg-white focus:border-tracker-primary focus:ring-2 focus:ring-tracker-primary/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div class="flex justify-between gap-3 pt-2">
                <button
                  (click)="prevWizardStep()"
                  class="px-5 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full font-extrabold text-xs transition-colors"
                >
                  ⬅ Back
                </button>
                <button
                  (click)="nextWizardStep()"
                  class="px-6 py-3 bg-tracker-primary hover:bg-tracker-dark text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-tracker-primary/30 active:scale-95 transition-all"
                >
                  Next ➔
                </button>
              </div>
            </div>
          }

          <!-- Step 3: Savings Account -->
          @if (wizardStep() === 3) {
            <div class="space-y-6">
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl">🐷</div>
                <div>
                  <h3 class="font-black text-xl text-gray-900">Savings Account</h3>
                  <p class="text-xs font-medium text-gray-500 mt-0.5">Finally, enter your current accumulated Savings balance.</p>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-extrabold uppercase tracking-widest text-gray-700 mb-2">
                  Savings Account Balance (₹)
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</span>
                  <input
                    type="text"
                    appAmountInput
                    [(ngModel)]="savingsVal"
                    placeholder="e.g. 25000"
                    class="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xl font-black focus:bg-white focus:border-tracker-primary focus:ring-2 focus:ring-tracker-primary/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div class="flex justify-between gap-3 pt-2">
                <button
                  (click)="prevWizardStep()"
                  class="px-5 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full font-extrabold text-xs transition-colors"
                >
                  ⬅ Back
                </button>
                <button
                  (click)="submitWizard()"
                  [disabled]="trackerService.isLoading()"
                  class="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-emerald-500/30 active:scale-95 transition-all"
                >
                  {{ trackerService.isLoading() ? 'Saving...' : 'Save & Finish 🎉' }}
                </button>
              </div>
            </div>
          }

        </div>
      </div>
    }
  `,
})
export class TrackerComponent {
  trackerService = inject(AccountTrackerService);
  private monthPickerService = inject(MonthPickerService);
  private haptic = inject(HapticService);
  private toastService = inject(ToastService);

  filterOptions: ('All' | AccountType)[] = ['All', 'Salary', 'Cash', 'Savings'];
  selectedFilter = signal<'All' | AccountType>('All');

  // Setup Wizard State
  isWizardOpen = signal(false);
  wizardStep = signal<1 | 2 | 3>(1);
  salaryVal = '';
  cashVal = '';
  savingsVal = '';

  constructor() {
    this.monthPickerService.monthSelected$.subscribe((month: string) => {
      this.trackerService.setMonthFilter(month);
    });
  }

  filteredTransactions = computed(() => {
    const filter = this.selectedFilter();
    const list = this.trackerService.transactions();

    if (filter === 'All') return list;
    return list.filter(t => t.account_type === filter || t.target_account_type === filter);
  });

  openWizard() {
    this.haptic.selection();
    this.salaryVal = (this.trackerService.salaryBalance() || '').toString();
    this.cashVal = (this.trackerService.cashBalance() || '').toString();
    this.savingsVal = (this.trackerService.savingsBalance() || '').toString();
    this.wizardStep.set(1);
    this.isWizardOpen.set(true);
  }

  closeWizard() {
    this.isWizardOpen.set(false);
  }

  nextWizardStep() {
    this.haptic.selection();
    if (this.wizardStep() === 1) this.wizardStep.set(2);
    else if (this.wizardStep() === 2) this.wizardStep.set(3);
  }

  prevWizardStep() {
    this.haptic.selection();
    if (this.wizardStep() === 3) this.wizardStep.set(2);
    else if (this.wizardStep() === 2) this.wizardStep.set(1);
  }

  async submitWizard() {
    this.haptic.impactMedium();
    const sal = parseFloat(this.salaryVal) || 0;
    const csh = parseFloat(this.cashVal) || 0;
    const svg = parseFloat(this.savingsVal) || 0;

    await this.trackerService.setInitialBalances(sal, csh, svg);
    this.toastService.show('Accounts set up successfully!', 'success');
    this.closeWizard();
  }

  openMonthPicker() {
    this.haptic.selection();
    this.monthPickerService.open(this.trackerService.activeMonth());
  }

  openDeposit(type: AccountType) {
    this.haptic.selection();
    this.trackerService.openBottomSheet('deposit', type);
  }

  openExpense(type: AccountType) {
    this.haptic.selection();
    this.trackerService.openBottomSheet('withdrawal', type);
  }

  openTransfer(type: AccountType) {
    this.haptic.selection();
    this.trackerService.openBottomSheet('transfer', type);
  }

  triggerRollover() {
    this.haptic.impactMedium();
    this.trackerService.executeMonthEndRollover();
  }

  formatMonth(monthStr: string): string {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}
