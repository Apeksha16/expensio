import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LedgerService, LedgerEntry } from '../../core/services/ledger.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="h-full bg-white flex flex-col relative">
      <!-- Fixed Header Container -->
      <div class="px-4 pt-4 shrink-0 flex flex-col gap-4">
        @if (ledgerService.isLoading()) {
          <!-- Top Summary Box Shimmer -->
          <div class="flex gap-4 w-full">
            <div class="flex-1 bg-slate-50 border border-slate-100 rounded-3xl h-[160px] animate-pulse"></div>
            <div class="flex-1 bg-slate-50 border border-slate-100 rounded-3xl h-[160px] animate-pulse"></div>
          </div>
        } @else {
          <!-- Summary Cards -->
          <div class="flex gap-4 w-full">
            <!-- Money In -->
            <div class="flex-1 bg-[#EFF6FF] rounded-3xl p-5 flex flex-col items-start relative overflow-hidden shadow-sm">
              <div class="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-ledger-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <span class="text-xs font-bold text-gray-500 mb-1">Money In</span>
              <span class="text-2xl font-extrabold text-gray-900 tracking-tight truncate w-full">
                ₹{{ ledgerService.totalReceived() | number: '1.0-0' }}
              </span>
            </div>

            <!-- Money Out -->
            <div class="flex-1 bg-[#FFF0F4] rounded-3xl p-5 flex flex-col items-start relative overflow-hidden shadow-sm">
              <div class="w-10 h-10 rounded-full bg-[#FFE4EC] flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-[#E11D48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <span class="text-xs font-bold text-gray-500 mb-1">Money Out</span>
              <span class="text-2xl font-extrabold text-gray-900 tracking-tight truncate w-full">
                ₹{{ ledgerService.totalGiven() | number: '1.0-0' }}
              </span>
            </div>
          </div>

          <!-- Tabs -->
          <div class="w-full bg-slate-50 p-1.5 rounded-[16px] flex shrink-0 mt-2">
            <button
              (click)="activeTab.set('pending')"
              [class.bg-white]="activeTab() === 'pending'"
              [class.text-ledger-primary]="activeTab() === 'pending'"
              [class.shadow-sm]="activeTab() === 'pending'"
              [class.text-gray-500]="activeTab() !== 'pending'"
              class="active:scale-[0.98] transition-all duration-200 flex-1 py-3 font-extrabold text-[13px] transition-all rounded-xl"
            >
              Pending
            </button>
            <button
              (click)="activeTab.set('completed')"
              [class.bg-white]="activeTab() === 'completed'"
              [class.text-ledger-primary]="activeTab() === 'completed'"
              [class.shadow-sm]="activeTab() === 'completed'"
              [class.text-gray-500]="activeTab() !== 'completed'"
              class="active:scale-[0.98] transition-all duration-200 flex-1 py-3 font-extrabold text-[13px] transition-all rounded-xl"
            >
              Completed
            </button>
          </div>
        }
      </div>
      
      <!-- Scrollable Area -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pb-28 mt-4">
        @if (ledgerService.isLoading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="w-full bg-slate-50 border border-slate-100 rounded-3xl h-[120px] animate-pulse"></div>
            }
          </div>
        } @else {
          <div class="flex flex-col gap-3">
            @if (filteredEntries().length > 0) {
              @for (entry of filteredEntries(); track entry.id) {
                <button
                  (click)="viewDetails(entry.id)"
                  class="w-full bg-ledger-primary/[0.03] border border-ledger-primary/10 rounded-3xl p-4 flex flex-col gap-3 text-left shadow-sm transition-all active:scale-[0.99] overflow-hidden"
                >
                  <!-- Top Row: Avatar, Name, Amount -->
                  <div class="flex justify-between items-center w-full">
                    <div class="flex items-center gap-3.5 min-w-0">
                      <div class="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center shrink-0">
                        <span class="text-xl font-extrabold text-ledger-primary">{{ entry.person_name.charAt(0).toUpperCase() }}</span>
                      </div>
                      <div class="flex flex-col min-w-0">
                        <span class="font-extrabold text-[16px] text-gray-900 truncate">{{ entry.person_name }}</span>
                        <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                          {{ entry.date | date: 'MMM d, h:mm a' }}
                        </span>
                      </div>
                    </div>

                    <div class="flex flex-col items-end shrink-0 pl-3 max-w-[45%] min-w-0">
                      <span
                        class="font-extrabold text-xl tracking-tight leading-none truncate w-full text-right"
                        [class.text-emerald-600]="ledgerService.getLedgerBalance(entry) > 0"
                        [class.text-red-600]="ledgerService.getLedgerBalance(entry) < 0"
                        [class.text-gray-900]="ledgerService.getLedgerBalance(entry) === 0"
                      >
                        ₹{{ (ledgerService.getLedgerBalance(entry) < 0 ? -ledgerService.getLedgerBalance(entry) : ledgerService.getLedgerBalance(entry)) | number: '1.0-0' }}
                      </span>
                    </div>
                  </div>

                  <!-- Bottom Row: Purpose and Status Tag -->
                  <div class="flex justify-between items-center w-full pt-3 border-t border-slate-100 border-dashed mt-1">
                    <span class="text-[11px] font-semibold text-gray-500 truncate pr-4">
                      {{ entry.purpose || 'No note' }}
                    </span>

                    <div class="shrink-0 flex items-center gap-2">
                      @if (ledgerService.getLedgerBalance(entry) < 0) {
                        <div
                          (click)="settleUp($event, entry)"
                          class="text-[10px] font-bold text-gray-700 border border-slate-200 bg-white shadow-sm active:bg-slate-50 px-3 py-1.5 rounded-xl uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Settle
                        </div>
                        <span class="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase tracking-widest">
                          You owe
                        </span>
                      } @else if (ledgerService.getLedgerBalance(entry) > 0) {
                        <div
                          (click)="settleUp($event, entry)"
                          class="text-[10px] font-bold text-gray-700 border border-slate-200 bg-white shadow-sm active:bg-slate-50 px-3 py-1.5 rounded-xl uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Settle
                        </div>
                        <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase tracking-widest">
                          You get
                        </span>
                      } @else {
                        <span class="text-[10px] font-bold text-gray-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded-full uppercase tracking-widest">
                          Settled
                        </span>
                      }
                    </div>
                  </div>
                </button>
              }
            } @else {
              <div class="mt-8 flex flex-col items-center justify-center text-center px-4">
                <div class="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm overflow-hidden">
                  <svg class="w-16 h-16 text-ledger-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <h4 class="text-[17px] font-extrabold text-gray-900 mb-2">No records yet</h4>
                <p class="text-[13px] font-medium text-gray-500 max-w-[240px] mb-8 leading-relaxed">
                  Tap + to track money you've given to or received from someone.
                </p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class LedgerComponent {
  ledgerService = inject(LedgerService);
  router = inject(Router);
  confirmService = inject(ConfirmService);

  activeTab = signal<'pending' | 'completed'>('pending');

  filteredEntries = computed(() => {
    let entries = this.ledgerService.ledgerEntries();
    const tab = this.activeTab();

    if (tab === 'pending') {
      entries = entries.filter((e) => this.ledgerService.getLedgerBalance(e) !== 0);
    } else if (tab === 'completed') {
      entries = entries.filter((e) => this.ledgerService.getLedgerBalance(e) === 0);
    }

    return entries;
  });

  viewDetails(id: string) {
    this.router.navigate(['/ledger', id]);
  }

  async settleUp(event: Event, entry: LedgerEntry) {
    event.stopPropagation();
    const balance = this.ledgerService.getLedgerBalance(entry);
    if (balance === 0) return;

    const amountToSettle = Math.abs(balance);
    // If balance < 0 (You owe them), settling means you are giving money (out).
    // If balance > 0 (They owe you), settling means you are receiving money (in).
    const type = balance < 0 ? 'out' : 'in';

    this.ledgerService.openSubBottomSheetForSettlement(entry, amountToSettle, type);
  }
}
