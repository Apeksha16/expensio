import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { GoalService } from '../../../core/services/goal.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';

@Component({
  selector: 'app-add-funds-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SwipeToCloseDirective,
    AmountInputDirective,
    AutofocusDirective,
  ],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(100%)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('300ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    @if (goalService.isAddFundsSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="active:scale-[0.98] transition-all duration-200 fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        @slideUp
        appSwipeToClose
        (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 z-[70] max-h-[95vh] flex flex-col rounded-t-[32px] shadow-2xl bg-white overflow-hidden"
        style="padding-bottom: env(safe-area-inset-bottom);"
      >
        <!-- Header -->
        <div class="flex justify-between items-center py-4 px-6 text-white bg-goals-primary rounded-t-[32px] sticky top-0 z-10 shrink-0 shadow-sm">
          <h2 class="text-lg font-bold tracking-wide">
            {{ goalService.editingFund() ? 'Edit Fund' : 'Add Funds' }}
          </h2>
          @if (goalService.editingFund()) {
            <button
              type="button"
              (click)="deleteFund()"
              [disabled]="isDeleting() || isSaving()"
              class="w-8 h-8 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 transition-all rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95"
            >
              @if (!isDeleting()) {
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
              @if (isDeleting()) {
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
            </button>
          }
        </div>


        <div class="p-6 bg-white flex-1 overflow-y-auto overscroll-none pb-6" style="scrollbar-width: none;">
          <div class="mb-5 text-center">
            <h3 class="text-xl font-black tracking-tight text-goals-dark">
              {{ goalService.activeGoalForFunds()?.name }}
            </h3>
            <p class="text-[11px] font-bold text-goals-dark/70 tracking-wider uppercase mt-1">
              ₹{{
                $safeNavigationMigration(goalService.activeGoalForFunds()?.saved_amount)
                  | number: '1.0-0'
              }}
              / ₹{{
                $safeNavigationMigration(goalService.activeGoalForFunds()?.total_amount)
                  | number: '1.0-0'
              }}
              Saved
            </p>
          </div>

          <div class="flex flex-col gap-6">
            <div class="flex gap-2">
              <button
                type="button"
                (click)="setMode('installment')"
                class="flex-1 py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wide transition-all active:scale-95 border-2 shadow-sm touch-manipulation disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
                [disabled]="!!goalService.editingFund()"
                [ngClass]="
                  goalService.fundMode() === 'installment'
                    ? 'bg-goals-primary text-white border-goals-primary shadow-md shadow-goals-primary/25'
                    : 'bg-white text-slate-600 border-gray-100'
                "
              >
                Installment
              </button>
              <button
                type="button"
                (click)="setMode('custom')"
                class="flex-1 py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wide transition-all active:scale-95 border-2 shadow-sm touch-manipulation"
                [ngClass]="
                  goalService.fundMode() === 'custom'
                    ? 'bg-goals-primary text-white border-goals-primary shadow-md shadow-goals-primary/25'
                    : 'bg-white text-slate-600 border-gray-100'
                "
              >
                Custom
              </button>
            </div>

            <div class="h-[120px] flex flex-col justify-center">
              @if (goalService.fundMode() === 'installment') {
                <div
                  class="text-center py-6 border border-goals-primary/20 bg-goals-surface rounded-xl w-full shadow-sm"
                >
                  <p class="text-4xl font-black tracking-tight text-goals-dark">
                    ₹{{ getRemainingInstallment() | number: '1.0-0' }}
                  </p>
                  <p
                    class="text-[10px] font-bold text-goals-dark/70 tracking-wider uppercase mt-2"
                  >
                    Recommended Installment
                  </p>
                </div>
              } @else {
                <div class="flex flex-col gap-1.5 w-full">
                  <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                    >Amount</label
                  >
                  <div class="relative group">
                    <div
                      class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                    >
                      <span class="text-gray-400 font-bold text-xl">₹</span>
                    </div>
                    <input
                      [formControl]="customAmount"
                      appAutofocus
                      appAmountInput
                      type="text"
                      inputmode="numeric"
                      placeholder="0"
                      (keydown)="preventE($event)"
                      class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl pl-10 pr-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300 focus:border-goals-primary focus:ring-4 focus:ring-goals-primary/15"
                      [ngClass]="parsedCustomAmount > maxAllowedAmount ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15' : ''"
                    />
                  </div>
                  @if (parsedCustomAmount > maxAllowedAmount) {
                    <p class="text-[10px] text-red-500 font-bold mt-1 px-1">Cannot exceed maximum allowed amount (₹{{ maxAllowedAmount | number:'1.0-0' }}).</p>
                  }
                </div>
              }
            </div>

            <div class="flex gap-3 mt-2">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-bold rounded-2xl border-2 border-gray-100 transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-white text-slate-700 text-center shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="submit()"
                [disabled]="
                  isSaving() || isDeleting() || (goalService.fundMode() === 'custom' && (customAmount.invalid || parsedCustomAmount > maxAllowedAmount))
                "
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-goals-primary text-white shadow-md shadow-goals-primary/30 disabled:opacity-50 disabled:active:scale-100"
              >
                @if (isSaving()) {
                  <svg
                    class="animate-spin h-5 w-5 text-white"
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
                {{ goalService.editingFund() ? 'Update' : 'Add Funds' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class AddFundsSheetComponent {
  goalService = inject(GoalService);
  expenseService = inject(ExpenseService);
  toastService = inject(ToastService);
  confirmService = inject(ConfirmService);
  haptic = inject(HapticService);

  isSaving = signal(false);
  isDeleting = signal(false);
  customAmount = new FormControl('', [Validators.required, Validators.min(1)]);

  constructor() {
    effect(() => {
      const isOpen = this.goalService.isAddFundsSheetOpen();
      const editingFund = this.goalService.editingFund();
      if (!isOpen) {
        this.customAmount.reset();
      } else if (editingFund) {
        this.customAmount.setValue(Math.round(editingFund.amount).toString());
      }
    });
  }

  setMode(mode: 'installment' | 'custom') {
    if (this.goalService.editingFund() && mode === 'installment') return;
    this.haptic.impactLight();
    this.goalService.fundMode.set(mode);
  }

  get maxAllowedAmount(): number {
    const goal = this.goalService.activeGoalForFunds();
    if (!goal) return Infinity;

    const emi = this.goalService.activeEmiForFunds();
    const editing = this.goalService.editingFund();

    let maxForGoal = goal.total_amount - goal.saved_amount;
    if (editing) {
      maxForGoal += editing.amount; // Add back the amount we are currently editing
    }

    if (emi && emi.expected_amount) {
      const expenses = this.expenseService.allExpenses().filter(e => e.goal_emi_id === emi.id);
      let paidForEmi = expenses.reduce((sum, e) => sum + e.amount, 0);
      if (editing) {
        paidForEmi -= editing.amount;
      }
      const maxForEmi = emi.expected_amount - paidForEmi;
      return Math.min(maxForGoal, Math.max(0, maxForEmi));
    }
    
    return maxForGoal;
  }

  get parsedCustomAmount(): number {
    const val = this.customAmount.value;
    if (!val) return 0;
    return Number(val);
  }

  getRemainingInstallment(): number {
    const goal = this.goalService.activeGoalForFunds();
    if (!goal) return 0;
    
    const emi = this.goalService.activeEmiForFunds();
    const baseInstallment = emi ? emi.expected_amount : goal.calculated_installment;

    const activeMonth = this.expenseService.activeMonth();
    const paidThisMonth = this.expenseService
      .expenses()
      .filter((e) => {
        const isGoal = e.category === 'virtual-invest' && e.date.startsWith(activeMonth);
        const isMatch = e.title === goal.name || e.title === `Goal: ${goal.name}`;
        return isGoal && isMatch;
      })
      .reduce((sum, e) => sum + e.amount, 0);

    return Math.max(0, baseInstallment - paidThisMonth);
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  close() {
    this.goalService.closeAddFundsSheet();
  }

  async deleteFund() {
    const goal = this.goalService.activeGoalForFunds();
    const editing = this.goalService.editingFund();
    if (!goal || !editing) return;

    this.confirmService.open({
      title: 'Delete Fund Addition',
      message: 'Are you sure you want to delete this fund addition?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        this.haptic.impactMedium();
        this.isDeleting.set(true);

        const success = await this.expenseService.deleteExpense(editing.id);

        if (success) {
          // Sync handled by Postgres trigger `trg_sync_goal_progress`
          this.toastService.showSuccess('Funds Removed', 'Funds removed. Your goal balance has been updated.');
          this.close();
        } else {
          this.toastService.showError("Couldn't Remove Funds", 'We couldn\'t remove these funds. Please try again.');
        }
        this.isDeleting.set(false);
      },
    });
  }

  async submit() {
    const goal = this.goalService.activeGoalForFunds();
    if (!goal) return;

    let amountToAdd = 0;
    if (this.goalService.fundMode() === 'installment') {
      amountToAdd = Math.round(this.getRemainingInstallment());
    } else {
      amountToAdd = Math.round(Number(this.customAmount.value));
    }

    if (!amountToAdd || amountToAdd <= 0) return;

    this.haptic.impactLight();
    this.isSaving.set(true);

    try {
      const editing = this.goalService.editingFund();

      if (editing) {
        const difference = amountToAdd - editing.amount;

        const updateSuccess = await this.expenseService.updateExpense(
          editing.id,
          {
            ...editing,
            amount: amountToAdd,
          },
          true,
        );

        if (!updateSuccess) throw new Error('Failed to update expense');

        if (difference !== 0) {
          // Sync handled by Postgres trigger `trg_sync_goal_progress`
        }

        this.toastService.showSuccess('Payment Updated', `Your payment is now updated to ₹${amountToAdd}.`);
        this.close();
      } else {
        // Create new distinct transaction
        const activeEmi = this.goalService.activeEmiForFunds();
        const expenseSuccess = await this.expenseService.addExpense(
          {
            amount: amountToAdd,
            category: 'virtual-invest',
            title: `Goal: ${goal.name}`,
            date: new Date().toISOString(),
            paid_via: 'UPI',
            goal_id: goal.id,
            goal_emi_id: activeEmi ? activeEmi.id : undefined,
          },
          true,
        );

        if (!expenseSuccess) {
          throw new Error('Failed to create expense');
        }

        // Sync handled by Postgres trigger `trg_sync_goal_progress`
        this.toastService.showSuccess('Funds Added', `₹${amountToAdd.toLocaleString('en-IN')} added to ${goal.name}.`);
        this.close();
      }
    } catch (e) {
      console.error(e);
      this.toastService.showError("Couldn't Add Funds", 'We couldn\'t update your goal funds. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
