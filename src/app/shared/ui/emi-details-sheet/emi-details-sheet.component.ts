import {
  Component,
  inject,
  ChangeDetectionStrategy,
  computed,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { EmiService, Emi } from '../../../core/services/emi.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { IconService } from '../../../core/services/icon.service';
import { FormsModule } from '@angular/forms';
import { AmountInputDirective } from '../amount-input.directive';

@Component({
  selector: 'app-emi-details-sheet',
  standalone: true,
  imports: [CommonModule, SwipeToCloseDirective, FormsModule, AmountInputDirective, DatePipe],
  changeDetection: ChangeDetectionStrategy.Default,
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
  template: `
    @if (emiService.isDetailsSheetOpen()) {
      <div
        @fadeIn
        (click)="close()"
        class="active:scale-[0.98] transition-all duration-200 fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>

      <div
        @slideUp
        appSwipeToClose
        (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 z-[70] max-h-[95vh] flex flex-col rounded-t-[32px] shadow-2xl bg-slate-50 overflow-hidden"
        style="padding-bottom: env(safe-area-inset-bottom);"
      >
        <div class="flex justify-between items-center py-4 px-6 text-white bg-emis-primary rounded-t-[32px] sticky top-0 z-10 shrink-0 shadow-sm">
          <h2 class="text-lg font-bold tracking-wide">EMI Details</h2>
          <button
            type="button"
            (click)="editEmi()"
            class="px-3 py-1.5 text-sm font-bold bg-white/20 hover:bg-white/30 rounded-xl transition-all active:scale-95"
          >
            Edit
          </button>
        </div>

        <div class="p-5 flex-1 overflow-y-auto scroll-smooth overscroll-none pb-8">
          @if (emi()) {
            <div class="flex flex-col gap-4">
              <!-- Top Card -->
              <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-2xl bg-emis-surface text-emis-primary flex items-center justify-center shrink-0 border border-emis-primary/10">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path [attr.d]="emi()?.icon ? iconService.getIconById(emi()!.icon!).svg : iconService.DEFAULT_ICON.svg"></path>
                    </svg>
                  </div>
                  <div class="flex-1 flex flex-col min-w-0">
                    <span class="text-xl font-extrabold text-gray-900 truncate tracking-tight">{{ emi()?.title }}</span>
                    <span class="text-sm font-bold text-emis-primary uppercase tracking-wider mt-0.5">{{ emi()?.category }}</span>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-1">
                  <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1">
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base Amount</span>
                    <span class="text-lg font-extrabold text-gray-900">₹{{ emi()?.amount | number: '1.0-0' }}</span>
                  </div>
                  <div class="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-1">
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Due Day</span>
                    <span class="text-lg font-extrabold text-gray-900">{{ emi()?.due_day }}{{ getOrdinalSuffix(emi()!.due_day) }} of month</span>
                  </div>
                </div>

                @if (emi()?.start_date || emi()?.end_date) {
                  <div class="flex justify-between items-center px-2 py-1 mt-1 border-t border-slate-100 pt-3">
                    <span class="text-xs font-bold text-gray-500">
                      {{ emi()?.start_date | date: 'mediumDate' }} 
                      @if (emi()?.end_date) {
                        - {{ emi()?.end_date | date: 'mediumDate' }}
                      }
                    </span>
                  </div>
                }
              </div>

              <!-- Progress & Totals -->
              <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
                <h3 class="text-sm font-bold text-gray-900">Progress</h3>
                
                <div class="w-full flex flex-col gap-2">
                  <div class="flex justify-between items-center text-xs font-bold text-gray-500">
                    <span>{{ emi()?.months_paid }} Months Paid</span>
                    <span>{{ emi()?.total_months }} Total</span>
                  </div>
                  <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-emis-primary rounded-full transition-all duration-500 ease-out" [style.width.%]="((emi()!.months_paid / emi()!.total_months) * 100)"></div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 mt-1">
                  <div class="flex flex-col gap-1">
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Expected Total</span>
                    <span class="text-base font-extrabold text-gray-900">₹{{ (emi()!.amount * emi()!.total_months) | number: '1.0-0' }}</span>
                  </div>
                  <div class="flex flex-col gap-1 items-end">
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Actual Paid</span>
                    <span class="text-base font-extrabold text-emis-primary">₹{{ actualTotalPaid() | number: '1.0-0' }}</span>
                  </div>
                </div>
              </div>

              <!-- Transactions -->
              <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3">
                <h3 class="text-sm font-bold text-gray-900 mb-1">Transaction History</h3>
                
                @if (!emi()?.transactions?.length) {
                  <div class="py-6 flex flex-col items-center justify-center gap-2 opacity-50">
                    <svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span class="text-xs font-bold text-slate-500">No transactions recorded</span>
                  </div>
                } @else {
                  <div class="flex flex-col gap-3">
                    @for (txn of emi()!.transactions; track txn.id) {
                      <div class="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div class="flex flex-col gap-0.5">
                          <span class="text-sm font-extrabold text-gray-900">{{ txn.month }}</span>
                          <span class="text-[10px] font-bold text-gray-500">{{ txn.paid_at | date:'short' }}</span>
                        </div>
                        <span class="text-base font-bold text-emerald-600">₹{{ txn.amount | number: '1.0-0' }}</span>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- Mark as Paid Section -->
              @if (emi()!.months_paid < emi()!.total_months && emi()!.last_paid_month !== currentMonthStr()) {
                <div class="bg-emis-surface border border-emis-primary/20 p-5 rounded-3xl mt-2 flex flex-col gap-4">
                  <h3 class="text-sm font-bold text-emis-primary">Pay Installment for {{ currentMonthStr() }}</h3>
                  
                  <div class="flex flex-col gap-2">
                    <label class="text-[11px] font-bold text-emis-primary/70 uppercase tracking-widest">Actual Amount Charged</label>
                    <div class="relative group">
                      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span class="text-emis-primary/50 font-bold text-xl">₹</span>
                      </div>
                      <input
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        appAmountInput
                        [(ngModel)]="payAmount"
                        placeholder="0"
                        class="w-full bg-white border-2 border-emis-primary/20 text-slate-900 font-bold text-xl rounded-2xl pl-10 pr-4 py-3 outline-none transition-all shadow-sm focus:border-emis-primary focus:ring-4 focus:ring-emis-primary/15"
                      />
                    </div>
                  </div>

                  <button 
                    (click)="markAsPaid()"
                    [disabled]="isPaying() || !payAmount"
                    class="w-full bg-emis-primary text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-emis-primary/30 active:scale-95 transition-transform disabled:opacity-50 mt-2 flex justify-center items-center gap-2"
                  >
                    @if (isPaying()) {
                      <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    }
                    Mark as Paid
                  </button>
                </div>
              } @else if (emi()!.last_paid_month === currentMonthStr() && emi()!.months_paid < emi()!.total_months) {
                <div class="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl mt-2 flex items-center justify-center gap-2 text-emerald-700">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-sm font-bold">Paid for this month</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    }
  `
})
export class EmiDetailsSheetComponent {
  emiService = inject(EmiService);
  private confirmService = inject(ConfirmService);
  iconService = inject(IconService);

  emi = this.emiService.selectedEmi;
  currentMonthStr = this.emiService.currentMonthStr;
  
  isPaying = signal(false);
  payAmount = '';

  constructor() {
    effect(() => {
      const e = this.emi();
      const isOpen = this.emiService.isDetailsSheetOpen();
      untracked(() => {
        if (isOpen && e) {
          this.payAmount = e.amount?.toString() || '';
        }
      });
    });
  }

  readonly actualTotalPaid = computed(() => {
    const e = this.emi();
    if (!e || !e.transactions) return 0;
    return e.transactions.reduce((sum, txn) => sum + Number(txn.amount || 0), 0);
  });

  getOrdinalSuffix(i: number): string {
    const j = i % 10, k = i % 100;
    if (j == 1 && k != 11) return "st";
    if (j == 2 && k != 12) return "nd";
    if (j == 3 && k != 13) return "rd";
    return "th";
  }

  close() {
    this.emiService.closeDetailsSheet();
    setTimeout(() => {
      this.payAmount = '';
    }, 300);
  }

  editEmi() {
    const e = this.emi();
    this.emiService.closeDetailsSheet();
    if (e) {
      setTimeout(() => {
        this.emiService.openBottomSheet(e);
      }, 350);
    }
  }

  async markAsPaid() {
    const e = this.emi();
    if (!e) return;
    
    const amount = Number(this.payAmount.replace(/,/g, ''));
    if (!amount || isNaN(amount)) return;

    this.confirmService.open({
      title: 'Confirm Payment',
      message: 'Record payment of ₹' + amount + ' for ' + this.currentMonthStr() + '?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: async () => {
        this.isPaying.set(true);
        try {
          await this.emiService.markAsPaid(e.id, amount, this.currentMonthStr());
        } finally {
          this.isPaying.set(false);
        }
      }
    });
  }
}
