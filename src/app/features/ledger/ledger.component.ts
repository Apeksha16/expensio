import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LedgerService, LedgerEntry } from '../../core/services/ledger.service';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="h-full bg-gray-50 p-4 flex flex-col gap-5">
      <!-- Summary Header -->
      <div class="bg-ledger-primary text-white p-5 rounded-none">
        <h2 class="text-xs font-bold text-ledger-surface opacity-80 uppercase tracking-widest mb-1">
          Your Net Balance
        </h2>
        <p class="text-4xl font-extrabold tracking-tight">
          {{ ledgerService.netBalance() >= 0 ? '+' : '' }}₹{{
            ledgerService.netBalance() | number: '1.2-2'
          }}
        </p>
        <p class="text-[11px] font-bold mt-1 text-ledger-surface opacity-90">
          @if (ledgerService.netBalance() > 0) {
            Others owe you
          } @else if (ledgerService.netBalance() < 0) {
            You owe others
          } @else {
            All settled!
          }
        </p>
        <div
          class="flex justify-between items-center mt-4 pt-3 border-t-2 border-ledger-dark text-[10px] font-bold uppercase tracking-widest text-ledger-surface opacity-90"
        >
          <div>
            Money In:
            <span class="text-white font-extrabold ml-1"
              >₹{{ ledgerService.totalReceived() | number: '1.0-0' }}</span
            >
          </div>
          <div>
            Money Out:
            <span class="text-white font-extrabold ml-1"
              >₹{{ ledgerService.totalGiven() | number: '1.0-0' }}</span
            >
          </div>
        </div>
      </div>
      <!-- Ledger Entry List -->
      <div class="flex-1 flex flex-col gap-3 pb-36 mt-1">
        @if (ledgerService.isLoading()) {
          @for (i of [1, 2, 3]; track i) {
            <div
              class="w-full bg-ledger-surface rounded-none p-4 flex flex-col gap-4 border-b-2 border-ledger-light/20 relative overflow-hidden animate-pulse"
            >
              <!-- Left status bar skeleton -->
              <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gray-300"></div>

              <!-- Top Row: Avatar, Name, Amount -->
              <div class="flex justify-between items-center pl-2">
                <div class="flex items-center gap-3 w-2/3">
                  <div class="w-10 h-10 rounded-full bg-gray-300 shrink-0"></div>
                  <div class="flex flex-col gap-2 w-full">
                    <div class="h-4 bg-gray-300 rounded w-1/2"></div>
                    <div class="h-2 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div class="h-5 bg-gray-300 rounded w-16 shrink-0 ml-3"></div>
              </div>

              <!-- Bottom Row: Purpose and Status Tag -->
              <div
                class="flex justify-between items-center pl-2 pt-2 border-t border-ledger-light/20"
              >
                <div class="h-2.5 bg-gray-200 rounded w-1/3"></div>
                <div class="h-4 bg-gray-300 rounded w-16 shrink-0"></div>
              </div>
            </div>
          }
        } @else {
          @if (filteredEntries().length > 0) {
            @for (entry of filteredEntries(); track entry.id) {
              <button
                (click)="viewDetails(entry.id)"
                class="w-full bg-ledger-surface rounded-none p-4 flex flex-col gap-4 text-left hover:bg-ledger-light/30 transition-colors border-b-2 border-ledger-light/20 relative overflow-hidden"
              >
                <!-- Left status bar -->
                <div
                  class="absolute left-0 top-0 bottom-0 w-1.5"
                  [class.bg-green-500]="ledgerService.getLedgerBalance(entry) > 0"
                  [class.bg-red-500]="ledgerService.getLedgerBalance(entry) < 0"
                  [class.bg-gray-400]="ledgerService.getLedgerBalance(entry) === 0"
                ></div>

                <!-- Top Row: Avatar, Name, Amount -->
                <div class="flex justify-between items-center pl-2">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="w-10 h-10 rounded-full bg-ledger-primary/20 flex items-center justify-center shrink-0 border border-ledger-primary/30"
                    >
                      <span class="text-base font-extrabold text-ledger-dark">{{
                        entry.person_name.charAt(0).toUpperCase()
                      }}</span>
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="font-extrabold text-lg text-ledger-dark truncate">{{
                        entry.person_name
                      }}</span>
                      <span
                        class="text-[9px] font-bold text-ledger-dark/60 uppercase tracking-widest mt-0.5"
                        >{{ entry.date | date: 'MMM d, h:mm a' }}</span
                      >
                    </div>
                  </div>

                  <div class="flex flex-col items-end shrink-0 pl-3">
                    <span
                      class="font-extrabold text-xl"
                      [class.text-green-600]="ledgerService.getLedgerBalance(entry) > 0"
                      [class.text-red-600]="ledgerService.getLedgerBalance(entry) < 0"
                      [class.text-gray-500]="ledgerService.getLedgerBalance(entry) === 0"
                    >
                      {{ ledgerService.getLedgerBalance(entry) > 0 ? '+' : '' }}₹{{
                        ledgerService.getLedgerBalance(entry) | number: '1.0-0'
                      }}
                    </span>
                  </div>
                </div>

                <!-- Bottom Row: Purpose and Status Tag -->
                <div
                  class="flex justify-between items-center pl-2 pt-2 border-t border-ledger-light/20"
                >
                  <span
                    class="text-[10px] font-bold text-ledger-dark/70 uppercase tracking-widest truncate pr-4"
                  >
                    {{ entry.purpose || 'No note' }}
                  </span>

                  <div class="shrink-0 flex items-center gap-2">
                    @if (ledgerService.getLedgerBalance(entry) < 0) {
                      <button
                        (click)="settleUp($event, entry)"
                        class="text-[9px] font-extrabold text-green-700 border border-green-700 hover:bg-green-50 px-2 py-1 rounded-none uppercase tracking-widest transition-colors"
                      >
                        Received back
                      </button>
                      <span
                        class="text-[9px] font-extrabold text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-none uppercase tracking-widest"
                        >They owe you</span
                      >
                    } @else if (ledgerService.getLedgerBalance(entry) > 0) {
                      <button
                        (click)="settleUp($event, entry)"
                        class="text-[9px] font-extrabold text-red-700 border border-red-700 hover:bg-red-50 px-2 py-1 rounded-none uppercase tracking-widest transition-colors"
                      >
                        Paid back
                      </button>
                      <span
                        class="text-[9px] font-extrabold text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded-none uppercase tracking-widest"
                        >You owe</span
                      >
                    } @else {
                      <span
                        class="text-[9px] font-extrabold text-gray-700 bg-gray-200 border border-gray-300 px-2.5 py-1 rounded-none uppercase tracking-widest"
                        >Settled</span
                      >
                    }
                  </div>
                </div>
              </button>
            }
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center mt-8">
              <div
                class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6"
              >
                <svg
                  class="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              <p class="text-gray-500 font-extrabold text-xl">No records yet</p>
              <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                Tap + to track money you've given to or received from someone — like a loan to a
                friend or cash from family.
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

    await this.ledgerService.addSubEntry({
      ledger_id: entry.id,
      amount: amountToSettle,
      type: type,
      purpose: 'Settled',
      date: new Date().toISOString(),
    });
  }
}
