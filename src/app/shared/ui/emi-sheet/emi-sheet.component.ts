import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
  effect,
  ChangeDetectionStrategy,
  untracked,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { ConfirmService } from '../../../core/services/confirm.service';
import { EmiService, Emi } from '../../../core/services/emi.service';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { SafeInputDirective } from '../safe-input.directive';
import { DayPickerComponent } from '../day-picker/day-picker.component';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { IconSuggesterComponent } from '../icon-suggester/icon-suggester.component';
import { AutofocusDirective } from '../autofocus.directive';

@Component({
  selector: 'app-emi-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SwipeToCloseDirective,
    AmountInputDirective,
    SafeInputDirective,
    DayPickerComponent,
    DatePickerComponent,
    IconSuggesterComponent,
    DatePipe,
    AutofocusDirective
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
    @if (emiService.isBottomSheetOpen()) {
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
        <div class="flex justify-between items-center py-4 px-6 text-white bg-emis-primary rounded-t-[32px] sticky top-0 z-10 shrink-0 shadow-sm">
          <h2 class="text-lg font-bold tracking-wide">
            {{
              emiService.selectedEmi()?.id
                ? 'Edit EMI'
                : 'Add EMI'
            }}
          </h2>
          @if (emiService.selectedEmi()?.id) {
            <button
              type="button"
              (click)="onDelete()"
              [disabled]="isDeleting()"
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

        <div class="p-6 bg-white flex-1 overflow-y-auto scroll-smooth overscroll-none pb-6" style="scrollbar-width: none;">
          @if (emiService.selectedEmi()?.id) {
            <div class="flex justify-center mb-5">
              <span class="text-[10px] font-bold tracking-wide uppercase text-emis-dark bg-emis-surface px-3 py-1 rounded-full border border-emis-primary/10">
                Added on {{ selectedDate() | date: 'mediumDate' }}
              </span>
            </div>
          }
          <form [formGroup]="emiForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">Name</label>
              <input
                appSafeInput
                [appAutofocus]="!emiService.selectedEmi()?.id"
                type="text"
                formControlName="title"
                placeholder="e.g. Home Loan, Car Loan"
                class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl px-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400 focus:border-emis-primary focus:ring-4 focus:ring-emis-primary/15"
              />
            </div>

            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">EMI Amount</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-gray-400 font-bold text-xl">₹</span>
                  </div>
                  <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    appAmountInput
                    formControlName="amount"
                    placeholder="0"
                    (keydown)="preventE($event)"
                    class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl pl-10 pr-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300 focus:border-emis-primary focus:ring-4 focus:ring-emis-primary/15"
                  />
                </div>
              </div>

              <div class="w-32 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">Due Day</label>
                <button
                  type="button"
                  (click)="isDayPickerOpen = true"
                  class="active:scale-[0.98] transition-all duration-200 w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl focus:border-emis-primary focus:ring-4 focus:ring-emis-primary/15 flex justify-between items-center px-4 py-3 outline-none touch-manipulation shadow-sm"
                >
                  <span>{{ emiForm.get('due_day')?.value || 1 }}</span>
                  <svg class="fill-current h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">Total Months</label>
                <input
                  type="number"
                  inputmode="numeric"
                  formControlName="total_months"
                  placeholder="e.g. 36"
                  class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl px-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400 focus:border-emis-primary focus:ring-4 focus:ring-emis-primary/15"
                />
              </div>

              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">Months Paid</label>
                <input
                  type="number"
                  inputmode="numeric"
                  formControlName="months_paid"
                  placeholder="e.g. 5"
                  class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl px-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400 focus:border-emis-primary focus:ring-4 focus:ring-emis-primary/15"
                />
              </div>
            </div>

            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">Start Date</label>
                <button
                  type="button"
                  (click)="openDatePicker('start')"
                  class="active:scale-[0.98] h-[52px] transition-all duration-200 w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-sm rounded-2xl flex justify-between items-center px-3 py-3 outline-none touch-manipulation shadow-sm focus:border-emis-primary focus:ring-4 focus:ring-emis-primary/15"
                >
                  <span [class.text-gray-400]="!emiForm.get('start_date')?.value">
                    {{ emiForm.get('start_date')?.value ? (emiForm.get('start_date')?.value | date: 'mediumDate') : 'Select Date' }}
                  </span>
                  <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </button>
              </div>

              <div class="flex-1 flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">End Date</label>
                <button
                  type="button"
                  (click)="openDatePicker('end')"
                  class="active:scale-[0.98] h-[52px] transition-all duration-200 w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-sm rounded-2xl flex justify-between items-center px-3 py-3 outline-none touch-manipulation shadow-sm focus:border-emis-primary focus:ring-4 focus:ring-emis-primary/15"
                >
                  <span [class.text-gray-400]="!emiForm.get('end_date')?.value">
                    {{ emiForm.get('end_date')?.value ? (emiForm.get('end_date')?.value | date: 'mediumDate') : 'Select Date' }}
                  </span>
                  <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </button>
              </div>
            </div>

            <app-icon-suggester
              themeColor="emis"
              [inputText]="emiForm.get('title')?.value || ''"
              [selectedIconId]="emiForm.get('icon')?.value"
              (iconSelected)="emiForm.patchValue({ icon: $event })"
              (iconCleared)="emiForm.patchValue({ icon: null })"
            ></app-icon-suggester>

            <div class="mt-6 flex gap-3">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-transparent text-slate-500 text-center hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!emiForm.valid || isSaving() || isDeleting()"
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-emis-primary text-white shadow-md shadow-emis-primary/30 disabled:opacity-50 disabled:active:scale-100"
              >
                @if (isSaving()) {
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                }
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <app-day-picker
      [isOpen]="isDayPickerOpen"
      [initialDay]="emiForm.get('due_day')?.value || 1"
      (daySelected)="onDaySelected($event)"
      (closed)="isDayPickerOpen = false"
    ></app-day-picker>

    <!-- Global Date Picker for Form -->
    <app-date-picker
      [isOpen]="isDatePickerOpen"
      [initialDate]="currentPickerDate()"
      (dateSelected)="onDateSelected($event)"
      (closed)="isDatePickerOpen = false"
    >
    </app-date-picker>
  `,
})
export class EmiSheetComponent implements OnInit {
  emiService = inject(EmiService);
  private confirmService = inject(ConfirmService);
  private fb = inject(FormBuilder);

  emiForm!: FormGroup;
  isSaving = signal(false);
  isDeleting = signal(false);
  isDayPickerOpen = false;
  selectedDate = signal(new Date());

  isDatePickerOpen = false;
  activeDateField: 'start' | 'end' | null = null;
  currentPickerDate = signal<string>(new Date().toISOString().split('T')[0]);

  constructor() {
    effect(() => {
      const emi = this.emiService.selectedEmi();
      if (this.emiService.isBottomSheetOpen()) {
        untracked(() => {
          this.initForm(emi);
        });
      }
    });
  }

  ngOnInit() {
    this.initForm(null);
  }

  private initForm(emi: Emi | null) {
    const today = new Date();
    this.selectedDate.set(emi?.created_at ? new Date(emi.created_at) : new Date());

    this.emiForm = this.fb.group({
      title: [emi?.title || '', [Validators.required, Validators.maxLength(50)]],
      amount: [emi?.amount || null, [Validators.required, Validators.min(1)]],
      category: [emi?.category || 'General'],
      icon: [emi?.icon || null],
      due_day: [emi?.due_day || today.getDate(), [Validators.required, Validators.min(1), Validators.max(31)]],
      total_months: [emi?.total_months || null, [Validators.required, Validators.min(1)]],
      months_paid: [emi?.months_paid || 0, [Validators.required, Validators.min(0)]],
      start_date: [emi?.start_date || null, [Validators.required]],
      end_date: [emi?.end_date || null, [Validators.required]],
    });

    this.emiForm.get('months_paid')?.valueChanges.subscribe(() => this.autoCalculateDates());
    this.emiForm.get('total_months')?.valueChanges.subscribe(() => this.autoCalculateDates());
    this.emiForm.get('due_day')?.valueChanges.subscribe(() => this.autoCalculateDates());
  }

  private autoCalculateDates() {
    const paid = this.emiForm.get('months_paid')?.value || 0;
    const total = this.emiForm.get('total_months')?.value || 0;
    const dueDay = this.emiForm.get('due_day')?.value || new Date().getDate();

    if (total > 0) {
      const today = new Date();
      const currentDay = today.getDate();
      
      let startMonthOffset = 0;
      if (paid === 0) {
        // If nothing paid, start is the next upcoming due date
        startMonthOffset = dueDay <= currentDay ? 1 : 0;
      } else {
        // If paid > 0, we count backwards.
        // If the due day has already passed this month, this month is included in "paid".
        startMonthOffset = dueDay <= currentDay ? -(paid - 1) : -paid;
      }

      const startDate = new Date(today.getFullYear(), today.getMonth() + startMonthOffset, dueDay);
      // End date is start date + total months - 1 (since the start month counts as month 1)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + total - 1, dueDay);

      const formatLocalISO = (d: Date) => {
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().split('T')[0];
      };

      this.emiForm.patchValue({
        start_date: formatLocalISO(startDate),
        end_date: formatLocalISO(endDate)
      }, { emitEvent: false });
    }
  }

  onDaySelected(day: number) {
    this.emiForm.patchValue({ due_day: day });
  }

  openDatePicker(field: 'start' | 'end') {
    this.activeDateField = field;
    const existingDateStr = this.emiForm.get(field === 'start' ? 'start_date' : 'end_date')?.value;
    const initial = existingDateStr || new Date().toISOString().split('T')[0];
    this.currentPickerDate.set(initial);
    this.isDatePickerOpen = true;
  }

  onDateSelected(dateStr: string) {
    if (this.activeDateField === 'start') {
      this.emiForm.patchValue({ start_date: dateStr });
    } else if (this.activeDateField === 'end') {
      this.emiForm.patchValue({ end_date: dateStr });
    }
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  close() {
    this.emiService.closeBottomSheet();
    setTimeout(() => {
      this.emiForm.reset({ due_day: new Date().getDate(), months_paid: 0 });
    }, 300);
  }

  async onSubmit() {
    if (this.emiForm.valid && !this.isSaving()) {
      this.isSaving.set(true);
      try {
        const formValue = this.emiForm.value;
        const currentEmi = this.emiService.selectedEmi();

        if (currentEmi?.id) {
          await this.emiService.updateEmi(currentEmi.id, formValue);
        } else {
          await this.emiService.addEmi(formValue);
        }
      } finally {
        this.isSaving.set(false);
      }
    }
  }

  onDelete() {
    const emi = this.emiService.selectedEmi();
    if (!emi?.id) return;

    this.confirmService.open({
      title: 'Delete EMI',
      message: 'Are you sure you want to delete this EMI? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        this.isDeleting.set(true);
        try {
          await this.emiService.deleteEmi(emi.id);
        } finally {
          this.isDeleting.set(false);
        }
      },
    });
  }
}
