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
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="h-full bg-white p-4 flex flex-col gap-4">
      <!-- Summary Header -->
      <div class="bg-black text-white p-5 rounded-2xl shadow-[6px_6px_0px_0px_rgba(239,68,68,1)]">
        <h2 class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          Your Net Balance
        </h2>
        <p class="text-4xl font-black tracking-tight">
          {{ ledgerService.netBalance() >= 0 ? '+' : '' }}₹{{ ledgerService.netBalance() | number: '1.2-2' }}
        </p>
        <p class="text-[11px] font-bold mt-1 text-gray-300">
          @if (ledgerService.netBalance() > 0) {
            Others owe you
          } @else if (ledgerService.netBalance() < 0) {
            You owe others
          } @else {
            All settled!
          }
        </p>
        <div class="flex justify-between items-center mt-5 pt-4 border-t border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <div>
            Money In:
            <span class="text-emerald-400 ml-1 font-black">₹{{ ledgerService.totalReceived() | number: '1.0-0' }}</span>
          </div>
          <div>
            Money Out:
            <span class="text-red-400 ml-1 font-black">₹{{ ledgerService.totalGiven() | number: '1.0-0' }}</span>
          </div>
        </div>
      </div>
      
      <!-- Ledger Entry List -->
      <div class="flex-1 flex flex-col gap-4 pb-28 mt-1 overflow-y-auto overflow-x-hidden no-scrollbar">
        @if (ledgerService.isLoading()) {
          @for (i of [1, 2, 3]; track i) {
            <div class="w-full bg-gray-100 rounded-2xl p-4 flex flex-col gap-4 border-2 border-gray-200 animate-pulse h-[130px]">
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3 w-2/3">
                  <div class="w-10 h-10 rounded-xl bg-gray-200 shrink-0 border-2 border-gray-300"></div>
                  <div class="flex flex-col gap-2 w-full">
                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div class="h-2 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div class="h-5 bg-gray-200 rounded w-16 shrink-0 ml-3"></div>
              </div>
              <div class="flex justify-between items-center pt-3 border-t-2 border-gray-200 border-dashed">
                <div class="h-2.5 bg-gray-200 rounded w-1/3"></div>
                <div class="h-6 bg-gray-200 rounded w-16 shrink-0"></div>
              </div>
            </div>
          }
        } @else {
          @if (filteredEntries().length > 0) {
            @for (entry of filteredEntries(); track entry.id) {
              <div
                (click)="viewDetails(entry.id)"
                role="button"
                tabindex="0"
                class="w-full bg-white rounded-2xl p-4 flex flex-col gap-3 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-[0.99] border-2 border-black relative overflow-hidden"
              >
                <!-- Top Row: Avatar, Name, Amount -->
                <div class="flex justify-between items-center w-full">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-ledger-primary text-white flex items-center justify-center shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <span class="text-base font-black">{{ entry.person_name.charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="font-black text-lg text-black truncate">{{ entry.person_name }}</span>
                      <span class="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                        {{ entry.date | date: 'MMM d, h:mm a' }}
                      </span>
                    </div>
                  </div>

                  <div class="flex flex-col items-end shrink-0 pl-3">
                    <span
                      class="font-black text-xl"
                      [class.text-emerald-600]="ledgerService.getLedgerBalance(entry) > 0"
                      [class.text-red-600]="ledgerService.getLedgerBalance(entry) < 0"
                      [class.text-black]="ledgerService.getLedgerBalance(entry) === 0"
                    >
                      {{ ledgerService.getLedgerBalance(entry) > 0 ? '+' : '' }}₹{{ ledgerService.getLedgerBalance(entry) | number: '1.0-0' }}
                    </span>
                  </div>
                </div>

                <!-- Bottom Row: Purpose and Status Tag -->
                <div class="flex justify-between items-center w-full pt-3 border-t-2 border-black border-dashed mt-1">
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate pr-4">
                    {{ entry.purpose || 'No note' }}
                  </span>

                  <div class="shrink-0 flex items-center gap-2">
                    @if (ledgerService.getLedgerBalance(entry) < 0) {
                      <button
                        (click)="settleUp($event, entry)"
                        class="text-[9px] font-black text-black border-2 border-black bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-[0.95] px-3 py-1.5 rounded-xl uppercase tracking-widest transition-all"
                      >
                        Received back
                      </button>
                      <span class="text-[9px] font-black text-black bg-emerald-300 border-2 border-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        They owe you
                      </span>
                    } @else if (ledgerService.getLedgerBalance(entry) > 0) {
                      <button
                        (click)="settleUp($event, entry)"
                        class="text-[9px] font-black text-black border-2 border-black bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-[0.95] px-3 py-1.5 rounded-xl uppercase tracking-widest transition-all"
                      >
                        Paid back
                      </button>
                      <span class="text-[9px] font-black text-black bg-red-300 border-2 border-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        You owe
                      </span>
                    } @else {
                      <span class="text-[9px] font-black text-black bg-gray-200 border-2 border-black px-2 py-1 rounded-lg uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        Settled
                      </span>
                    }
                  </div>
                </div>
              </div>
            }
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center h-[300px]">
              <div class="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p class="text-black font-extrabold text-xl">No records yet</p>
              <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                Tap + to track money you've given to or received from someone.
              </p>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class LedgerComponent {
  ledgerService = inject(LedgerService);
  router = inject(Router);
  confirmService = inject(ConfirmService);

  searchQuery = signal('');
  activeFilter = signal<'all' | 'in' | 'out'>('all');

  filteredEntries = computed(() => {
    let entries = this.ledgerService.ledgerEntries();
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.activeFilter();

    if (query) {
      entries = entries.filter(
        (e) =>
          e.person_name.toLowerCase().includes(query) ||
          (e.purpose && e.purpose.toLowerCase().includes(query)),
      );
    }

    if (filter === 'in') {
      entries = entries.filter((e) => this.ledgerService.getLedgerBalance(e) >= 0);
    } else if (filter === 'out') {
      entries = entries.filter((e) => this.ledgerService.getLedgerBalance(e) < 0);
    }

    return entries;
  });

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  setFilter(filter: 'all' | 'in' | 'out') {
    this.activeFilter.set(filter);
  }

  viewDetails(id: string) {
    this.router.navigate(['/ledger', id]);
  }

  async settleUp(event: Event, entry: LedgerEntry) {
    event.stopPropagation();
    const balance = this.ledgerService.getLedgerBalance(entry);
    if (balance === 0) return;

    const amountToSettle = Math.abs(balance);
    const type = balance < 0 ? 'in' : 'out';

    this.confirmService.open({
      title: 'Settle Balance',
      message: `How much are you settling now?`,
      confirmText: 'Settle',
      cancelText: 'Cancel',
      showInput: true,
      inputValue: amountToSettle,
      inputMax: amountToSettle,
      onConfirm: async (amount?: number) => {
        const finalAmount = amount && amount > 0 ? amount : amountToSettle;
        await this.ledgerService.addSubEntry({
          ledger_id: entry.id,
          amount: finalAmount,
          type: type,
          purpose: 'Settled',
          date: new Date().toISOString(),
        });
      }
    });
  }
}
