import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { GoalService, Goal } from '../../../core/services/goal.service';
import { BudgetService } from '../../../core/services/budget.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';
import { SafeInputDirective } from '../safe-input.directive';
import { DayPickerComponent } from '../day-picker/day-picker.component';

@Component({
  selector: 'app-goal-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SwipeToCloseDirective,
    AmountInputDirective,
    AutofocusDirective,
    SafeInputDirective,
    DatePickerComponent,
    DayPickerComponent,
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
    @if (goalService.isBottomSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        @slideUp
        appSwipeToClose
        (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 z-[70] max-h-[95vh] overflow-y-auto overscroll-none flex flex-col rounded-t-3xl shadow-2xl"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center py-4 px-6 bg-goals-primary text-white rounded-t-3xl sticky top-0 z-10 shadow-sm"
        >
          <h2 class="text-lg font-bold tracking-wide">
            {{ goalService.editingGoal()?.id ? 'Edit Goal' : 'Add Goal' }}
          </h2>
          @if (goalService.editingGoal()?.id) {
            <button
              type="button"
              (click)="onDelete()"
              [disabled]="isDeleting()"
              class="w-9 h-9 text-white/80 hover:text-white hover:bg-white/10 hover:bg-red-600 transition-all rounded-full flex items-center justify-center text-white disabled:opacity-50 active:scale-95"
            >
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
              } @else {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              }
            </button>
          }
        </div>
        <div class="p-6 bg-white flex-1">
          @if (goalService.editingGoal()?.id) {
            <div class="flex justify-center mb-5">
              <span
                class="text-[10px] font-bold tracking-wide uppercase text-goals-dark bg-goals-surface px-3 py-1 rounded-full border border-goals-primary/10"
              >
                @if (isUpdated()) {
                  Updated
                  {{
                    $safeNavigationMigration(goalService.editingGoal()?.updated_at) | date: 'medium'
                  }}
                } @else {
                  Added
                  {{
                    $safeNavigationMigration(goalService.editingGoal()?.created_at) | date: 'medium'
                  }}
                }
              </span>
            </div>
          }
          <form [formGroup]="goalForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >Name</label
              >
              <input
                [appAutofocus]="!goalService.editingGoal()?.id"
                appSafeInput
                type="text"
                formControlName="name"
                placeholder="e.g. New Bike, Vacation"
                class="w-full bg-white border-2 border-gray-100 text-gray-900 font-bold text-sm rounded-xl focus:bg-white focus:border-goals-primary focus:ring-4 focus:ring-goals-primary/15 block p-3 outline-none transition-all placeholder-gray-400 min-h-[48px] touch-manipulation shadow-sm"
              />
            </div>

            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Total Amount</label
                >
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span class="text-gray-500 font-bold">₹</span>
                  </div>
                  <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    appAmountInput
                    formControlName="total_amount"
                    placeholder="0"
                    (keydown)="preventE($event)"
                    class="w-full bg-white border-2 border-gray-100 text-gray-900 font-bold text-base rounded-xl focus:bg-white focus:border-goals-primary focus:ring-4 focus:ring-goals-primary/15 block p-3 outline-none transition-all placeholder-gray-400 min-h-[48px] touch-manipulation pl-8 shadow-sm"
                  />
                </div>
              </div>

              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Saved Amount</label
                >
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span class="text-gray-500 font-bold">₹</span>
                  </div>
                  <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    appAmountInput
                    formControlName="saved_amount"
                    placeholder="0"
                    (keydown)="preventE($event)"
                    class="w-full bg-white border-2 border-gray-100 text-gray-900 font-bold text-base rounded-xl focus:bg-white focus:border-goals-primary focus:ring-4 focus:ring-goals-primary/15 block p-3 outline-none transition-all placeholder-gray-400 min-h-[48px] touch-manipulation pl-8 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Target Date</label
                >
                <button
                  type="button"
                  (click)="isDatePickerOpen = true"
                  class="w-full bg-white border-2 border-gray-100 text-gray-900 font-semibold text-sm rounded-xl focus:bg-white focus:border-goals-primary focus:ring-4 focus:ring-goals-primary/15 flex justify-between items-center p-3 outline-none transition-all min-h-[48px] touch-manipulation shadow-sm"
                >
                  <span>{{
                    $safeNavigationMigration(goalForm.get('target_date')?.value) | date: 'MMM d, y'
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

              <div class="w-32 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Installment Day</label
                >
                <button
                  type="button"
                  (click)="isDayPickerOpen = true"
                  class="w-full bg-white border-2 border-gray-100 text-gray-900 font-semibold text-sm rounded-xl focus:bg-white focus:border-goals-primary focus:ring-4 focus:ring-goals-primary/15 flex justify-between items-center p-3 outline-none transition-all min-h-[48px] shadow-sm"
                >
                  <span>{{ goalForm.get('installment_date')?.value || 1 }}</span>
                  <svg
                    class="fill-current h-4 w-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >Frequency</label
              >
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="goalForm.patchValue({ frequency: 'monthly' })"
                  class="flex-1 p-2.5 text-xs font-bold uppercase tracking-wide border-2 rounded-xl transition-all active:scale-95 shadow-sm"
                  [ngClass]="
                    goalForm.get('frequency')?.value === 'monthly'
                      ? 'bg-goals-primary text-white border-goals-primary shadow-md shadow-goals-primary/25'
                      : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  "
                >
                  Monthly
                </button>
                <button
                  type="button"
                  (click)="goalForm.patchValue({ frequency: 'alternate' })"
                  class="flex-1 p-2.5 text-xs font-bold uppercase tracking-wide border-2 rounded-xl transition-all active:scale-95 shadow-sm"
                  [ngClass]="
                    goalForm.get('frequency')?.value === 'alternate'
                      ? 'bg-goals-primary text-white border-goals-primary shadow-md shadow-goals-primary/25'
                      : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  "
                >
                  Alternate
                </button>
                <button
                  type="button"
                  (click)="goalForm.patchValue({ frequency: 'quarterly' })"
                  class="flex-1 p-2.5 text-xs font-bold uppercase tracking-wide border-2 rounded-xl transition-all active:scale-95 shadow-sm"
                  [ngClass]="
                    goalForm.get('frequency')?.value === 'quarterly'
                      ? 'bg-goals-primary text-white border-goals-primary shadow-md shadow-goals-primary/25'
                      : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                  "
                >
                  Quarterly
                </button>
              </div>
            </div>

            <!-- Calculated Preview -->
            <div class="bg-goals-surface border border-goals-primary/20 p-4 rounded-xl flex justify-between items-center mt-2 gap-4 shadow-sm">
              <div class="flex-1 min-w-0">
                <p
                  class="text-[11px] font-bold text-goals-dark tracking-wider uppercase truncate"
                >
                  Calculated Installment
                </p>
                <p class="text-[10px] text-goals-dark/70 font-medium leading-tight mt-0.5 pr-2">
                  Based on remaining amount & time
                </p>
              </div>
              <div class="text-lg font-black text-goals-dark whitespace-nowrap shrink-0">
                ₹{{ previewInstallment | number: '1.0-0' }}
              </div>
            </div>

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
                [disabled]="!goalForm.valid || isSaving() || isDeleting()"
                class="flex-1 font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3.5 text-sm min-h-[48px] bg-goals-primary hover:bg-goals-dark text-white shadow-lg shadow-goals-primary/30 disabled:opacity-50 disabled:active:scale-100"
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
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <app-date-picker
      [isOpen]="isDatePickerOpen"
      [initialDate]="$safeNavigationMigration(goalForm.get('target_date')?.value)"
      (dateSelected)="onDateSelected($event)"
      (closed)="isDatePickerOpen = false"
    ></app-date-picker>
    <app-day-picker
      [isOpen]="isDayPickerOpen"
      [initialDay]="$safeNavigationMigration(goalForm.get('installment_date')?.value)"
      (daySelected)="goalForm.patchValue({ installment_date: $event }); isDayPickerOpen = false"
      (closed)="isDayPickerOpen = false"
    ></app-day-picker>
  `,
})
export class GoalSheetComponent implements OnInit {
  goalService = inject(GoalService);
  budgetService = inject(BudgetService);
  expenseService = inject(ExpenseService);
  confirmService = inject(ConfirmService);
  fb = inject(FormBuilder);
  haptic = inject(HapticService);

  isSaving = signal(false);
  isDeleting = signal(false);
  isDatePickerOpen = false;
  isDayPickerOpen = false;
  daysArray = Array.from({ length: 31 }, (_, i) => i + 1);

  goalForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    total_amount: ['', [Validators.required, Validators.min(1)]],
    saved_amount: ['0', [Validators.min(0)]],
    target_date: [this.getDefaultTargetDate(), Validators.required],
    frequency: ['monthly', Validators.required],
    installment_date: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    icon: [
      'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5',
    ],
  });

  goalIcons = [
    {
      name: 'Target',
      path: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5',
    },
    {
      name: 'Trophy',
      path: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M18.75 4.236c.982.143 1.954.317 2.916.52a6.003 6.003 0 01-5.395 4.972M10.5 2.25H13.5c.83 0 1.5.67 1.5 1.5v1.5a7.5 7.5 0 01-15 0v-1.5c0-.83.67-1.5 1.5-1.5z',
    },
    {
      name: 'Vehicle',
      path: 'M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z',
    },
    {
      name: 'House',
      path: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
    },
    {
      name: 'Tech',
      path: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25',
    },
    {
      name: 'Travel',
      path: 'M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5',
    },
    {
      name: 'Education',
      path: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
    },
    {
      name: 'Star',
      path: 'M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.536a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z',
    },
  ];

  get previewInstallment(): number {
    const total = Number(this.goalForm.get('total_amount')?.value) || 0;
    const saved = Number(this.goalForm.get('saved_amount')?.value) || 0;
    const targetDate = this.goalForm.get('target_date')?.value || new Date().toISOString();
    const frequency = this.goalForm.get('frequency')?.value || 'monthly';
    return this.goalService.calculateInstallment(total, saved, targetDate, frequency);
  }

  constructor() {
    effect(() => {
      const editing = this.goalService.editingGoal();
      if (editing) {
        this.goalForm.patchValue({
          name: editing.name,
          total_amount: editing.total_amount.toString(),
          saved_amount: editing.saved_amount.toString(),
          target_date: editing.target_date || this.getDefaultTargetDate(),
          frequency: editing.frequency || 'monthly',
          installment_date: editing.installment_date || 1,
          icon: editing.icon,
        });
      } else {
        const currentTargetDate =
          this.goalForm?.get('target_date')?.value || this.getDefaultTargetDate();
        this.goalForm.reset({
          saved_amount: '0',
          target_date: currentTargetDate,
          frequency: 'monthly',
          installment_date: 1,
          icon: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5',
        });
      }
    });
  }

  ngOnInit() {}

  getDefaultTargetDate() {
    const d = new Date();
    d.setMonth(d.getMonth() + 6); // Default target 6 months from now
    return d.toISOString();
  }

  isUpdated(): boolean {
    const goal = this.goalService.editingGoal();
    if (!goal || !goal.created_at || !goal.updated_at) return false;
    const diff = Math.abs(
      new Date(goal.updated_at).getTime() - new Date(goal.created_at).getTime(),
    );
    return diff > 5000;
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  onDateSelected(date: string) {
    this.goalForm.patchValue({ target_date: date });
    this.isDatePickerOpen = false;
  }

  selectIcon(iconPath: string) {
    this.haptic.impactLight();
    this.goalForm.patchValue({ icon: iconPath });
  }

  close() {
    const currentTargetDate =
      this.goalForm?.get('target_date')?.value || this.getDefaultTargetDate();
    this.goalForm.reset({
      saved_amount: '0',
      target_date: currentTargetDate,
      frequency: 'monthly',
      installment_date: 1,
      icon: 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5',
    });
    this.goalService.closeBottomSheet();
  }

  async onSubmit() {
    if (this.goalForm.invalid) return;
    this.haptic.impactLight();
    this.isSaving.set(true);

    const val = this.goalForm.value;
    const editing = this.goalService.editingGoal();

    let success = false;
    if (editing?.id) {
      const oldName = editing.name;
      success = await this.goalService.updateGoal(editing.id, {
        name: val.name,
        total_amount: Number(val.total_amount),
        saved_amount: Number(val.saved_amount),
        target_date: val.target_date,
        frequency: val.frequency,
        installment_date: Number(val.installment_date),
        icon: val.icon,
        updated_at: new Date().toISOString(),
      });

      // If name changed, update associated transactions
      if (success && oldName !== val.name) {
        await this.expenseService.updateExpensesForGoalRename(oldName, val.name);
      }
    } else {
      success = await this.goalService.addGoal({
        name: val.name,
        total_amount: Number(val.total_amount),
        saved_amount: Number(val.saved_amount),
        target_date: val.target_date,
        frequency: val.frequency,
        installment_date: Number(val.installment_date),
        icon: val.icon,
      });
    }

    this.isSaving.set(false);
    if (success) {
      this.close();
    }
  }

  async onDelete() {
    const editing = this.goalService.editingGoal();
    if (!editing?.id) return;

    this.confirmService.open({
      title: 'Delete Goal',
      message: 'Are you sure you want to delete this goal?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        this.isDeleting.set(true);
        const success = await this.goalService.deleteGoal(editing.id);
        this.isDeleting.set(false);
        if (success) {
          this.close();
        }
      },
    });
  }
}
