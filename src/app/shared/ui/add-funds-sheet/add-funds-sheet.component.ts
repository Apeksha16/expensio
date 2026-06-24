import { Component, inject, signal, effect } from '@angular/core';
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
  imports: [CommonModule, ReactiveFormsModule, SwipeToCloseDirective, AmountInputDirective, AutofocusDirective],
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
  template: `
    @if (goalService.isAddFundsSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        @slideUp
        appSwipeToClose (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 bg-black z-[70] max-h-[95vh] overflow-y-auto overscroll-none flex flex-col shadow-2xl"
      >
        <!-- Header -->
        <div class="flex justify-between items-center py-4 px-6 bg-black border-b border-black text-white sticky top-[-2px] z-10">
          <h2 class="text-xl font-extrabold tracking-tight">{{ goalService.editingFund() ? 'Edit Fund' : 'Add Funds' }}</h2>
          <div class="flex gap-2">
            @if (goalService.editingFund()) {
              <button
                type="button"
                (click)="deleteFund()"
                [disabled]="isDeleting() || isSaving()"
                class="w-8 h-8 bg-red-500 flex items-center justify-center border-2 border-transparent hover:border-white transition-colors rounded-none text-white disabled:opacity-50"
              >
                @if (!isDeleting()) {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
        </div>

        <div class="p-6 bg-white flex-1">
          <div class="mb-5 text-center">
            <h3 class="text-xl font-extrabold tracking-tight text-gray-900">{{ goalService.activeGoalForFunds()?.name }}</h3>
            <p class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase mt-1">
              ₹{{ goalService.activeGoalForFunds()?.saved_amount | number:'1.0-0' }} / ₹{{ goalService.activeGoalForFunds()?.total_amount | number:'1.0-0' }} Saved
            </p>
          </div>

          <div class="flex flex-col gap-6">
            <div class="flex bg-gray-100 p-1">
              <button
                type="button"
                (click)="setMode('installment')"
                class="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors duration-200"
                [ngClass]="fundMode() === 'installment' ? 'bg-black shadow-sm text-white' : 'text-gray-500 hover:bg-gray-200'"
              >
                Installment
              </button>
              <button
                type="button"
                (click)="setMode('custom')"
                class="flex-1 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors duration-200"
                [ngClass]="fundMode() === 'custom' ? 'bg-black shadow-sm text-white' : 'text-gray-500 hover:bg-gray-200'"
              >
                Custom
              </button>
            </div>

            <div class="h-[120px] flex flex-col justify-center">
              @if (fundMode() === 'installment') {
                <div class="text-center py-6 border-2 border-dashed border-gray-200 bg-gray-50 w-full">
                  <p class="text-4xl font-extrabold tracking-tight text-[#1a2e22]">
                    ₹{{ getRemainingInstallment() | number:'1.0-0' }}
                  </p>
                  <p class="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-2">Recommended Installment</p>
                </div>
              } @else {
                <div class="flex flex-col gap-1 w-full">
                  <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">Amount</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span class="text-gray-500 font-medium">₹</span>
                    </div>
                    <input
                      [formControl]="customAmount"
                      appAutofocus
                      appAmountInput
                      type="text"
                      inputmode="numeric"
                      placeholder="0"
                      (keydown)="preventE($event)"
                      class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8"
                    />
                  </div>
                </div>
              }
            </div>

            <div class="flex gap-4 mt-2">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-medium rounded-none transition-all duration-200 flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-300 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="submit()"
                [disabled]="isSaving() || isDeleting() || (fundMode() === 'custom' && customAmount.invalid)"
                class="flex-1 font-medium rounded-none transition-all duration-200 flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-[#1a2e22] hover:bg-[#2f4d3b] text-white disabled:opacity-70 disabled:cursor-not-allowed"
              >
                @if (isSaving()) {
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                }
                {{ goalService.editingFund() ? 'Update' : 'Add Funds' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class AddFundsSheetComponent {
  goalService = inject(GoalService);
  expenseService = inject(ExpenseService);
  toastService = inject(ToastService);
  confirmService = inject(ConfirmService);
  haptic = inject(HapticService);

  isSaving = signal(false);
  isDeleting = signal(false);
  fundMode = signal<'installment' | 'custom'>('installment');
  customAmount = new FormControl('', [Validators.required, Validators.min(1)]);

  constructor() {
    effect(() => {
      const isOpen = this.goalService.isAddFundsSheetOpen();
      const editingFund = this.goalService.editingFund();
      if (!isOpen) {
        this.fundMode.set('installment');
        this.customAmount.reset();
      } else if (editingFund) {
        this.fundMode.set('custom');
        this.customAmount.setValue(Math.round(editingFund.amount).toString());
      }
    });
  }

  setMode(mode: 'installment' | 'custom') {
    this.haptic.impactLight();
    this.fundMode.set(mode);
  }

  getRemainingInstallment(): number {
    const goal = this.goalService.activeGoalForFunds();
    if (!goal) return 0;
    
    const activeMonth = this.expenseService.activeMonth();
    const paidThisMonth = this.expenseService.expenses().filter(e => {
      const isGoal = e.category === 'virtual-invest' && e.date.startsWith(activeMonth);
      const isMatch = e.title === goal.name || e.title === `Goal: ${goal.name}`;
      return isGoal && isMatch;
    }).reduce((sum, e) => sum + e.amount, 0);

    return Math.max(0, goal.calculated_installment - paidThisMonth);
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
          await this.goalService.updateGoal(goal.id, {
            saved_amount: goal.saved_amount - editing.amount
          }, true);
          this.toastService.showSuccess('Funds removed successfully.');
          this.close();
        } else {
          this.toastService.showError("Couldn't remove funds.");
        }
        this.isDeleting.set(false);
      }
    });
  }

  async submit() {
    const goal = this.goalService.activeGoalForFunds();
    if (!goal) return;

    let amountToAdd = 0;
    if (this.fundMode() === 'installment') {
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
        
        const updateSuccess = await this.expenseService.updateExpense(editing.id, {
          ...editing,
          amount: amountToAdd
        }, true);
        
        if (!updateSuccess) throw new Error('Failed to update expense');
        
        if (difference !== 0) {
          const updatedSavedAmount = goal.saved_amount + difference;
          const goalSuccess = await this.goalService.updateGoal(goal.id, {
            saved_amount: updatedSavedAmount
          }, true);
          if (!goalSuccess) throw new Error("Couldn't update goal.");
        }
        
        this.toastService.showSuccess(`Goal balance updated to ₹${amountToAdd}.`);
        this.close();
      } else {
        // Add new or update existing for this month
        const activeMonth = this.expenseService.activeMonth();
        const existingExpense = this.expenseService.expenses().find(e => {
          const isGoal = e.category === 'virtual-invest' && e.date.startsWith(activeMonth);
          const isMatch = e.title === goal.name || e.title === `Goal: ${goal.name}`;
          return isGoal && isMatch;
        });

        if (existingExpense) {
          // Append to existing expense
          const updateSuccess = await this.expenseService.updateExpense(existingExpense.id, {
            ...existingExpense,
            amount: existingExpense.amount + amountToAdd
          }, true);

          if (!updateSuccess) throw new Error('Failed to update existing expense');
          
          const updatedSavedAmount = goal.saved_amount + amountToAdd;
          const goalSuccess = await this.goalService.updateGoal(goal.id, {
            saved_amount: updatedSavedAmount
          }, true);

          if (goalSuccess) {
            this.toastService.showSuccess(`₹${amountToAdd} added to ${goal.name}.`);
            this.close();
          } else {
            throw new Error("Couldn't update goal.");
          }
        } else {
          // Create new
          const expenseSuccess = await this.expenseService.addExpense({
            amount: amountToAdd,
            category: 'virtual-invest',
            title: goal.name,
            date: new Date().toISOString(),
            goal_id: goal.id
          }, true);

          if (!expenseSuccess) {
            throw new Error('Failed to create expense');
          }

          const updatedSavedAmount = goal.saved_amount + amountToAdd;
          const goalSuccess = await this.goalService.updateGoal(goal.id, {
            saved_amount: updatedSavedAmount
          }, true);

          if (goalSuccess) {
            this.toastService.showSuccess(`₹${amountToAdd} added to ${goal.name}.`);
            this.close();
          } else {
            throw new Error("Couldn't update goal.");
          }
        }
      }
    } catch (e) {
      console.error(e);
      this.toastService.showError("Couldn't add funds. Please try again.");
    } finally {
      this.isSaving.set(false);
    }
  }
}
