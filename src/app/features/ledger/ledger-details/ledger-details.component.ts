import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LedgerService,
  LedgerEntry,
  LedgerSubTransaction,
} from '../../../core/services/ledger.service';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-ledger-details',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full bg-slate-50',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="flex flex-col h-full relative bg-white">
      @if (ledgerService.isLoading()) {
        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-4 py-6 pb-28">
          <div class="flex flex-col gap-3">
            <div class="w-full bg-slate-50 rounded-3xl h-48 animate-pulse border border-slate-100 mb-4"></div>
            @for (i of [1, 2, 3]; track i) {
              <div class="w-full bg-slate-50 rounded-3xl h-20 animate-pulse border border-slate-100"></div>
            }
          </div>
        </div>
      } @else {
        @if (ledger()) {
          <!-- Fixed Top Area -->
          <div class="px-4 pt-6 pb-2 shrink-0 bg-white z-10">
            <!-- Settled Banner -->
            @if (ledgerBalance() === 0) {
              <div class="mb-5 bg-[#ECFDF5] border border-[#D1FAE5] rounded-3xl p-4 flex items-center gap-4 shadow-sm">
                <div class="w-12 h-12 bg-white border border-[#A7F3D0] text-emerald-600 flex items-center justify-center rounded-full shrink-0 shadow-sm">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-extrabold text-gray-900 tracking-tight">
                    All Settled
                  </p>
                  <p class="text-[11px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest">
                    No outstanding balance
                  </p>
                </div>
              </div>
            }

            <!-- Summary Card -->
            <div 
              class="mb-2 p-5 rounded-3xl relative overflow-hidden shadow-sm flex flex-col"
              [ngClass]="{
                'bg-[#EFF6FF]': ledgerBalance() > 0,
                'bg-[#FFF0F4]': ledgerBalance() < 0,
                'bg-slate-50 border border-slate-100': ledgerBalance() === 0
              }"
            >
              <div class="relative z-10 w-full flex flex-col">
                <!-- Top Row: Status badge & Settle Button -->
                <div class="flex justify-between items-center w-full mb-3">
                  <div class="flex items-center gap-1.5">
                    <div class="w-2 h-2 rounded-full" 
                      [ngClass]="{
                        'bg-emerald-400': ledgerBalance() > 0,
                        'bg-rose-400': ledgerBalance() < 0,
                        'bg-gray-400': ledgerBalance() === 0
                      }"
                    ></div>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                      @if (ledgerBalance() > 0) {
                        They owe you
                      } @else if (ledgerBalance() < 0) {
                        You owe
                      } @else {
                        Fully settled
                      }
                    </span>
                  </div>
                  
                  @if (ledgerBalance() !== 0) {
                    <button
                      (click)="settleBalance(ledgerBalance() < 0 ? 'out' : 'in')"
                      class="bg-white text-gray-900 shadow-sm border border-slate-200/50 rounded-full px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span class="text-[11px] font-extrabold uppercase tracking-widest">Settle</span>
                    </button>
                  }
                </div>

                <!-- Balance -->
                <div class="flex flex-col mb-4 min-w-0 w-full">
                  <span class="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 truncate w-full">
                    Remaining Balance
                  </span>
                  <span class="text-[36px] font-extrabold tracking-tight leading-none truncate w-full"
                        [class.text-emerald-500]="ledgerBalance() > 0"
                        [class.text-gray-900]="ledgerBalance() <= 0">
                    ₹{{ (ledgerBalance() < 0 ? -ledgerBalance() : ledgerBalance()) | number: '1.0-0' }}
                  </span>
                </div>

                @if (ledger()?.purpose) {
                  <div class="w-full h-px border-dashed border-t border-slate-200/60 mb-4"></div>
                  <!-- Footer info -->
                  <div class="flex flex-col gap-1 w-full text-left">
                    <span class="text-[13px] font-bold text-gray-700 tracking-wide line-clamp-2 italic">
                      "{{ ledger()?.purpose }}"
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Scrollable List Area -->
          <div class="flex-1 overflow-y-auto px-4 pb-28 pt-2 no-scrollbar">
            <!-- Payment History -->
            <div class="flex flex-col gap-3">
              <h3 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-1">
                Payment History
              </h3>

              @if (transactions().length > 0) {
                @for (tx of transactions(); track tx.id) {
                  <div
                    (click)="editTransaction(tx)"
                    role="button"
                    tabindex="0"
                    class="w-full bg-white rounded-3xl p-4 flex items-center justify-between gap-4 text-left shadow-sm active:scale-[0.99] transition-all border border-slate-100"
                  >
                    <div class="flex items-center gap-3.5 min-w-0">
                      <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                           [ngClass]="tx.type === 'in' ? 'bg-[#EFF6FF]' : 'bg-[#FFF0F4]'">
                        @if (tx.type === 'in') {
                          <svg class="w-5 h-5 text-ledger-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        } @else {
                          <svg class="w-5 h-5 text-[#E11D48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        }
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="font-extrabold text-[15px] text-gray-900 truncate">{{ tx.purpose || (tx.type === 'in' ? 'Received' : 'Given') }}</span>
                        <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                          {{ tx.date | date: 'MMM d, h:mm a' }}
                        </span>
                      </div>
                    </div>

                    <div class="flex flex-col items-end shrink-0 pl-3 max-w-[45%] min-w-0">
                      <span
                        class="font-extrabold text-[17px] tracking-tight leading-none truncate w-full text-right"
                        [class.text-emerald-600]="tx.type === 'in'"
                        [class.text-red-600]="tx.type === 'out'"
                      >
                        {{ tx.type === 'in' ? '+' : '-' }}₹{{ tx.amount | number: '1.0-0' }}
                      </span>
                    </div>
                  </div>
                }
              } @else {
                  <div class="mt-2 w-full bg-[#FCFCFD] border border-solid border-slate-100 shadow-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                    <div class="w-14 h-14 bg-[#EFF6FF] rounded-full flex items-center justify-center mb-4 border border-[#DBEAFE]">
                      <svg class="w-6 h-6 text-ledger-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h4 class="text-[15px] font-extrabold text-gray-900 mb-1">No payments yet</h4>
                    <p class="text-[13px] text-gray-500 font-medium max-w-[200px]">
                      Tap the settle button above to add your first payment.
                    </p>
                  </div>
              }
            </div>
          </div>
        } @else {
          <div class="flex-1 overflow-y-auto px-4 py-6 pb-28">
            <div class="flex flex-col items-center justify-center py-12 text-center h-[400px]">
              <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                <svg class="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p class="text-gray-900 font-extrabold text-[15px] mb-2">
                Record not found
              </p>
              <button
                (click)="goBack()"
                class="mt-4 bg-white border border-slate-200 text-gray-700 px-6 py-3 font-bold text-[13px] rounded-2xl transition-all shadow-sm active:scale-[0.98]"
              >
                Go Back
              </button>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class LedgerDetailsComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  ledgerService = inject(LedgerService);
  confirmService = inject(ConfirmService);

  ledgerId = computed(() => this.route.snapshot.paramMap.get('id'));

  ledger = computed(() => {
    return this.ledgerService.ledgerEntries().find((e) => e.id === this.ledgerId());
  });

  transactions = computed(() => {
    const parentId = this.ledgerId();
    if (!parentId) return [];
    return this.ledgerService.subTransactions().filter((s) => s.ledger_id === parentId);
  });

  ledgerBalance = computed(() => {
    const active = this.ledger();
    if (!active) return 0;
    return this.ledgerService.getLedgerBalance(active);
  });

  async settleBalance(type: 'in' | 'out') {
    const parent = this.ledger();
    if (!parent) return;
    const balance = Math.abs(this.ledgerBalance());
    if (balance === 0) return;

    this.ledgerService.openSubBottomSheetForSettlement(parent, balance, type);
  }

  editTransaction(tx: LedgerSubTransaction) {
    const parent = this.ledger();
    if (parent) {
      this.ledgerService.openSubBottomSheet(parent, tx);
    }
  }

  goBack() {
    this.router.navigate(['/ledger']);
  }
}
