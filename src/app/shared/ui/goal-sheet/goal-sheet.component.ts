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
            <div class="flex flex-col gap-1.5 relative w-full">
              <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Choose Icon & Preset</label>
              <div 
                #scrollCat 
                (scroll)="updateScrollState($event.target)" 
                class="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 relative z-0 touch-pan-x transition-all duration-300"
                [style.-webkit-mask-image]="getMaskImage()"
                [style.mask-image]="getMaskImage()"
              >
                @for (cat of goalIcons; track cat) {
                  <button
                    type="button"
                    (click)="selectIcon(cat.path)"
                    class="flex items-center gap-2 p-2 px-3 border-2 rounded-full transition-all shrink-0 active:scale-95 snap-center"
                    [ngClass]="
                      goalForm.get('icon')?.value === cat.path
                        ? theme.activeBg
                        : 'bg-white text-slate-600 border-gray-100 shadow-sm'
                    "
                  >
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                      <path [attr.d]="cat.path"></path>
                    </svg>
                    <span class="text-xs font-bold tracking-wide whitespace-nowrap">{{ cat.name }}</span>
                  </button>
                }
              </div>
            </div>
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
    { name: 'Target', path: 'M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7 M14 2.20004C13.3538 2.06886 12.6849 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 11.3151 21.9311 10.6462 21.8 10 M12.0303 11.9625L16.5832 7.4096M19.7404 4.34462L19.1872 2.35748C19.0853 2.03011 18.6914 1.89965 18.4259 2.11662C16.9898 3.29018 15.4254 4.87091 16.703 7.36419C19.2771 8.56455 20.7466 6.94584 21.8733 5.5853C22.0975 5.3146 21.9623 4.90767 21.6247 4.81005L19.7404 4.34462Z' },
    { name: 'Trophy', path: 'M12 12V18 M12 18C10.3264 18 8.86971 19.012 8.11766 20.505C7.75846 21.218 8.27389 22 8.95877 22H15.0412C15.7261 22 16.2415 21.218 15.8823 20.505C15.1303 19.012 13.6736 18 12 18Z M5 5H3.98471C2.99819 5 2.50493 5 2.20017 5.37053C1.89541 5.74106 1.98478 6.15597 2.16352 6.9858C2.50494 8.57086 3.24548 9.9634 4.2489 11 M19 5H20.0153C21.0018 5 21.4951 5 21.7998 5.37053C22.1046 5.74106 22.0152 6.15597 21.8365 6.9858C21.4951 8.57086 20.7545 9.9634 19.7511 11 M12 12C15.866 12 19 8.8831 19 5.03821C19 4.93739 18.9978 4.83707 18.9936 4.73729C18.9509 3.73806 18.9295 3.23845 18.2523 2.61922C17.5751 2 16.8247 2 15.324 2H8.67596C7.17526 2 6.42492 2 5.74772 2.61922C5.07051 3.23844 5.04915 3.73806 5.00642 4.73729C5.00215 4.83707 5 4.93739 5 5.03821C5 8.8831 8.13401 12 12 12Z' },
    { name: 'Vehicle', path: 'M2.5 12L4.5 13 M21.5 12.5L19.5 13 M8 17.5L8.24567 16.8858C8.61101 15.9725 8.79368 15.5158 9.17461 15.2579C9.55553 15 10.0474 15 11.0311 15H12.9689C13.9526 15 14.4445 15 14.8254 15.2579C15.2063 15.5158 15.389 15.9725 15.7543 16.8858L16 17.5 M2 17V19.882C2 20.2607 2.24075 20.607 2.62188 20.7764C2.86918 20.8863 3.10538 21 3.39058 21H5.10942C5.39462 21 5.63082 20.8863 5.87812 20.7764C6.25925 20.607 6.5 20.2607 6.5 19.882V18 M17.5 18V19.882C17.5 20.2607 17.7408 20.607 18.1219 20.7764C18.3692 20.8863 18.6054 21 18.8906 21H20.6094C20.8946 21 21.1308 20.8863 21.3781 20.7764C21.7592 20.607 22 20.2607 22 19.882V17 M20 8.5L21 8 M4 8.5L3 8 M4.5 9L5.5883 5.73509C6.02832 4.41505 6.24832 3.75503 6.7721 3.37752C7.29587 3 7.99159 3 9.38304 3H14.617C16.0084 3 16.7041 3 17.2279 3.37752C17.7517 3.75503 17.9717 4.41505 18.4117 5.73509L19.5 9 M4.5 9H19.5C20.4572 10.0135 22 11.4249 22 12.9996V16.4702C22 17.0407 21.6205 17.5208 21.1168 17.5875L18 18H6L2.88316 17.5875C2.37955 17.5208 2 17.0407 2 16.4702V12.9996C2 11.4249 3.54279 10.0135 4.5 9Z' },
    { name: 'House', path: 'M3 11.9896V14.5C3 17.7998 3 19.4497 4.02513 20.4749C5.05025 21.5 6.70017 21.5 10 21.5H14C17.2998 21.5 18.9497 21.5 19.9749 20.4749C21 19.4497 21 17.7998 21 14.5V11.9896C21 10.3083 21 9.46773 20.6441 8.74005C20.2882 8.01237 19.6247 7.49628 18.2976 6.46411L16.2976 4.90855C14.2331 3.30285 13.2009 2.5 12 2.5C10.7991 2.5 9.76689 3.30285 7.70242 4.90855L5.70241 6.46411C4.37533 7.49628 3.71179 8.01237 3.3559 8.74005C3 9.46773 3 10.3083 3 11.9896Z M15.0002 17C14.2007 17.6224 13.1504 18 12.0002 18C10.8499 18 9.79971 17.6224 9.00018 17' },
    { name: 'Tech', path: 'M20 14.5V6.5C20 4.61438 20 3.67157 19.4142 3.08579C18.8284 2.5 17.8856 2.5 16 2.5H8C6.11438 2.5 5.17157 2.5 4.58579 3.08579C4 3.67157 4 4.61438 4 6.5V14.5 M3.49762 15.5154L4.01953 14.5H19.9518L20.5023 15.5154C21.9452 18.177 22.3046 19.5077 21.7561 20.5039C21.2077 21.5 19.7536 21.5 16.8454 21.5L7.15462 21.5C4.24642 21.5 2.79231 21.5 2.24387 20.5039C1.69543 19.5077 2.05474 18.177 3.49762 15.5154Z M15.5 7L16.4199 7.79289C16.8066 8.12623 17 8.29289 17 8.5C17 8.70711 16.8066 8.87377 16.4199 9.20711L15.5 10 M8.5 7L7.58009 7.79289C7.19337 8.12623 7 8.29289 7 8.5C7 8.70711 7.19336 8.87377 7.58009 9.20711L8.5 10 M13 6L11 11' },
    { name: 'Travel', path: 'M15.8667 3.7804C16.7931 3.03188 17.8307 2.98644 18.9644 3.00233C19.5508 3.01055 19.844 3.01467 20.0792 3.10588C20.4524 3.2506 20.7494 3.54764 20.8941 3.92081C20.9853 4.15601 20.9894 4.4492 20.9977 5.03557C21.0136 6.16926 20.9681 7.20686 20.2196 8.13326C19.5893 8.91337 18.5059 9.32101 17.9846 10.1821C17.5866 10.8395 17.772 11.5203 17.943 12.2209L19.2228 17.4662C19.4779 18.5115 19.2838 19.1815 18.5529 19.9124C18.164 20.3013 17.8405 20.2816 17.5251 19.779L13.6627 13.6249L11.8181 15.0911C11.1493 15.6228 10.8149 15.8886 10.6392 16.2627C10.2276 17.1388 10.4889 18.4547 10.5022 19.4046C10.5096 19.9296 10.0559 20.9644 9.41391 20.9993C9.01756 21.0209 8.88283 20.5468 8.75481 20.2558L7.52234 17.4544C7.2276 16.7845 7.21552 16.7724 6.54556 16.4777L3.74415 15.2452C3.45318 15.1172 2.97914 14.9824 3.00071 14.5861C3.03565 13.9441 4.07036 13.4904 4.59536 13.4978C5.54532 13.5111 6.86122 13.7724 7.73734 13.3608C8.11142 13.1851 8.37724 12.8507 8.90888 12.1819L10.3751 10.3373L4.22103 6.47489C3.71845 6.15946 3.69872 5.83597 4.08755 5.44715C4.8185 4.7162 5.48851 4.52214 6.53377 4.77718L11.7791 6.05703C12.4797 6.22798 13.1605 6.41343 13.8179 6.0154C14.679 5.49411 15.0866 4.41074 15.8667 3.7804Z' },
    { name: 'Education', path: 'M20 22H6C4.89543 22 4 21.1046 4 20M4 20C4 18.8954 4.89543 18 6 18H18C19.1046 18 20 17.1046 20 16V2C20 3.10457 19.1046 4 18 4L10 4C7.17157 4 5.75736 4 4.87868 4.87868C4 5.75736 4 7.17157 4 10V20Z M18.5 18C18.5 18 17.5 18.7628 17.5 20C17.5 21.2372 18.5 22 18.5 22 M9 4V8' },
    { name: 'Shopping', path: 'M10.5 20.25C10.5 20.6642 10.1642 21 9.75 21C9.33579 21 9 20.6642 9 20.25C9 19.8358 9.33579 19.5 9.75 19.5C10.1642 19.5 10.5 19.8358 10.5 20.25Z M19 20.25C19 20.6642 18.6642 21 18.25 21C17.8358 21 17.5 20.6642 17.5 20.25C17.5 19.8358 17.8358 19.5 18.25 19.5C18.6642 19.5 19 19.8358 19 20.25Z M2 3H2.20664C3.53124 3 4.19354 3 4.6255 3.40221C5.05746 3.80441 5.10464 4.46503 5.19902 5.78626L5.45035 9.30496C5.5924 11.2936 5.66342 12.2879 5.96476 13.0961C6.62531 14.8677 8.08229 16.2244 9.89648 16.757C10.7241 17 11.7267 17 13.7317 17C15.8373 17 16.89 17 17.7417 16.7416C19.6593 16.1599 21.1599 14.6593 21.7416 12.7417C22 11.89 22 10.8433 22 8.75C22 8.05222 22 7.70333 21.9139 7.41943C21.72 6.78023 21.2198 6.28002 20.5806 6.08612C20.2967 6 19.9478 6 19.25 6H5.5 M16 10V13M11 10V13' },
    { name: 'Health', path: 'M10.4107 19.9679C7.58942 17.8581 2 13.035 2 8.69463C2 5.82581 4.10526 3.50018 7 3.50018C8.5 3.50018 10 4.00018 12 6.00018C14 4.00018 15.5 3.50018 17 3.50018C19.8947 3.50018 22 5.82581 22 8.69463C22 13.035 16.4106 17.8581 13.5893 19.9679C12.6399 20.6778 11.3601 20.6778 10.4107 19.9679Z' },
    { name: 'Wedding', path: 'M6.959 7.03438L8.04435 5.72804C10.1093 3.24268 11.1417 2 12.5 2C13.8583 2 14.8907 3.24268 16.9556 5.72803L18.041 7.03437C20.0137 9.4087 21 10.5959 21 12C21 13.4041 20.0137 14.5913 18.041 16.9656L16.9557 18.272C14.8907 20.7573 13.8583 22 12.5 22C11.1417 22 10.1093 20.7573 8.04435 18.272L6.95901 16.9656C4.98634 14.5913 4 13.4041 4 12C4 10.5959 4.98633 9.4087 6.959 7.03438Z' },
    { name: 'Vacation', path: 'M16.9991 12C16.9991 14.7614 14.7605 17 11.9991 17C9.23766 17 6.99908 14.7614 6.99908 12C6.99908 9.23858 9.23766 7 11.9991 7C14.7605 7 16.9991 9.23858 16.9991 12Z M12.1247 3.25H11.9997M12.1242 20.75H11.9992M20.75 12.125V12M3.25 12.125V12M18.2752 5.90098L18.1868 5.81259M5.90051 18.275L5.81212 18.1866M18.0987 18.2756L18.187 18.1872M5.72429 5.9012L5.81267 5.81282M12.2497 3.25C12.2497 3.38807 12.1378 3.5 11.9997 3.5C11.8616 3.5 11.7497 3.38807 11.7497 3.25C11.7497 3.11193 11.8616 3 11.9997 3C12.1378 3 12.2497 3.11193 12.2497 3.25ZM12.2492 20.75C12.2492 20.8881 12.1373 21 11.9992 21C11.8611 21 11.7492 20.8881 11.7492 20.75C11.7492 20.6119 11.8611 20.5 11.9992 20.5C12.1373 20.5 12.2492 20.6119 12.2492 20.75ZM20.75 12.25C20.6119 12.25 20.5 12.1381 20.5 12C20.5 11.8619 20.6119 11.75 20.75 11.75C20.8881 11.75 21 11.8619 21 12C21 12.1381 20.8881 12.25 20.75 12.25ZM3.25 12.25C3.11193 12.25 3 12.1381 3 12C3 11.8619 3.11193 11.75 3.25 11.75C3.38807 11.75 3.5 11.8619 3.5 12C3.5 12.1381 3.38807 12.25 3.25 12.25ZM18.3636 5.98937C18.266 6.087 18.1077 6.087 18.01 5.98937C17.9124 5.89174 17.9124 5.73345 18.01 5.63582C18.1077 5.53819 18.266 5.53819 18.3636 5.63582C18.4612 5.73345 18.4612 5.89174 18.3636 5.98937ZM5.9889 18.3634C5.89127 18.461 5.73297 18.461 5.63534 18.3634C5.53771 18.2658 5.53771 18.1075 5.63534 18.0099C5.73297 17.9122 5.89127 17.9122 5.9889 18.0099C6.08653 18.1075 6.08653 18.2658 5.9889 18.3634ZM18.0103 18.364C17.9126 18.2663 17.9126 18.108 18.0103 18.0104C18.1079 17.9128 18.2662 17.9128 18.3638 18.0104C18.4614 18.108 18.4614 18.2663 18.3638 18.364C18.2662 18.4616 18.1079 18.4616 18.0103 18.364ZM5.6359 5.98959C5.53827 5.89196 5.53827 5.73367 5.6359 5.63604C5.73353 5.53841 5.89182 5.53841 5.98945 5.63604C6.08708 5.73367 6.08708 5.89196 5.98945 5.98959C5.89182 6.08722 5.73353 6.08722 5.6359 5.98959Z' }
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
      untracked(() => {
        setTimeout(() => {
          if (this.scrollCat?.nativeElement) {
            this.updateScrollState(this.scrollCat.nativeElement);
          }
        }, 100);
      });
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.scrollCat?.nativeElement) {
        this.updateScrollState(this.scrollCat.nativeElement);
      }
    }, 100);
  }

  getMaskImage(): string {
    const left = this.showLeftFade() ? 'transparent 0%' : 'black 0%';
    const leftTransition = this.showLeftFade() ? 'black 5%' : 'black 0%';
    const rightTransition = this.showRightFade() ? 'black 95%' : 'black 100%';
    const right = this.showRightFade() ? 'transparent 100%' : 'black 100%';
    return `linear-gradient(to right, ${left}, ${leftTransition}, ${rightTransition}, ${right})`;
  }

  updateScrollState(target: any) {
    if (!target) return;
    const { scrollLeft, scrollWidth, clientWidth } = target;
    const isAtStart = scrollLeft <= 0;
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1;
    this.showLeftFade.set(!isAtStart);
    this.showRightFade.set(!isAtEnd);
  }

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
          setTimeout(() => {
            this.router.navigate(['/goals']);
          }, 150);
        }
      },
    });
  }
}
