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
import { LedgerService, LedgerSubTransaction } from '../../../core/services/ledger.service';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';

@Component({
  selector: 'app-ledger-sub-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SwipeToCloseDirective,
    AmountInputDirective,
    AutofocusDirective,
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
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    @if (ledgerService.isSubBottomSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="active:scale-[0.98] transition-all duration-200 fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        appSwipeToClose
        (swipeClose)="close()"
        @slideUp
        class="fixed bottom-0 left-0 right-0 z-[90] max-h-[95vh] flex flex-col rounded-t-[32px] shadow-2xl bg-white overflow-hidden"
        style="padding-bottom: env(safe-area-inset-bottom);"
      >
        <!-- Header -->
        <div class="flex justify-between items-center py-4 px-6 text-white bg-ledger-primary rounded-t-[32px] sticky top-0 z-10 shrink-0 shadow-sm">
          <h2 class="text-lg font-bold tracking-wide">
            @if (ledgerService.editingSubEntry()?.id) {
              Edit Payment
            } @else if (ledgerService.settlementData()) {
              Settle Balance
            } @else {
              New Payment
            }
          </h2>
          @if (ledgerService.editingSubEntry()?.id) {
            <button
              type="button"
              (click)="onDelete()"
              [disabled]="isDeleting() || isSaving()"
              class="w-8 h-8 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 transition-all rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95"
            >
              @if (!isDeleting()) {
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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


        <div class="p-6 bg-white flex-1 overflow-y-auto overscroll-none pb-6" style="scrollbar-width: none;">
          @if (ledgerService.editingSubEntry()?.id) {
            <div class="flex justify-center mb-5">
              <span
                class="text-[10px] font-bold tracking-wide uppercase text-ledger-dark bg-ledger-surface px-3 py-1 rounded-full border border-ledger-primary/10"
              >
                @if (isUpdated()) {
                  Updated
                  {{
                    $safeNavigationMigration(ledgerService.editingSubEntry()?.updated_at)
                      | date: 'medium'
                  }}
                } @else {
                  Added
                  {{
                    $safeNavigationMigration(ledgerService.editingSubEntry()?.created_at)
                      | date: 'medium'
                  }}
                }
              </span>
            </div>
          }

          <form [formGroup]="subForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Contextual Info -->
            <div class="bg-ledger-surface p-4 border border-ledger-primary/20 mb-2 rounded-xl shadow-sm">
              <p class="text-[11px] text-ledger-dark font-bold tracking-wider uppercase">
                For {{ ledgerService.activeLedgerForSub()?.person_name }}
              </p>
              <p class="text-xs text-gray-900 mt-1 font-bold">
                Net balance:
                <span
                  class="font-black"
                  [class.text-emerald-600]="
                    ledgerService.getLedgerBalance(ledgerService.activeLedgerForSub()!) > 0
                  "
                  [class.text-rose-600]="
                    ledgerService.getLedgerBalance(ledgerService.activeLedgerForSub()!) < 0
                  "
                  [class.text-gray-900]="
                    ledgerService.getLedgerBalance(ledgerService.activeLedgerForSub()!) === 0
                  "
                >
                  ₹{{
                    ledgerService.getLedgerBalance(ledgerService.activeLedgerForSub()!)
                      | number: '1.0-0'
                  }}
                </span>
              </p>
            </div>

            <!-- Type Toggle -->
            @if (!ledgerService.settlementData()) {
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Is this money in or out?</label
                >
                <div class="flex gap-2">
                  <button
                    type="button"
                    (click)="setType('in')"
                    class="flex-1 font-bold uppercase tracking-wide rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3 text-xs border-2 shadow-sm"
                    [ngClass]="
                      subForm.get('type')?.value === 'in'
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25'
                        : 'bg-white text-slate-600 border-gray-100'
                    "
                  >
                    I Received Money
                  </button>
                  <button
                    type="button"
                    (click)="setType('out')"
                    class="flex-1 font-bold uppercase tracking-wide rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3 text-xs border-2 shadow-sm"
                    [ngClass]="
                      subForm.get('type')?.value === 'out'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25'
                        : 'bg-white text-slate-600 border-gray-100'
                    "
                  >
                    I Gave Money
                  </button>
                </div>
              </div>
            }

            <!-- Amount -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >How much?</label
              >
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span class="text-gray-400 font-bold text-xl">₹</span>
                </div>
                <input
                  [appAutofocus]="!ledgerService.editingSubEntry()?.id"
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  appAmountInput
                  formControlName="amount"
                  placeholder="0"
                  (keydown)="preventE($event)"
                  class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl pl-10 pr-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300 focus:border-ledger-primary focus:ring-4 focus:ring-ledger-primary/15"
                />
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
                class="active:scale-[0.98] transition-all duration-200 w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl focus:border-ledger-primary focus:ring-4 focus:ring-ledger-primary/15 flex justify-between items-center px-4 py-3 outline-none touch-manipulation shadow-sm"
              >
                <span>{{
                  $safeNavigationMigration(subForm.get('date')?.value) | date: 'MMM d, y, h:mm a'
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
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-slate-100 text-slate-700 text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!subForm.valid || isSaving() || isDeleting()"
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-ledger-primary text-white shadow-md shadow-ledger-primary/30 disabled:opacity-50 disabled:active:scale-100"
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
                  isSaving() ? 'Saving...' : ledgerService.editingSubEntry()?.id ? 'Update' : 'Save'
                }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <app-date-picker
      [isOpen]="isDatePickerOpen"
      [initialDate]="$safeNavigationMigration(subForm.get('date')?.value)"
      (dateSelected)="onDateSelected($event)"
      (closed)="isDatePickerOpen = false"
    ></app-date-picker>
  `,
})
export class LedgerSubSheetComponent implements OnInit {
  ledgerService = inject(LedgerService);
  confirmService = inject(ConfirmService);
  fb = inject(FormBuilder);
  haptic = inject(HapticService);

  isSaving = signal(false);
  isDeleting = signal(false);
  isDatePickerOpen = false;

  subForm: FormGroup = this.fb.group({
    amount: ['', [Validators.required, Validators.min(1)]],
    type: ['in', Validators.required],
    purpose: [''],
    date: [new Date().toISOString(), Validators.required],
  });

  constructor() {
    effect(() => {
      const editing = this.ledgerService.editingSubEntry();
      const settlement = this.ledgerService.settlementData();
      
      if (editing) {
        this.subForm.patchValue({
          amount: editing.amount.toString(),
          type: editing.type,
          purpose: editing.purpose || '',
          date: editing.date || new Date().toISOString(),
        });
      } else if (settlement) {
        this.subForm.patchValue({
          amount: settlement.amount.toString(),
          type: settlement.type,
          purpose: 'Settled',
          date: new Date().toISOString(),
        });
      } else {
        const currentCreatedAt = this.subForm?.get('date')?.value || new Date().toISOString();
        this.subForm.reset({ type: 'in', purpose: '', date: currentCreatedAt });
      }
    });
  }

  ngOnInit() {}

  isUpdated(): boolean {
    const sub = this.ledgerService.editingSubEntry();
    if (!sub || !sub.created_at || !sub.updated_at) return false;
    const diff = Math.abs(new Date(sub.updated_at).getTime() - new Date(sub.created_at).getTime());
    return diff > 5000;
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  setType(type: 'in' | 'out') {
    this.haptic.impactLight();
    this.subForm.patchValue({ type });
  }

  onDateSelected(date: string) {
    this.subForm.patchValue({ date });
    this.isDatePickerOpen = false;
  }

  close() {
    this.subForm.reset({ type: 'in', purpose: '', date: new Date().toISOString() });
    this.ledgerService.closeSubBottomSheet();
  }

  async onSubmit() {
    if (this.subForm.invalid) return;
    this.haptic.impactLight();
    this.isSaving.set(true);

    const val = this.subForm.value;
    const parent = this.ledgerService.activeLedgerForSub();
    const editing = this.ledgerService.editingSubEntry();

    if (!parent) {
      this.isSaving.set(false);
      return;
    }

    let success = false;
    if (editing?.id) {
      success = await this.ledgerService.updateSubEntry(editing.id, {
        amount: Number(val.amount),
        type: val.type,
        purpose: val.purpose || '',
        date: val.date,
      });
    } else {
      success = await this.ledgerService.addSubEntry({
        ledger_id: parent.id,
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
    const editing = this.ledgerService.editingSubEntry();
    if (!editing?.id) return;

    this.confirmService.open({
      title: 'Delete Payment',
      message: 'This payment will be permanently removed. Continue?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        this.isDeleting.set(true);
        const success = await this.ledgerService.deleteSubEntry(editing.id);
        this.isDeleting.set(false);
        if (success) {
          this.close();
        }
      },
    });
  }
}
