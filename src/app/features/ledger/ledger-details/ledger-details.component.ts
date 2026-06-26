import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LedgerService, LedgerEntry, LedgerSubTransaction } from '../../../core/services/ledger.service';

@Component({
  selector: 'app-ledger-details',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full bg-gray-50',
  },
  template: `
    <div class="flex flex-col h-full relative">
      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 pb-36">
        @if (ledgerService.isLoading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1,2,3]; track i) {
              <div class="w-full bg-gray-200 rounded-none h-20 animate-pulse border-2 border-black"></div>
            }
          </div>
        } @else {
          @if (ledger()) {
            <!-- Settled Banner -->
            @if (ledgerBalance() === 0) {
              <div class="mb-4 bg-green-200 border-2 border-black rounded-none p-4 flex items-center gap-4">
                <div class="w-10 h-10 bg-green-500 border-2 border-black text-black flex items-center justify-center rounded-none shrink-0">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-extrabold text-black tracking-widest uppercase">All Settled</p>
                  <p class="text-xs font-bold text-gray-700 mt-0.5">This account has no outstanding balance.</p>
                </div>
              </div>
            }

            <!-- Summary Card -->
            <div class="mb-5 bg-black p-4 border-2 border-black rounded-none relative overflow-hidden text-white">
              <div class="relative z-10 flex flex-col items-center text-center">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remaining Balance</span>
                <span class="text-3xl font-extrabold tracking-tight mt-1">
                  {{ ledgerBalance() >= 0 ? '+' : '' }}₹{{ ledgerBalance() | number:'1.2-2' }}
                </span>
                <span class="text-[10px] font-bold mt-1 uppercase tracking-widest"
                  [class.text-green-500]="ledgerBalance() > 0"
                  [class.text-red-500]="ledgerBalance() < 0"
                  [class.text-gray-400]="ledgerBalance() === 0"
                >
                  @if (ledgerBalance() > 0) {
                    They still owe you
                  } @else if (ledgerBalance() < 0) {
                    You still owe
                  } @else {
                    Fully settled!
                  }
                </span>
                
                <div class="w-full h-px bg-gray-800 my-3"></div>
                
                <div class="flex flex-col gap-0.5 w-full text-left bg-gray-900 p-3 border border-gray-700 rounded-none">
                  <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Started as <span class="font-extrabold text-white">₹{{ ledger()?.amount | number:'1.0-0' }}</span> {{ ledger()?.type === 'in' ? 'Received' : 'Given' }}
                  </span>
                  @if (ledger()?.purpose) {
                    <span class="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      {{ ledger()?.purpose }}
                    </span>
                  }
                </div>
              </div>
            </div>

            <!-- Payment History -->
            <div class="flex flex-col gap-3">
              <h3 class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-1">
                Payment History
              </h3>
              
              @if (transactions().length > 0) {
                @for (tx of transactions(); track tx.id) {
                  <button
                    (click)="editTransaction(tx)"
                    class="w-full bg-gray-200 rounded-none p-3 flex items-center justify-between gap-4 text-left hover:bg-gray-300 active:bg-gray-400 transition-colors border-l-4"
                    [class.border-green-500]="tx.type === 'in'"
                    [class.border-red-500]="tx.type === 'out'"
                  >
                    <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                      <span class="font-extrabold text-lg text-black truncate">{{ tx.purpose || 'No note' }}</span>
                      <div class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest min-w-0">
                        <span class="whitespace-nowrap flex-shrink-0">{{ tx.date | date:'MMM d, h:mm a' }}</span>
                      </div>
                    </div>
                    <div class="flex flex-col items-end gap-2 flex-shrink-0">
                      <span
                        class="font-extrabold text-xl"
                        [class.text-green-600]="tx.type === 'in'"
                        [class.text-red-600]="tx.type === 'out'"
                      >
                        {{ tx.type === 'in' ? '+' : '-' }}₹{{ tx.amount | number:'1.0-0' }}
                      </span>
                    </div>
                  </button>
                }
              } @else {
                <div class="flex-1 flex flex-col items-center justify-center p-8 text-center mt-4">
                  <div class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6">
                    <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p class="text-gray-500 font-extrabold text-xl">No payments yet</p>
                  <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                    Tap the + button below to add your first payment.
                  </p>
                </div>
              }
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <p class="text-gray-500 font-extrabold text-xl uppercase tracking-widest">Record not found</p>
              <button (click)="goBack()" class="mt-4 bg-white border-2 border-black text-black px-6 py-2.5 font-bold text-sm rounded-none uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                Go Back
              </button>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class LedgerDetailsComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  ledgerService = inject(LedgerService);

  ledgerId = computed(() => this.route.snapshot.paramMap.get('id'));
  
  ledger = computed(() => {
    return this.ledgerService.ledgerEntries().find(e => e.id === this.ledgerId());
  });

  transactions = computed(() => {
    const parentId = this.ledgerId();
    if (!parentId) return [];
    return this.ledgerService.subTransactions().filter(s => s.ledger_id === parentId);
  });

  ledgerBalance = computed(() => {
    const active = this.ledger();
    if (!active) return 0;
    return this.ledgerService.getLedgerBalance(active);
  });

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
