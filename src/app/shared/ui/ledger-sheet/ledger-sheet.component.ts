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
import { ConfirmService } from '../../../core/services/confirm.service';
import { LedgerService, LedgerEntry } from '../../../core/services/ledger.service';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';
import { SafeInputDirective } from '../safe-input.directive';

@Component({
  selector: 'app-ledger-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SwipeToCloseDirective,
    AmountInputDirective,
    AutofocusDirective,
    SafeInputDirective,
    DatePickerComponent,
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
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (ledgerService.isBottomSheetOpen()) {
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
        class="fixed bottom-0 left-0 right-0 bg-white z-[70] max-h-[95vh] overflow-y-auto overscroll-none flex flex-col rounded-t-3xl shadow-2xl border-t border-gray-100"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center py-4 px-6 bg-ledger-primary text-white rounded-t-3xl sticky top-0 z-10 shadow-sm"
        >
          <h2 class="text-lg font-bold tracking-wide">
            {{ ledgerService.editingEntry()?.id ? 'Edit Record' : 'New Record' }}
          </h2>
          <div class="flex gap-2">
            @if (ledgerService.editingEntry()?.id) {
              <button
                type="button"
                (click)="onDelete()"
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
          @if (ledgerService.editingEntry()?.id) {
            <div class="flex justify-center mb-5">
              <span
                class="text-[10px] font-bold tracking-wide uppercase text-ledger-dark bg-ledger-surface px-3 py-1 rounded-full border border-ledger-primary/10"
              >
                @if (isUpdated()) {
                  Updated
                  {{
                    $safeNavigationMigration(ledgerService.editingEntry()?.updated_at)
                      | date: 'medium'
                  }}
                } @else {
                  Added
                  {{
                    $safeNavigationMigration(ledgerService.editingEntry()?.created_at)
                      | date: 'medium'
                  }}
                }
              </span>
            </div>
          }

          <form [formGroup]="ledgerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Type Toggle -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >Did you give or receive?</label
              >
              <div class="flex gap-2">
                <button
                  type="button"
                  (click)="setType('in')"
                  class="flex-1 font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3 text-xs min-h-[48px] border shadow-sm"
                  [ngClass]="
                    ledgerForm.get('type')?.value === 'in'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  "
                >
                  I Received Money
                </button>
                <button
                  type="button"
                  (click)="setType('out')"
                  class="flex-1 font-bold uppercase tracking-wide rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3 text-xs min-h-[48px] border shadow-sm"
                  [ngClass]="
                    ledgerForm.get('type')?.value === 'out'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  "
                >
                  I Gave Money
                </button>
              </div>
            </div>

            <!-- Person Name -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >Who?</label
              >
              <input
                [appAutofocus]="!ledgerService.editingEntry()?.id"
                appSafeInput
                type="text"
                formControlName="person_name"
                placeholder="e.g. Papa, Rahul, Mom"
                class="w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold text-sm rounded-xl focus:bg-white focus:border-ledger-primary focus:ring-4 focus:ring-ledger-primary/15 block p-3 outline-none transition-all placeholder-gray-400 min-h-[48px] touch-manipulation shadow-sm"
              />
            </div>

            <!-- Amount -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >How much?</label
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
                  formControlName="amount"
                  placeholder="0"
                  (keydown)="preventE($event)"
                  class="w-full bg-gray-50 border border-gray-200 text-gray-900 font-bold text-base rounded-xl focus:bg-white focus:border-ledger-primary focus:ring-4 focus:ring-ledger-primary/15 block p-3 outline-none transition-all placeholder-gray-400 min-h-[48px] touch-manipulation pl-8 shadow-sm"
                />
              </div>
            </div>

            <!-- Purpose -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >What's this for?</label
              >
              <input
                appSafeInput
                type="text"
                formControlName="purpose"
                placeholder="e.g. Loan for car repair, rent money"
                class="w-full bg-gray-50 border border-gray-200 text-gray-900 font-semibold text-sm rounded-xl focus:bg-white focus:border-ledger-primary focus:ring-4 focus:ring-ledger-primary/15 block p-3 outline-none transition-all placeholder-gray-400 min-h-[48px] touch-manipulation shadow-sm"
              />
            </div>

            <!-- Date -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >Date</label
              >
              <button
                type="button"
                (click)="isDatePickerOpen = true"
                class="w-full bg-gray-50 border border-gray-200 text-gray-900 font-semibold text-sm rounded-xl focus:bg-white focus:border-ledger-primary focus:ring-4 focus:ring-ledger-primary/15 flex justify-between items-center p-3 outline-none transition-all min-h-[48px] touch-manipulation shadow-sm"
              >
                <span>{{
                  $safeNavigationMigration(ledgerForm.get('date')?.value) | date: 'MMM d, y, h:mm a'
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
                [disabled]="!ledgerForm.valid || isSaving() || isDeleting()"
                class="flex-1 font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3.5 text-sm min-h-[48px] bg-ledger-primary hover:bg-ledger-dark text-white shadow-lg shadow-ledger-primary/30 disabled:opacity-50 disabled:active:scale-100"
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
                <span>{{
                  isSaving() ? 'Saving...' : ledgerService.editingEntry()?.id ? 'Update' : 'Save'
                }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Global Date Picker for Form -->
    <app-date-picker
      [isOpen]="isDatePickerOpen"
      [initialDate]="$safeNavigationMigration(ledgerForm.get('date')?.value)"
      (dateSelected)="onDateSelected($event)"
      (closed)="isDatePickerOpen = false"
    ></app-date-picker>
  `,
})
export class LedgerSheetComponent implements OnInit {
  ledgerService = inject(LedgerService);
  confirmService = inject(ConfirmService);
  fb = inject(FormBuilder);
  haptic = inject(HapticService);

  isSaving = signal(false);
  isDeleting = signal(false);
  isDatePickerOpen = false;

  ledgerForm: FormGroup = this.fb.group({
    person_name: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(1)]],
    type: ['in', Validators.required],
    purpose: [''],
    date: [new Date().toISOString(), Validators.required],
  });

  constructor() {
    effect(() => {
      const editing = this.ledgerService.editingEntry();
      if (editing) {
        this.ledgerForm.patchValue({
          person_name: editing.person_name,
          amount: editing.amount.toString(),
          type: editing.type,
          purpose: editing.purpose || '',
          date: editing.date || new Date().toISOString(),
        });
      } else {
        const currentCreatedAt = this.ledgerForm?.get('date')?.value || new Date().toISOString();
        this.ledgerForm.reset({ type: 'in', purpose: '', date: currentCreatedAt });
      }
    });
  }

  ngOnInit() {}

  isUpdated(): boolean {
    const entry = this.ledgerService.editingEntry();
    if (!entry || !entry.created_at || !entry.updated_at) return false;
    const diff = Math.abs(
      new Date(entry.updated_at).getTime() - new Date(entry.created_at).getTime(),
    );
    return diff > 5000;
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  setType(type: 'in' | 'out') {
    this.haptic.impactLight();
    this.ledgerForm.patchValue({ type });
  }

  onDateSelected(date: string) {
    this.ledgerForm.patchValue({ date });
    this.isDatePickerOpen = false;
  }

  close() {
    this.ledgerForm.reset({ type: 'in', purpose: '', date: new Date().toISOString() });
    this.ledgerService.closeBottomSheet();
  }

  async onSubmit() {
    if (this.ledgerForm.invalid) return;
    this.haptic.impactLight();
    this.isSaving.set(true);

    const val = this.ledgerForm.value;
    const editing = this.ledgerService.editingEntry();

    let success = false;
    if (editing?.id) {
      success = await this.ledgerService.updateEntry(editing.id, {
        person_name: val.person_name,
        amount: Number(val.amount),
        type: val.type,
        purpose: val.purpose || '',
        date: val.date,
      });
    } else {
      success = await this.ledgerService.addEntry({
        person_name: val.person_name,
        amount: Number(val.amount),
        type: val.type,
        purpose: val.purpose || '',
        date: val.date,
      });
    }

    this.isSaving.set(false);
    if (success) {
      this.close();
    }
  }

  async onDelete() {
    const editing = this.ledgerService.editingEntry();
    if (!editing?.id) return;

    this.confirmService.open({
      title: 'Delete Record',
      message: 'This will permanently remove this record and all its payments. Continue?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        this.isDeleting.set(true);
        const success = await this.ledgerService.deleteEntry(editing.id);
        this.isDeleting.set(false);
        if (success) {
          this.close();
        }
      },
    });
  }
}
