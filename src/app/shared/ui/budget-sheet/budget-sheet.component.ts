import { Component, inject, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { BudgetService } from '../../../core/services/budget.service';
import { ConfirmService } from '../../../core/services/confirm.service';

import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { HapticService } from '../../../core/services/haptic.service';

import { AmountInputDirective } from '../amount-input.directive';
import { AutofocusDirective } from '../autofocus.directive';
import { SafeInputDirective } from '../safe-input.directive';

@Component({
  selector: 'app-budget-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SwipeToCloseDirective,
    AmountInputDirective,
    AutofocusDirective,
    SafeInputDirective,
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
    @if (budgetService.isBottomSheetOpen()) {
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
        <div class="flex justify-between items-center py-4 px-6 text-white rounded-t-[32px] sticky top-0 z-10 shrink-0 shadow-sm" [ngClass]="theme.bg">
          <h2 class="text-lg font-bold tracking-wide">
            {{ isEditing ? 'Edit Budget' : 'Add Budget' }}
          </h2>
          @if (isEditing) {
            <button
              type="button"
              (click)="onDelete()"
              [disabled]="budgetService.isDeleting() || budgetService.isSaving()"
              class="w-8 h-8 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 transition-all rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95"
            >
              @if (!budgetService.isDeleting()) {
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              }
              @if (budgetService.isDeleting()) {
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
            </button>
          }
        </div>

        <div class="p-6 bg-white flex-1 overflow-y-auto overscroll-none pb-6" style="scrollbar-width: none;">
          @if (isEditing) {
            <div class="flex justify-center mb-5">
              <span
                class="text-[10px] font-bold tracking-wide uppercase text-budget-dark bg-budget-surface px-3 py-1 rounded-full border border-budget-primary/10"
              >
                Added
                {{
                  $safeNavigationMigration(budgetService.editingBudget()?.created_at)
                    | date: 'medium'
                }}
              </span>
            </div>
          }
          <form [formGroup]="budgetForm" (ngSubmit)="onSubmit()" class="space-y-4 text-left">
            <!-- Icon/Category Picker -->
            <div class="flex flex-col gap-2">
              <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase"
                >Choose Icon & Preset</label
              >
              <div class="grid grid-cols-4 gap-2">
                @for (cat of categories; track cat) {
                  <button
                    type="button"
                    (click)="selectCategory(cat)"
                    class="flex flex-col items-center justify-center gap-1.5 p-2.5 border-2 rounded-2xl transition-all min-h-[64px] active:scale-95"
                    [ngClass]="
                      budgetForm.get('icon_path')?.value === cat.path
                        ? theme.activeBg
                        : 'bg-white text-slate-600 border-gray-100 shadow-sm'
                    "
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path [attr.d]="cat.path"></path>
                    </svg>
                    <span
                      class="text-[10px] font-semibold tracking-wide text-center line-clamp-1 w-full overflow-hidden text-ellipsis"
                      >{{ cat.name }}</span
                    >
                  </button>
                }
              </div>
            </div>
            <!-- Budget Name -->
            <div class="flex flex-col gap-2">
              <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Budget Name</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-400"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                </div>
                <input
                  appAutofocus
                  appSafeInput
                  type="text"
                  formControlName="name"
                  class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl pl-11 pr-4 py-4 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400" [ngClass]="[theme.focusBorder, theme.focusRing]"
                  placeholder="e.g. Groceries"
                />
              </div>
            </div>
            <!-- Allocated Amount -->
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-end">
                <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Allocated Amount</label>
                <span class="text-[11px] font-semibold text-blue-600">
                  Max Available: {{ maxAllowedAmount | currency: 'INR' : 'symbol' : '1.0-0' }}
                </span>
              </div>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span class="font-bold text-xl" [ngClass]="theme.text">₹</span>
                </div>
                <input
                  type="text"
                  inputmode="decimal"
                  appAmountInput
                  formControlName="amount"
                  placeholder="0.00"
                  (keydown)="preventE($event)"
                  class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl pl-11 pr-4 py-4 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300" [ngClass]="[theme.focusBorder, theme.focusRing]"
                />
              </div>
            </div>
            <!-- Auto Rollover -->
            <label
              class="flex items-center gap-3 p-3.5 bg-white border-2 border-gray-100 rounded-xl transition-all cursor-pointer w-full mt-2 shadow-sm relative group"
            >
              <div class="relative flex items-center justify-center w-[22px] h-[22px] shrink-0">
                <input
                  type="checkbox"
                  formControlName="auto_rollover"
                  class="peer sr-only"
                />
                <div class="absolute inset-0 rounded-full border-2 transition-all" [ngClass]="budgetForm.get('auto_rollover')?.value ? theme.activeBg : 'border-gray-200 bg-white'"></div>
                <svg class="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 transition-opacity drop-shadow-sm" [class.opacity-100]="budgetForm.get('auto_rollover')?.value" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span
                class="text-[11px] font-bold text-gray-700 tracking-wider uppercase select-none mt-0.5"
              >
                Auto-add for next month
              </span>
            </label>
            <!-- Bottom Buttons -->
            <div class="mt-6 flex gap-3 pb-2">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-slate-100 text-slate-700 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="
                  budgetForm.invalid ||
                  !isAmountValid ||
                  budgetService.isSaving() ||
                  budgetService.isDeleting()
                "
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm text-white shadow-md disabled:opacity-50 disabled:active:scale-100" [ngClass]="theme.bg"
              >
                @if (budgetService.isSaving()) {
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                }
                <span>{{ budgetService.isSaving() ? 'Saving...' : isEditing ? 'Update Budget' : 'Save Budget' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class BudgetSheetComponent {
  router = inject(Router);

  get theme() {
    const route = this.router.url.split('/')[1] || 'dashboard';
    switch (route) {
      case 'expenses': return { text: 'text-expense-primary', bg: 'bg-expense-primary', border: 'border-expense-primary', focusBorder: 'focus:border-expense-primary', focusRing: 'focus:ring-4 focus:ring-expense-primary/15', shadow: 'shadow-expense-primary/20', activeBg: 'bg-expense-primary text-white border-expense-primary shadow-md shadow-expense-primary/20' };
      case 'budgets': return { text: 'text-budget-primary', bg: 'bg-budget-primary', border: 'border-budget-primary', focusBorder: 'focus:border-budget-primary', focusRing: 'focus:ring-4 focus:ring-budget-primary/15', shadow: 'shadow-budget-primary/20', activeBg: 'bg-budget-primary text-white border-budget-primary shadow-md shadow-budget-primary/20' };
      case 'friends': return { text: 'text-friends-primary', bg: 'bg-friends-primary', border: 'border-friends-primary', focusBorder: 'focus:border-friends-primary', focusRing: 'focus:ring-4 focus:ring-friends-primary/15', shadow: 'shadow-friends-primary/20', activeBg: 'bg-friends-primary text-white border-friends-primary shadow-md shadow-friends-primary/20' };
      case 'splits': return { text: 'text-splits-primary', bg: 'bg-splits-primary', border: 'border-splits-primary', focusBorder: 'focus:border-splits-primary', focusRing: 'focus:ring-4 focus:ring-splits-primary/15', shadow: 'shadow-splits-primary/20', activeBg: 'bg-splits-primary text-white border-splits-primary shadow-md shadow-splits-primary/20' };
      case 'subscriptions': return { text: 'text-subscriptions-primary', bg: 'bg-subscriptions-primary', border: 'border-subscriptions-primary', focusBorder: 'focus:border-subscriptions-primary', focusRing: 'focus:ring-4 focus:ring-subscriptions-primary/15', shadow: 'shadow-subscriptions-primary/20', activeBg: 'bg-subscriptions-primary text-white border-subscriptions-primary shadow-md shadow-subscriptions-primary/20' };
      case 'goals': 
      case 'goal-transactions': return { text: 'text-goals-primary', bg: 'bg-goals-primary', border: 'border-goals-primary', focusBorder: 'focus:border-goals-primary', focusRing: 'focus:ring-4 focus:ring-goals-primary/15', shadow: 'shadow-goals-primary/20', activeBg: 'bg-goals-primary text-white border-goals-primary shadow-md shadow-goals-primary/20' };
      case 'ledger': 
      case 'ledger-details': return { text: 'text-ledger-primary', bg: 'bg-ledger-primary', border: 'border-ledger-primary', focusBorder: 'focus:border-ledger-primary', focusRing: 'focus:ring-4 focus:ring-ledger-primary/15', shadow: 'shadow-ledger-primary/20', activeBg: 'bg-ledger-primary text-white border-ledger-primary shadow-md shadow-ledger-primary/20' };
      case 'tracker': return { text: 'text-tracker-primary', bg: 'bg-tracker-primary', border: 'border-tracker-primary', focusBorder: 'focus:border-tracker-primary', focusRing: 'focus:ring-4 focus:ring-tracker-primary/15', shadow: 'shadow-tracker-primary/20', activeBg: 'bg-tracker-primary text-white border-tracker-primary shadow-md shadow-tracker-primary/20' };
      case 'profile': return { text: 'text-profile-primary', bg: 'bg-profile-primary', border: 'border-profile-primary', focusBorder: 'focus:border-profile-primary', focusRing: 'focus:ring-4 focus:ring-profile-primary/15', shadow: 'shadow-profile-primary/20', activeBg: 'bg-profile-primary text-white border-profile-primary shadow-md shadow-profile-primary/20' };
      case 'reports': return { text: 'text-reports-primary', bg: 'bg-reports-primary', border: 'border-reports-primary', focusBorder: 'focus:border-reports-primary', focusRing: 'focus:ring-4 focus:ring-reports-primary/15', shadow: 'shadow-reports-primary/20', activeBg: 'bg-reports-primary text-white border-reports-primary shadow-md shadow-reports-primary/20' };
      default: return { text: 'text-expense-primary', bg: 'bg-expense-primary', border: 'border-expense-primary', focusBorder: 'focus:border-expense-primary', focusRing: 'focus:ring-4 focus:ring-expense-primary/15', shadow: 'shadow-expense-primary/20', activeBg: 'bg-expense-primary text-white border-expense-primary shadow-md shadow-expense-primary/20' };
    }
  }

  haptic = inject(HapticService);
  budgetService = inject(BudgetService);
  private fb = inject(FormBuilder);
  private confirmService = inject(ConfirmService);

  budgetForm: FormGroup;
  maxAllowedAmount = 0;

  constructor() {
    this.budgetForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      amount: ['', [Validators.required, Validators.min(1)]],
      icon_path: ['', Validators.required],
      auto_rollover: [false],
    });

    effect(() => {
      if (this.budgetService.isBottomSheetOpen()) {
        this.setupForm();
      }
    });
  }

  categories = [
    {
      name: 'Food',
      path: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
    },
    {
      name: 'Transport',
      path: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2 M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    },
    {
      name: 'Shopping',
      path: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0',
    },
    { name: 'Utilities', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
    {
      name: 'Entertain',
      path: 'M2 10h20 M8 2v4 M16 2v4 M2 14h20 M2 18h20 M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z',
    },
    { name: 'Health', path: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    { name: 'Travel', path: 'M22 2 11 13 M22 2l-7 20-4-9-9-4Z' },
    {
      name: 'Education',
      path: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z',
    },
    {
      name: 'Bills',
      path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
    },
    {
      name: 'Gifts',
      path: 'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
    },
    { name: 'Invest', path: 'M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6' },
    {
      name: 'Other',
      path: 'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0',
    },
  ];

  get isEditing(): boolean {
    return !!this.budgetService.editingBudget();
  }

  get isAmountValid(): boolean {
    const amount = this.budgetForm.get('amount')?.value || 0;
    return amount <= this.maxAllowedAmount && amount > 0;
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  private setupForm() {
    const editing = this.budgetService.editingBudget();
    this.maxAllowedAmount = this.budgetService.remainingSalary() + (editing ? editing.amount : 0);

    if (editing) {
      this.budgetForm.patchValue({
        name: editing.name,
        amount: editing.amount,
        icon_path: editing.icon_path,
        auto_rollover: editing.auto_rollover || false,
      });
    } else {
      this.budgetForm.reset({
        name: '',
        amount: '',
        icon_path: '',
        auto_rollover: false,
      });
    }
  }

  selectCategory(cat: { name: string; path: string }) {
    const currentName = this.budgetForm.get('name')?.value;
    if (!currentName || currentName.trim() === '') {
      this.budgetForm.patchValue({ icon_path: cat.path, name: cat.name });
    } else {
      this.budgetForm.patchValue({ icon_path: cat.path });
    }
  }

  close() {
    this.haptic.impactLight();
    this.budgetService.closeBottomSheet();
  }

  async onSubmit() {
    if (this.budgetForm.invalid || !this.isAmountValid) return;

    const data = this.budgetForm.value;
    const editing = this.budgetService.editingBudget();

    let success = false;
    if (editing) {
      success = await this.budgetService.updateBudget(editing.id, data, editing.name);
    } else {
      success = await this.budgetService.addBudget(data);
    }

    if (success) {
      this.haptic.success();
      this.close();
    } else {
      this.haptic.error();
    }
  }

  onDelete() {
    const editing = this.budgetService.editingBudget();
    if (!editing) return;

    this.confirmService.open({
      title: 'Delete Budget',
      message:
        'Are you sure you want to delete this budget goal? Your expenses will remain but will be moved to the "Others" category.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        this.haptic.impactMedium();
        const success = await this.budgetService.deleteBudget(editing.id, editing.name);
        if (success) {
          this.haptic.success();
          this.close();
        } else {
          this.haptic.error();
        }
      },
    });
  }
}
