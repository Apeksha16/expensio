import { Component, inject, OnInit, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { ExpenseService } from '../../../core/services/expense.service';
import { BudgetService } from '../../../core/services/budget.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent, SwipeToCloseDirective, AmountInputDirective, AutofocusDirective],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(100%)' })),
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
    @if (expenseService.isBottomSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        appSwipeToClose
        (swipeClose)="close()"
        @slideUp
        class="fixed bottom-0 left-0 right-0 bg-white z-[70] 
               max-h-[95vh] overflow-y-auto overscroll-contain flex flex-col shadow-2xl"
      >

        <!-- Header -->
        <div
          class="flex justify-between items-center py-4 px-6 bg-black border-b border-black text-white sticky top-0 z-10"
        >
          <h2 class="text-xl font-extrabold tracking-tight">
            {{ isEditing ? 'Edit expense' : 'Add expense' }}
          </h2>
          <div class="flex gap-2">
            @if (isEditing) {
              <button
                type="button"
                (click)="delete()"
                [disabled]="isDeleting() || isSaving()"
                class="w-8 h-8 bg-red-500 flex items-center justify-center border-2 border-transparent hover:border-white transition-colors rounded-none text-white disabled:opacity-50"
              >
                @if (!isDeleting()) {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                }
                @if (isDeleting()) {
                  <svg
                    class="animate-spin h-4 w-4 text-white"
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
              </button>
            }
          </div>
        </div>
        <div class="p-6">
          <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Amount -->
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                >Amount</label
              >
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 font-medium">₹</span>
                </div>
                <input
                  appAutofocus
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  appAmountInput
                  formControlName="amount"
                  placeholder="0"
                  (keydown)="preventE($event)"
                  class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8"
                />
              </div>
            </div>
            <!-- Name -->
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                >Expense Name</label
              >
              <div class="relative group">
                <input
                  type="text"
                  formControlName="title"
                  placeholder="e.g. Coffee"
                  class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans"
                />
              </div>
            </div>
            <!-- Budgets -->
            @if (budgetService.budgets().length > 0) {
              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                  >Budget</label
                >
                <div class="grid grid-cols-4 gap-2">
                  @for (cat of budgetCategories(); track cat) {
                    <button
                      type="button"
                      (click)="selectBudget(cat)"
                      class="flex flex-col items-center justify-center gap-1 p-2 border-2 rounded-none transition-all min-h-[60px]"
                      [ngClass]="
                        expenseForm.get('category')?.value === cat.name
                          ? 'border-[#1a2e22] bg-[#1a2e22] text-white'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
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
                        class="text-[9px] font-semibold uppercase tracking-wider text-center line-clamp-1 w-full overflow-hidden text-ellipsis"
                        >{{ cat.name }}</span
                      >
                    </button>
                  }
                </div>
              </div>
            }
            <!-- Date -->
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                >Date</label
              >
              <button
                type="button"
                (click)="isDatePickerOpen = true"
                class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all min-h-[44px] touch-manipulation font-sans flex justify-between items-center text-left"
              >
                <span>{{ expenseForm.get('date')?.value | date: 'MMM d, y, h:mm a' }}</span>
                <svg
                  class="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
            <!-- Bottom Buttons -->
            <div class="mt-4 flex gap-4">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-300 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!expenseForm.valid || isSaving() || isDeleting()"
                class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-[#1a2e22] hover:bg-[#2f4d3b] text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
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
                <span>{{ isSaving() ? 'Saving...' : isEditing ? 'Update' : 'Save' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Global Date Picker for Form -->
    <app-date-picker
      [isOpen]="isDatePickerOpen"
      [initialDate]="expenseForm.get('date')?.value"
      (dateSelected)="onDateSelected($event)"
      (closed)="isDatePickerOpen = false"
    >
    </app-date-picker>
  `,
})
export class BottomSheetComponent implements OnInit {
  expenseService = inject(ExpenseService);
  budgetService = inject(BudgetService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);
  private haptic = inject(HapticService);
  private fb = inject(FormBuilder);

  expenseForm!: FormGroup;
  isEditing = false;
  isDatePickerOpen = false;
  isSaving = signal(false);
  isDeleting = signal(false);

  budgetCategories = computed(() => {
    return this.budgetService.budgets().map((b) => ({
      name: b.name,
      path:
        b.icon_path ||
        'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z', // Fallback icon
    }));
  });

  constructor() {
    effect(() => {
      const isOpen = this.expenseService.isBottomSheetOpen();
      const editing = this.expenseService.editingExpense();

      if (isOpen) {
        if (!this.expenseForm) {
          this.initForm();
        } else {
          this.isEditing = !!editing;
          this.expenseForm.reset({
            title: editing?.title || '',
            amount: editing?.amount || null,
            category: editing?.category || 'Others',
            date: editing?.date ? editing.date : new Date().toISOString(),
          });
        }
      }
    });
  }

  ngOnInit() {
    if (!this.expenseForm) {
      this.initForm();
    }
  }

  private initForm() {
    const editing = this.expenseService.editingExpense();
    this.isEditing = !!editing;

    this.expenseForm = this.fb.group({
      title: [editing?.title || '', Validators.required],
      amount: [editing?.amount || null, [Validators.required, Validators.min(0.01)]],
      category: [editing?.category || 'Others', Validators.required],
      date: [
        editing?.date ? editing.date : new Date().toISOString(),
        Validators.required,
      ],
    });
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  close() {
    this.haptic.impactLight();
    this.expenseService.closeBottomSheet();
  }

  onDateSelected(dateStr: string) {
    const existingDateVal = this.expenseForm.get('date')?.value;
    const dateObj = existingDateVal ? new Date(existingDateVal) : new Date();
    
    // dateStr is YYYY-MM-DD
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      dateObj.setFullYear(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    }
    
    this.expenseForm.patchValue({ date: dateObj.toISOString() });
  }

  selectBudget(cat: { name: string; path: string }) {
    this.expenseForm.patchValue({ category: cat.name, title: cat.name });
  }

  delete() {
    if (this.isEditing) {
      this.confirmService.open({
        title: 'Delete Expense',
        message: 'Are you sure you want to delete this expense? This action cannot be undone.',
        confirmText: 'Delete',
        onConfirm: async () => {
          this.haptic.impactMedium();
          this.isDeleting.set(true);
          const id = this.expenseService.editingExpense()!.id;
          const success = await this.expenseService.deleteExpense(id);
          this.isDeleting.set(false);

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

  async onSubmit() {
    if (this.expenseForm.valid && !this.isSaving()) {
      this.isSaving.set(true);
      const formValue = this.expenseForm.value;
      const expenseData = {
        title: formValue.title,
        amount: Number(formValue.amount),
        category: formValue.category,
        date: new Date(formValue.date).toISOString(),
      };

      let success = false;
      if (this.isEditing) {
        const id = this.expenseService.editingExpense()!.id;
        success = await this.expenseService.updateExpense(id, expenseData);
      } else {
        success = await this.expenseService.addExpense(expenseData);
      }

      this.isSaving.set(false);

      if (success) {
        this.haptic.success();
        this.close();
      } else {
        this.haptic.error();
      }
    }
  }
}
