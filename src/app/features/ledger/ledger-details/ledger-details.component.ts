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
    class: 'block h-full bg-gray-50',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="flex flex-col h-full relative bg-white">
      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 pb-28">
        @if (ledgerService.isLoading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="w-full bg-gray-50 rounded-2xl h-20 animate-pulse border border-gray-100"></div>
            }
          </div>
        } @else {
          @if (ledger()) {
            <!-- Settled Banner -->
            @if (ledgerBalance() === 0) {
              <div class="mb-5 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                <div class="w-10 h-10 bg-white border border-emerald-200 text-emerald-600 flex items-center justify-center rounded-xl shrink-0 shadow-sm">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-black text-black tracking-widest uppercase">
                    All Settled
                  </p>
                  <p class="text-[10px] font-bold text-black mt-0.5 uppercase tracking-widest">
                    No outstanding balance
                  </p>
                </div>
              </div>
            }

            <!-- Summary Card -->
            <div class="mb-6 bg-white border border-gray-100 p-5 rounded-2xl relative overflow-hidden text-gray-900 shadow-sm">
              <div class="relative z-10 flex flex-col items-center text-center">
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Remaining Balance
                </span>
                <span class="text-3xl font-black tracking-tight mt-1">
                  {{ ledgerBalance() >= 0 ? '+' : '' }}₹{{ ledgerBalance() | number: '1.2-2' }}
                </span>
                <span class="text-[10px] font-bold mt-1 uppercase tracking-widest text-gray-500">
                  @if (ledgerBalance() > 0) {
                    They still owe you
                  } @else if (ledgerBalance() < 0) {
                    You still owe
                  } @else {
                    Fully settled!
                  }
                </span>

                <div class="w-full h-px my-4 border-dashed border-t border-gray-200"></div>

                <div class="flex flex-col gap-0.5 w-full text-left bg-gray-50 p-4 border border-gray-100 rounded-xl">
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Started as
                    <span class="text-gray-900">₹{{ $safeNavigationMigration(ledger()?.amount) | number: '1.0-0' }}</span>
                    {{ ledger()?.type === 'in' ? 'Received' : 'Given' }}
                  </span>
                  @if (ledger()?.purpose) {
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                      {{ ledger()?.purpose }}
                    </span>
                  }
                </div>
              </div>
            </div>

            @if (ledgerBalance() !== 0) {
              <div class="mb-6 flex gap-3">
                @if (ledgerBalance() < 0) {
                  <button
                    (click)="settleBalance('in')"
                    class="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 p-3 font-bold text-xs uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 border border-emerald-200 active:scale-[0.98] shadow-sm"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    Received Back
                  </button>
                } @else {
                  <button
                    (click)="settleBalance('out')"
                    class="flex-1 bg-white hover:bg-red-50 text-red-700 p-3 font-bold text-xs uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 border border-red-200 active:scale-[0.98] shadow-sm"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    Paid Back
                  </button>
                }
              </div>
            }

            <!-- Payment History -->
            <div class="flex flex-col gap-3">
              <h3 class="text-xs font-black text-black uppercase tracking-widest px-1 mb-1">
                Payment History
              </h3>

              @if (transactions().length > 0) {
                @for (tx of transactions(); track tx.id) {
                  <div
                    (click)="editTransaction(tx)"
                    role="button"
                    tabindex="0"
                    class="w-full bg-white rounded-2xl p-4 flex items-center justify-between gap-4 text-left shadow-sm hover:shadow-md active:scale-[0.99] transition-all border border-gray-100"
                  >
                    <div class="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                      <span class="font-black text-base text-black truncate">{{ tx.purpose || 'No note' }}</span>
                      <div class="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-0">
                        <span class="whitespace-nowrap flex-shrink-0">{{ tx.date | date: 'MMM d, h:mm a' }}</span>
                      </div>
                    </div>
                    <div class="flex flex-col items-end gap-2 flex-shrink-0">
                      <span
                        class="font-black text-xl"
                        [class.text-emerald-600]="tx.type === 'in'"
                        [class.text-red-600]="tx.type === 'out'"
                      >
                        {{ tx.type === 'in' ? '+' : '-' }}₹{{ tx.amount | number: '1.0-0' }}
                      </span>
                    </div>
                  </div>
                }
              } @else {
                <div class="mt-4 w-full bg-[#FCFCFD] border border-dashed border-gray-200 rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
                  <div class="w-12 h-12 bg-indigo-50 rounded-[14px] flex items-center justify-center mb-3">
                    <svg class="w-6 h-6 text-[#5421E6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h4 class="text-sm font-bold text-slate-800 mb-1">No payments yet</h4>
                  <p class="text-xs text-slate-500 max-w-[250px]">
                    Tap the button above to add your first payment.
                  </p>
                </div>
              }
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center py-12 text-center h-[400px]">
              <p class="text-black font-extrabold text-xl uppercase tracking-widest">
                Record not found
              </p>
              <button
                (click)="goBack()"
                class="mt-6 bg-white border border-gray-200 text-gray-700 px-6 py-3 font-bold text-sm rounded-xl uppercase tracking-widest hover:bg-gray-50 shadow-sm active:scale-[0.95] transition-all"
              >
                Go Back
              </button>
            </div>
          }
        }
      </div>
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

    this.confirmService.open({
      title: 'Settle Balance',
      message: `How much are you settling now?`,
      confirmText: 'Settle',
      cancelText: 'Cancel',
      showInput: true,
      inputValue: balance,
      inputMax: balance,
      onConfirm: async (amount?: number) => {
        const finalAmount = amount && amount > 0 ? amount : balance;
        await this.ledgerService.addSubEntry({
          ledger_id: parent.id,
          amount: finalAmount,
          type: type,
          purpose: 'Settled',
          date: new Date().toISOString(),
        });
      }
    });
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
