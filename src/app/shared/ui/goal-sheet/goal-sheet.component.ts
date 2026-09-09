import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
  effect,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
import { IconSuggesterComponent } from '../icon-suggester/icon-suggester.component';
import { IconService } from '../../../core/services/icon.service';

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
    IconSuggesterComponent,
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
            {{ isEditing ? 'Edit Goal' : 'Add Goal' }}
          </h2>
          @if (goalService.editingGoal()?.id) {
            <button
              type="button"
              (click)="onDelete()"
              [disabled]="isDeleting() || isSaving()"
              class="w-8 h-8 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 transition-all rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95"
            >
              @if (isDeleting()) {
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              } @else {
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            </button>
          }
        </div>

        <div class="p-6 bg-white flex-1 overflow-y-auto overscroll-none pb-6" style="scrollbar-width: none;">
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
          <form [formGroup]="goalForm" (ngSubmit)="onSubmit()" class="space-y-4 text-left">
            <app-icon-suggester
              themeColor="goals"
              [inputText]="goalForm.get('name')?.value || ''"
              [selectedIconId]="goalForm.get('icon')?.value"
              (iconSelected)="goalForm.patchValue({ icon: $event })"
              (iconCleared)="goalForm.patchValue({ icon: null })"
            ></app-icon-suggester>
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase"
                >Name</label
              >
              <input
                [appAutofocus]="!isEditing"
                appSafeInput
                type="text"
                formControlName="name"
                placeholder="e.g. New Bike, Vacation"
                class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl px-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400" [ngClass]="[theme.focusBorder, theme.focusRing]"
              />
            </div>

            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase"
                  >Total Amount</label
                >
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-gray-400 font-bold text-xl">₹</span>
                  </div>
                  <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    appAmountInput
                    formControlName="total_amount"
                    placeholder="0"
                    (keydown)="preventE($event)"
                    class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl pl-10 pr-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300" [ngClass]="[theme.focusBorder, theme.focusRing]"
                  />
                </div>
              </div>

              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase"
                  >Saved Amount</label
                >
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-gray-400 font-bold text-xl">₹</span>
                  </div>
                  <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    appAmountInput
                    formControlName="saved_amount"
                    placeholder="0"
                    (keydown)="preventE($event)"
                    class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl pl-10 pr-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300" [ngClass]="[theme.focusBorder, theme.focusRing]"
                  />
                </div>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase"
                  >Target Date</label
                >
                <button
                  type="button"
                  (click)="isDatePickerOpen = true"
                  class="active:scale-[0.98] transition-all duration-200 w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl flex justify-between items-center px-4 py-3 outline-none touch-manipulation shadow-sm" [ngClass]="[theme.focusBorder, theme.focusRing]"
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
                <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase"
                  >Installment Day</label
                >
                <button
                  type="button"
                  (click)="isDayPickerOpen = true"
                  class="active:scale-[0.98] transition-all duration-200 w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl flex justify-between items-center px-4 py-3 outline-none shadow-sm touch-manipulation" [ngClass]="[theme.focusBorder, theme.focusRing]"
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
              <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase"
                >Frequency</label
              >
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="goalForm.patchValue({ frequency: 'monthly' })"
                  class="flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wide border-2 rounded-2xl transition-all active:scale-95 shadow-sm touch-manipulation"
                  [ngClass]="
                    goalForm.get('frequency')?.value === 'monthly'
                      ? theme.activeBg
                      : 'bg-white text-slate-600 border-gray-100'
                  "
                >
                  Monthly
                </button>
                <button
                  type="button"
                  (click)="goalForm.patchValue({ frequency: 'alternate' })"
                  class="flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wide border-2 rounded-2xl transition-all active:scale-95 shadow-sm touch-manipulation"
                  [ngClass]="
                    goalForm.get('frequency')?.value === 'alternate'
                      ? theme.activeBg
                      : 'bg-white text-slate-600 border-gray-100'
                  "
                >
                  Alternate
                </button>
                <button
                  type="button"
                  (click)="goalForm.patchValue({ frequency: 'quarterly' })"
                  class="flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wide border-2 rounded-2xl transition-all active:scale-95 shadow-sm touch-manipulation"
                  [ngClass]="
                    goalForm.get('frequency')?.value === 'quarterly'
                      ? theme.activeBg
                      : 'bg-white text-slate-600 border-gray-100'
                  "
                >
                  Quarterly
                </button>
              </div>
            </div>

            <!-- Calculated Preview / Installments Accordion -->
            <div class="bg-goals-surface border border-goals-primary/20 rounded-xl mt-2 shadow-sm overflow-hidden flex flex-col transition-all duration-300">
              <button
                type="button"
                (click)="isEditing ? isInstallmentsOpen.set(!isInstallmentsOpen()) : null"
                class="p-4 flex justify-between items-center gap-4 w-full text-left transition-colors"
                [class.active:bg-black]="isEditing"
                [style.active:bg-opacity]="'0.05'"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-[11px] font-bold text-goals-dark tracking-wider uppercase truncate">
                    Calculated Installment
                  </p>
                  <p class="text-[10px] text-goals-dark/70 font-medium leading-tight mt-0.5 pr-2">
                    Based on remaining amount & time
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <div class="text-lg font-black text-goals-dark whitespace-nowrap shrink-0">
                    ₹{{ previewInstallment | number: '1.0-0' }}
                  </div>
                  @if (isEditing) {
                    <svg
                      class="w-4 h-4 text-goals-dark/50 transition-transform duration-200"
                      [class.rotate-180]="isInstallmentsOpen()"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  }
                </div>
              </button>
              
              @if (isEditing && isInstallmentsOpen()) {
                <div class="border-t border-goals-primary/10 bg-white/50 p-4 flex flex-col gap-3">
                  <h4 class="text-[10px] font-bold text-goals-dark/60 uppercase tracking-wider mb-1">Installments Made ({{ goalInstallments().length }})</h4>
                  @if (goalInstallments().length > 0) {
                    <div class="max-h-40 overflow-y-auto pr-1 flex flex-col gap-2">
                      @for (installment of goalInstallments(); track installment.id) {
                        <div class="flex justify-between items-center text-sm border-b border-goals-primary/5 pb-2 last:border-0 last:pb-0">
                          <div class="flex flex-col">
                            <span class="font-semibold text-slate-800">{{ installment.title }}</span>
                            <span class="text-[11px] text-slate-500">{{ installment.date | date:'MMM d, yyyy' }}</span>
                          </div>
                          <span class="font-bold text-goals-dark">₹{{ installment.amount | number:'1.0-0' }}</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="text-xs text-slate-500 italic">No installments made yet.</p>
                  }
                </div>
              }
            </div>

            <div class="mt-6 flex gap-3">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-slate-100 text-slate-700 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!goalForm.valid || isSaving() || isDeleting()"
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm text-white shadow-md disabled:opacity-50 disabled:active:scale-100" [ngClass]="theme.bg"
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
export class GoalSheetComponent implements OnInit, AfterViewInit {
  theme = { text: 'text-goals-primary', bg: 'bg-goals-primary', border: 'border-goals-primary', focusBorder: 'focus:border-goals-primary', focusRing: 'focus:ring-4 focus:ring-goals-primary/15', shadow: 'shadow-goals-primary/20', activeBg: 'bg-goals-primary text-white border-goals-primary shadow-md shadow-goals-primary/20' };
  
  get isEditing(): boolean {
    return !!this.goalService.editingGoal()?.id;
  }
  
  showLeftFade = signal(false);
  showRightFade = signal(true);
  @ViewChild('scrollCat') scrollCat!: ElementRef;

  goalService = inject(GoalService);
  budgetService = inject(BudgetService);
  expenseService = inject(ExpenseService);
  iconService = inject(IconService);
  confirmService = inject(ConfirmService);
  fb = inject(FormBuilder);
  haptic = inject(HapticService);
  router = inject(Router);

  isSaving = signal(false);
  isDeleting = signal(false);
  isInstallmentsOpen = signal(false);
  goalInstallments = computed(() => {
    const goalId = this.goalService.editingGoal()?.id;
    if (!goalId) return [];
    return this.expenseService.expenses()
      .filter(e => e.goal_id === goalId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });
  isDatePickerOpen = false;
  isDayPickerOpen = false;

  goalForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    total_amount: ['', [Validators.required, Validators.min(1)]],
    saved_amount: ['0', [Validators.required, Validators.min(0)]],
    target_date: ['', Validators.required],
    frequency: ['monthly', Validators.required],
    installment_date: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    icon: [null as string | null],
    created_at: [new Date().toISOString(), Validators.required],
  });

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
        const currentCreatedAt = new Date().toISOString();
        this.goalForm.reset({
          name: '',
          total_amount: '',
          saved_amount: '0',
          target_date: this.getDefaultTargetDate(),
          frequency: 'monthly',
          installment_date: 1,
          icon: null,
          created_at: currentCreatedAt
        });
      }
    });
  }

  ngOnInit() {}
  ngAfterViewInit() {}

  getDefaultTargetDate() {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
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

  close() {
    this.goalForm.reset({
      saved_amount: '0',
      frequency: 'monthly',
      installment_date: 1,
      icon: null,
      created_at: new Date().toISOString()
    });
    this.goalService.closeBottomSheet();
  }

  async onSubmit() {
    if (this.goalForm.invalid) return;
    this.haptic.impactLight();
    this.isSaving.set(true);

    const formValue = this.goalForm.value;
    const editing = this.goalService.editingGoal();

    // Auto-assign icon if not explicitly selected
    const selectedIconId = formValue.icon;
    let assignedIcon = this.iconService.getIconById(selectedIconId || '');
    if (!selectedIconId) {
      assignedIcon = this.iconService.getSuggestedIcons(formValue.name)[0];
      formValue.icon = assignedIcon?.id || null;
    }

    let success = false;
    if (editing?.id) {
      const oldName = editing.name;
      success = await this.goalService.updateGoal(editing.id, {
        name: formValue.name,
        total_amount: Number(formValue.total_amount),
        target_date: formValue.target_date,
        frequency: formValue.frequency,
        installment_date: Number(formValue.installment_date),
        icon: formValue.icon,
        updated_at: new Date().toISOString(),
      });

      // If name changed, update associated transactions
      if (success && oldName !== formValue.name) {
        await this.expenseService.updateExpensesForGoalRename(oldName, formValue.name);
      }
    } else {
      success = await this.goalService.addGoal({
        name: formValue.name,
        total_amount: Number(formValue.total_amount),
        saved_amount: 0,
        target_date: formValue.target_date,
        frequency: formValue.frequency,
        installment_date: Number(formValue.installment_date),
        icon: formValue.icon,
        created_at: new Date().toISOString(),
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
          setTimeout(() => {
            this.router.navigate(['/goals']);
          }, 150);
        }
      },
    });
  }
}
