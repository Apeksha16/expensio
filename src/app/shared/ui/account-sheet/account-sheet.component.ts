import {
  Component,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { AccountTrackerService, AccountType, TransactionType } from '../../../core/services/account-tracker.service';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { AutofocusDirective } from '../autofocus.directive';
import { HapticService } from '../../../core/services/haptic.service';

@Component({
  selector: 'app-account-sheet',
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
    @if (trackerService.isSheetOpen()) {
      <!-- Backdrop -->
      <div
        class="active:scale-[0.98] transition-all duration-200 fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        @fadeIn
        (click)="close()"
      ></div>

      <!-- Bottom Sheet container -->
      <div
        class="fixed inset-x-0 bottom-0 z-50 flex flex-col justify-end pointer-events-none max-w-lg mx-auto"
        @slideUp
      >
          <div
            appSwipeToClose
            (closeSwipe)="close()"
            class="pointer-events-auto bg-white rounded-t-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto" style="padding-bottom: calc(env(safe-area-inset-bottom) + 1.5rem);"
          >
            <!-- Header -->
            <div class="flex justify-between items-center py-4 px-6 text-white bg-slate-900 rounded-t-[32px] sticky top-0 z-10 shrink-0 shadow-sm">
              <h2 class="text-lg font-bold tracking-wide">
                {{ titleText }}
              </h2>
              <button
                (click)="close()"
                class="w-8 h-8 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 transition-all rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95"
              >
                ✕
              </button>
            </div>
            
            <div class="p-6 pb-2">
            <!-- Action Mode Tabs -->
            <div class="grid grid-cols-3 gap-2 mb-6">
              <button
                type="button"
                (click)="setMode('deposit')"
                class="flex-1 py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border-2 shadow-sm touch-manipulation"
                [ngClass]="
                  trackerService.sheetMode() === 'deposit'
                    ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/25 font-bold'
                    : 'bg-white text-slate-600 border-gray-100'
                "
              >
                Deposit 💰
              </button>
              <button
                type="button"
                (click)="setMode('withdrawal')"
                class="flex-1 py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border-2 shadow-sm touch-manipulation"
                [ngClass]="
                  trackerService.sheetMode() === 'withdrawal'
                    ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25 font-bold'
                    : 'bg-white text-slate-600 border-gray-100'
                "
              >
                Expense 💸
              </button>
              <button
                type="button"
                (click)="setMode('transfer')"
                class="flex-1 py-3 px-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 border-2 shadow-sm touch-manipulation"
                [ngClass]="
                  trackerService.sheetMode() === 'transfer'
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25 font-bold'
                    : 'bg-white text-slate-600 border-gray-100'
                "
              >
                Transfer 🔄
              </button>
            </div>

            <!-- Form -->
            <form [formGroup]="accountForm" (ngSubmit)="onSubmit()" class="space-y-4">
              
              <!-- Primary Account Selector -->
              <div>
                <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {{ trackerService.sheetMode() === 'transfer' ? 'From Account' : 'Account' }}
                </label>
                <div class="grid grid-cols-3 gap-2">
                  @for (acc of accountTypes; track acc) {
                    <button
                      type="button"
                      (click)="selectAccount(acc)"
                      class="py-3 px-2 border-2 font-bold text-xs uppercase text-center transition-all rounded-2xl active:scale-95 shadow-sm touch-manipulation"
                      [ngClass]="
                        accountForm.value.account_type === acc
                          ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/25'
                          : 'bg-white text-slate-600 border-gray-100'
                      "
                    >
                      {{ acc }}
                    </button>
                  }
                </div>
              </div>

              <!-- Target Account Selector (For Transfer Mode) -->
              @if (trackerService.sheetMode() === 'transfer') {
                <div>
                  <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    To Target Account
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    @for (acc of accountTypes; track acc) {
                      <button
                        type="button"
                        [disabled]="accountForm.value.account_type === acc"
                        (click)="selectTargetAccount(acc)"
                        class="py-3 px-2 border-2 font-bold text-xs uppercase text-center transition-all rounded-2xl active:scale-95 shadow-sm touch-manipulation"
                        [ngClass]="{
                          'opacity-40 pointer-events-none': accountForm.value.account_type === acc,
                          'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25': accountForm.value.target_account_type === acc && accountForm.value.account_type !== acc,
                          'bg-white text-slate-600 border-gray-100': accountForm.value.target_account_type !== acc && accountForm.value.account_type !== acc
                        }"
                      >
                        {{ acc }}
                      </button>
                    }
                  </div>
                </div>
              }

              <!-- Amount Input -->
              <div>
                <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Amount (₹)
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₹</span>
                  <input
                    type="text"
                    appAmountInput
                    appAutofocus
                    formControlName="amount"
                    placeholder="0"
                    class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl pl-10 pr-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
                  />
                </div>
              </div>

              <!-- Description Input -->
              <div>
                <label class="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Note / Description (Optional)
                </label>
                <input
                  type="text"
                  formControlName="description"
                  placeholder="e.g. Salary deposit, ATM cash withdrawal, Savings transfer"
                  class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl px-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
                />
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                [disabled]="accountForm.invalid || trackerService.isLoading()"
                class="w-full py-4 px-6 bg-sky-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-md active:scale-95 transition-all mt-6 touch-manipulation"
              >
                {{ trackerService.isLoading() ? 'Saving...' : 'Confirm Transaction' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    }
  `,
})
export class AccountSheetComponent {
  trackerService = inject(AccountTrackerService);
  private fb = inject(FormBuilder);
  private haptic = inject(HapticService);

  accountTypes: AccountType[] = ['Salary', 'Cash', 'Savings'];

  accountForm: FormGroup = this.fb.group({
    account_type: ['Salary', Validators.required],
    target_account_type: ['Savings'],
    amount: ['', [Validators.required, Validators.min(1)]],
    description: [''],
  });

  constructor() {
    effect(() => {
      if (this.trackerService.isSheetOpen()) {
        const mode = this.trackerService.sheetMode();
        const initialAcc = this.trackerService.selectedAccountType();
        let targetAcc: AccountType = initialAcc === 'Salary' ? 'Savings' : 'Salary';

        this.accountForm.patchValue({
          account_type: initialAcc,
          target_account_type: targetAcc,
          amount: '',
          description: '',
        });
      }
    });
  }

  get titleText(): string {
    const mode = this.trackerService.sheetMode();
    if (mode === 'deposit') return 'Add Account Deposit';
    if (mode === 'withdrawal') return 'Record Account Expense';
    return 'Transfer Between Accounts';
  }

  setMode(mode: 'deposit' | 'withdrawal' | 'transfer') {
    this.haptic.impactLight();
    this.trackerService.sheetMode.set(mode);
  }

  selectAccount(acc: AccountType) {
    this.haptic.selection();
    this.accountForm.patchValue({ account_type: acc });
    if (this.accountForm.value.target_account_type === acc) {
      const remaining = this.accountTypes.find(t => t !== acc) || 'Savings';
      this.accountForm.patchValue({ target_account_type: remaining });
    }
  }

  selectTargetAccount(acc: AccountType) {
    this.haptic.selection();
    this.accountForm.patchValue({ target_account_type: acc });
  }

  close() {
    this.trackerService.closeBottomSheet();
  }

  onSubmit() {
    if (this.accountForm.invalid) return;

    this.haptic.impactMedium();
    const val = this.accountForm.value;
    const mode = this.trackerService.sheetMode();

    let txType: TransactionType = 'Income';
    if (mode === 'withdrawal') txType = 'Expense';
    if (mode === 'transfer') txType = 'Transfer';

    this.trackerService.addTransaction({
      account_type: val.account_type,
      transaction_type: txType,
      amount: parseFloat(val.amount),
      description: val.description,
      target_account_type: mode === 'transfer' ? val.target_account_type : undefined
    });
  }
}
