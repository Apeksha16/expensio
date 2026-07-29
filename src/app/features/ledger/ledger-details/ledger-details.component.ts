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
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="flex flex-col h-full relative bg-white">
      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 pb-28">
        @if (ledgerService.isLoading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="w-full bg-gray-100 rounded-2xl h-20 animate-pulse border-2 border-gray-200"></div>
            }
          </div>
        } @else {
          @if (ledger()) {
            <!-- Settled Banner -->
            @if (ledgerBalance() === 0) {
              <div class="mb-5 bg-emerald-300 border-2 border-black rounded-2xl p-4 flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div class="w-10 h-10 bg-white border-2 border-black text-black flex items-center justify-center rounded-xl shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
            <div class="mb-6 bg-black p-5 rounded-2xl relative overflow-hidden text-white shadow-[6px_6px_0px_0px_rgba(239,68,68,1)]">
              <div class="relative z-10 flex flex-col items-center text-center">
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Remaining Balance
                </span>
                <span class="text-3xl font-black tracking-tight mt-1">
                  {{ ledgerBalance() >= 0 ? '+' : '' }}₹{{ ledgerBalance() | number: '1.2-2' }}
                </span>
                <span class="text-[10px] font-black mt-1 uppercase tracking-widest text-gray-300">
                  @if (ledgerBalance() > 0) {
                    They still owe you
                  } @else if (ledgerBalance() < 0) {
                    You still owe
                  } @else {
                    Fully settled!
                  }
                </span>

                <div class="w-full h-px bg-gray-700 my-4 border-dashed border-t-2 border-gray-700"></div>

                <div class="flex flex-col gap-0.5 w-full text-left bg-gray-900 p-4 border-2 border-gray-700 rounded-xl">
                  <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Started as
                    <span class="text-white">₹{{ $safeNavigationMigration(ledger()?.amount) | number: '1.0-0' }}</span>
                    {{ ledger()?.type === 'in' ? 'Received' : 'Given' }}
                  </span>
                  @if (ledger()?.purpose) {
                    <span class="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-1">
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
                    class="flex-1 bg-white hover:bg-emerald-50 text-black p-3 font-black text-xs uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 border-2 border-black active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    Received Back
                  </button>
                } @else {
                  <button
                    (click)="settleBalance('out')"
                    class="flex-1 bg-white hover:bg-red-50 text-black p-3 font-black text-xs uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2 border-2 border-black active:scale-[0.98] shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]"
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
                    class="w-full bg-white rounded-2xl p-4 flex items-center justify-between gap-4 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:scale-[0.99] transition-all border-2 border-black"
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
                <div class="flex-1 flex flex-col items-center justify-center p-8 text-center mt-4 h-[200px]">
                  <div class="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-6">
                    <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p class="text-black font-extrabold text-lg">No payments yet</p>
                  <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
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
                class="mt-6 bg-white border-2 border-black text-black px-6 py-3 font-black text-sm rounded-xl uppercase tracking-widest hover:bg-gray-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-[0.95] transition-all"
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
