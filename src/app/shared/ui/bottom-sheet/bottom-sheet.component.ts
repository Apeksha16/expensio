import {
  Component,
  inject,
  OnInit,
  effect,
  signal,
  computed,
  untracked,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { ExpenseService } from '../../../core/services/expense.service';
import { BudgetService } from '../../../core/services/budget.service';
import { GoalService } from '../../../core/services/goal.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';
import { SafeInputDirective } from '../safe-input.directive';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePickerComponent,
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
  changeDetection: ChangeDetectionStrategy.Eager,
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
               max-h-[95vh] overflow-y-auto overscroll-none flex flex-col rounded-t-3xl shadow-2xl border-t border-gray-100"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center py-4 px-6 bg-expense-primary text-white rounded-t-3xl sticky top-0 z-10 shadow-sm"
        >
          <h2 class="text-lg font-bold tracking-wide">
            {{ isEditing ? 'Edit Expense' : 'Add Expense' }}
          </h2>
          <div class="flex gap-2">
            @if (isEditing) {
              <button
                type="button"
                (click)="delete()"
                [disabled]="isDeleting() || isSaving()"
                class="w-9 h-9 bg-white/20 hover:bg-red-600 transition-all rounded-full flex items-center justify-center text-white disabled:opacity-50 active:scale-95"
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
        <div class="p-6 bg-white flex-1">
          @if (isEditing) {
            <div class="flex justify-center mb-5">
              <span
                class="text-[10px] font-bold tracking-wide uppercase text-expense-dark bg-expense-surface px-3 py-1 rounded-full border border-expense-primary/10"
              >
                Added
                {{
                  $safeNavigationMigration(expenseService.editingExpense()?.created_at)
                    | date: 'medium'
                }}
              </span>
            </div>
          }
          <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Amount -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >Amount</label
              >
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span class="text-gray-500 font-bold">₹</span>
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
                  class="w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold text-base rounded-xl focus:bg-white focus:border-expense-primary focus:ring-4 focus:ring-expense-primary/15 block p-3 outline-none transition-all placeholder-gray-400 min-h-[48px] touch-manipulation pl-8 shadow-sm"
                />
              </div>
            </div>
            <!-- Name -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >Expense Name</label
              >
              <div class="relative group">
                <input
                  type="text"
                  formControlName="title"
                  appSafeInput
                  placeholder="What was this for?"
                  class="w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold text-sm rounded-xl focus:bg-white focus:border-expense-primary focus:ring-4 focus:ring-expense-primary/15 block p-3 outline-none transition-all placeholder-gray-400 min-h-[48px] touch-manipulation shadow-sm"
                />
              </div>
            </div>
            <!-- Budgets -->
            @if (isBudgetsLoading()) {
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Budget</label
                >
                <div class="grid grid-cols-4 gap-2">
                  @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
                    <div
                      class="flex flex-col items-center justify-center gap-1 p-2 border border-gray-100 bg-gray-50 rounded-xl min-h-[64px] animate-pulse"
                    >
                      <div class="w-5 h-5 bg-gray-200 rounded-full"></div>
                      <div class="h-2 bg-gray-200 w-10 mt-1 rounded"></div>
                    </div>
                  }
                </div>
              </div>
            } @else if (localBudgets().length > 0) {
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Budget</label
                >
                <div class="grid grid-cols-4 gap-2">
                  @for (cat of budgetCategories(); track cat) {
                    <button
                      type="button"
                      (click)="selectBudget(cat)"
                      class="flex flex-col items-center justify-center gap-1.5 p-2.5 border rounded-xl transition-all min-h-[64px] active:scale-95 shadow-sm"
                      [ngClass]="
                        expenseForm.get('category')?.value === cat.name
                          ? 'bg-expense-primary text-white border-expense-primary shadow-md shadow-expense-primary/25 font-bold'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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
            }
            <!-- Paid Via -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >Paid Via</label
              >
              <div class="grid grid-cols-3 gap-2">
                @for (method of ['Cash', 'Credit Card', 'UPI']; track method) {
                  <button
                    type="button"
                    (click)="expenseForm.patchValue({ paid_via: method })"
                    class="flex flex-col items-center justify-center gap-1 p-2.5 border rounded-xl transition-all min-h-[44px] active:scale-95 shadow-sm"
                    [ngClass]="
                      expenseForm.get('paid_via')?.value === method
                        ? 'bg-expense-primary text-white border-expense-primary shadow-md shadow-expense-primary/25 font-bold'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    "
                  >
                    <span class="text-xs font-semibold tracking-wide text-center">{{
                      method
                    }}</span>
                  </button>
                }
              </div>
            </div>
            <!-- Date -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >Date</label
              >
              <button
                type="button"
                (click)="isDatePickerOpen = true"
                class="w-full bg-gray-50 border border-gray-200 text-gray-900 font-semibold text-sm rounded-xl focus:bg-white focus:border-expense-primary focus:ring-4 focus:ring-expense-primary/15 flex justify-between items-center p-3 outline-none transition-all min-h-[48px] touch-manipulation shadow-sm"
              >
                <span>{{
                  $safeNavigationMigration(expenseForm.get('date')?.value)
                    | date: 'MMM d, y, h:mm a'
                }}</span>
                <svg
                  class="w-5 h-5 text-gray-400"
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
            <div class="mt-6 flex gap-3">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3.5 text-sm min-h-[48px] bg-gray-100 text-gray-700 hover:bg-gray-200 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!expenseForm.valid || isSaving() || isDeleting()"
                class="flex-1 font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3.5 text-sm min-h-[48px] bg-expense-primary hover:bg-expense-dark text-white shadow-lg shadow-expense-primary/30 disabled:opacity-50 disabled:active:scale-100"
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
      [initialDate]="$safeNavigationMigration(expenseForm.get('date')?.value)"
      (dateSelected)="onDateSelected($event)"
      (closed)="isDatePickerOpen = false"
    >
    </app-date-picker>
  `,
})
export class BottomSheetComponent implements OnInit {
  expenseService = inject(ExpenseService);
  budgetService = inject(BudgetService);
  goalService = inject(GoalService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);
  private haptic = inject(HapticService);
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);

  expenseForm!: FormGroup;
  isEditing = false;
  isDatePickerOpen = false;
  isSaving = signal(false);
  isDeleting = signal(false);

  selectedMonth = signal<string>('');
  localBudgets = signal<any[]>([]);
  isBudgetsLoading = signal(false);

  budgetCategories = computed(() => {
    const defaultCats = [
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
        name: 'Other',
        path: 'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0',
      },
    ];
    if (this.localBudgets().length === 0) return defaultCats;
    return this.localBudgets()
      .filter((b) => b.id !== 'virtual-others')
      .map((b) => ({
        name: b.name,
        path:
          b.icon_path ||
          'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
      }));
  });

  constructor() {
    effect(() => {
      const month = this.selectedMonth();
      const isOpen = this.expenseService.isBottomSheetOpen();
      if (month && isOpen) {
        untracked(async () => {
          try {
            this.isBudgetsLoading.set(true);
            const { data, error } = await this.supabaseService.client
              .from('budgets')
              .select('*')
              .eq('month', month)
              .order('created_at', { ascending: true });

            if (error) throw error;

            const fetchedBudgets = data || [];
            const hasOthers = fetchedBudgets.some(
              (b: any) => b.name.toLowerCase() === 'others' || b.name.toLowerCase() === 'other',
            );

            if (!hasOthers) {
              fetchedBudgets.push({
                id: 'virtual-others',
                name: 'Others',
                amount: 0,
                icon_path:
                  '<svg class="w-6 h-6 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>',
                month: month,
                auto_rollover: false,
              });
            }

            this.localBudgets.set(fetchedBudgets);
          } catch (error) {
            console.error('Error fetching budgets:', error);
            this.localBudgets.set([]);
          } finally {
            this.isBudgetsLoading.set(false);
          }
        });
      } else {
        untracked(() => {
          this.localBudgets.set([]);
          this.isBudgetsLoading.set(false);
        });
      }
    });

    effect(() => {
      const isOpen = this.expenseService.isBottomSheetOpen();
      const editing = this.expenseService.editingExpense();

      if (isOpen) {
        if (!this.expenseForm) {
          this.initForm();
        } else {
          this.isEditing = !!editing;
          const dateStr = editing?.date ? editing.date : new Date().toISOString();
          const d = editing?.date ? new Date(editing.date) : new Date();
          const y = d.getFullYear();
          const m = (d.getMonth() + 1).toString().padStart(2, '0');
          this.selectedMonth.set(`${y}-${m}`);
          this.expenseForm.reset({
            title: editing?.title || '',
            amount: editing?.amount || null,
            category: editing?.category || 'Others',
            date: dateStr,
            paid_via: editing?.paid_via || 'UPI',
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

    const dateStr = editing?.date ? editing.date : new Date().toISOString();
    const d = editing?.date ? new Date(editing.date) : new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    this.selectedMonth.set(`${y}-${m}`);

    this.expenseForm = this.fb.group({
      title: [
        { value: editing?.title || '', disabled: editing?.category === 'virtual-invest' },
        Validators.required,
      ],
      amount: [editing?.amount || null, [Validators.required, Validators.min(0.01)]],
      category: [
        { value: editing?.category || 'Others', disabled: editing?.category === 'virtual-invest' },
        Validators.required,
      ],
      paid_via: [editing?.paid_via || 'UPI', Validators.required],
      date: [dateStr, Validators.required],
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
      this.selectedMonth.set(`${year}-${month}`);
    }

    this.expenseForm.patchValue({ date: dateObj.toISOString() });
  }

  selectBudget(cat: { name: string; path: string }) {
    this.expenseForm.patchValue({ category: cat.name });
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
          const original = this.expenseService.editingExpense()!;
          const id = original.id;
          const success = await this.expenseService.deleteExpense(id);
          this.isDeleting.set(false);

          if (success) {
            if (original.category === 'virtual-invest') {
              const goalName = original.title.replace('Goal: ', '');
              const goal = this.goalService.goals().find((g) => g.name === goalName);
              if (goal) {
                await this.goalService.updateGoal(
                  goal.id,
                  { saved_amount: goal.saved_amount - original.amount },
                  true,
                );
              }
            }
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
      const formValue = this.expenseForm.getRawValue();
      const expenseData = {
        title: formValue.title,
        amount: Number(formValue.amount),
        category: formValue.category || 'Others',
        paid_via: formValue.paid_via || 'UPI',
        date: new Date(formValue.date).toISOString(),
      };

      let success = false;
      if (this.isEditing) {
        const original = this.expenseService.editingExpense()!;
        const id = original.id;
        success = await this.expenseService.updateExpense(id, expenseData);
        if (success && original.category === 'virtual-invest') {
          const goalName = original.title.replace('Goal: ', '');
          const goal = this.goalService.goals().find((g) => g.name === goalName);
          if (goal) {
            const diff = expenseData.amount - original.amount;
            if (diff !== 0) {
              await this.goalService.updateGoal(
                goal.id,
                { saved_amount: goal.saved_amount + diff },
                true,
              );
            }
          }
        }
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
