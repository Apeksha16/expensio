import { Component, inject, signal, computed } from '@angular/core';
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
  template: `
    <div class="h-full bg-gray-50 p-4 flex flex-col gap-5">
      <!-- Summary Header -->
      <div class="bg-ledger-primary text-white p-5 border-2 border-ledger-dark rounded-none">
        <h2 class="text-xs font-bold text-ledger-surface opacity-80 uppercase tracking-widest mb-1">
          Your Net Balance
        </h2>
        <p class="text-4xl font-extrabold tracking-tight">
          {{ ledgerService.netBalance() >= 0 ? '+' : '' }}₹{{ ledgerService.netBalance() | number: '1.2-2' }}
        </p>
        <p class="text-[11px] font-bold mt-1"
          [class.text-green-400]="ledgerService.netBalance() > 0"
          [class.text-red-400]="ledgerService.netBalance() < 0"
          [class.text-gray-500]="ledgerService.netBalance() === 0"
        >
          @if (ledgerService.netBalance() > 0) {
            Others owe you
          } @else if (ledgerService.netBalance() < 0) {
            You owe others
          } @else {
            All settled!
          }
        </p>
        <div class="flex justify-between items-center mt-4 pt-3 border-t-2 border-ledger-dark text-[10px] font-bold uppercase tracking-widest text-ledger-surface opacity-90">
          <div>Money In: <span class="text-green-300 font-extrabold ml-1">₹{{ ledgerService.totalReceived() | number: '1.0-0' }}</span></div>
          <div>Money Out: <span class="text-red-400 font-extrabold ml-1">₹{{ ledgerService.totalGiven() | number: '1.0-0' }}</span></div>
        </div>
      </div>      <!-- Ledger Entry List -->
      <div class="flex-1 flex flex-col gap-3 pb-36 mt-1">
        @if (ledgerService.isLoading()) {
          @for (i of [1, 2, 3]; track i) {
            <div class="w-full bg-white rounded-2xl p-4 h-24 animate-pulse flex justify-between items-center shadow-sm border border-gray-100">
              <div class="flex flex-col gap-3 w-1/2">
                <div class="h-4 bg-gray-200 rounded-full w-3/4"></div>
                <div class="h-3 bg-gray-100 rounded-full w-1/2"></div>
              </div>
              <div class="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
          }
        } @else {
          @if (filteredEntries().length > 0) {
            @for (entry of filteredEntries(); track entry.id) {
              <button
                (click)="viewDetails(entry.id)"
                class="w-full bg-ledger-surface rounded-none p-3 flex justify-between items-center text-left hover:bg-ledger-light transition-colors active:bg-ledger-primary active:text-white border-l-4"
                [class.border-green-500]="ledgerService.getLedgerBalance(entry) > 0"
                [class.border-red-500]="ledgerService.getLedgerBalance(entry) < 0"
                [class.border-gray-500]="ledgerService.getLedgerBalance(entry) === 0"
              >
                <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                  <div class="flex items-center gap-2">
                    <span class="font-extrabold text-lg text-ledger-dark truncate">{{ entry.person_name }}</span>
                    @if (ledgerService.getLedgerBalance(entry) === 0) {
                      <div class="bg-gray-800 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-none uppercase tracking-widest">Settled</div>
                    }
                  </div>
                  
                  <div class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest min-w-0 mt-0.5">
                    <span class="truncate">{{ entry.purpose || 'No note' }}</span>
                    <span class="flex-shrink-0">•</span>
                    <span class="whitespace-nowrap flex-shrink-0">{{ entry.date | date: 'MMM d, h:mm a' }}</span>
                  </div>
                  
                  <div class="mt-1 flex">
                    @if (ledgerService.getLedgerBalance(entry) > 0) {
                      <span class="text-[10px] font-bold text-green-600 bg-green-100 border border-green-200 px-2 py-0.5 rounded-none uppercase tracking-widest">They owe you ₹{{ ledgerService.getLedgerBalance(entry) | number: '1.0-0' }}</span>
                    } @else if (ledgerService.getLedgerBalance(entry) < 0) {
                      <span class="text-[10px] font-bold text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-none uppercase tracking-widest">You owe ₹{{ (ledgerService.getLedgerBalance(entry) * -1) | number: '1.0-0' }}</span>
                    }
                  </div>
                </div>
                <div class="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    class="font-extrabold text-xl"
                    [class.text-green-600]="ledgerService.getLedgerBalance(entry) > 0"
                    [class.text-red-600]="ledgerService.getLedgerBalance(entry) < 0"
                    [class.text-gray-500]="ledgerService.getLedgerBalance(entry) === 0"
                  >
                    {{ ledgerService.getLedgerBalance(entry) > 0 ? '+' : '' }}₹{{ ledgerService.getLedgerBalance(entry) | number: '1.0-0' }}
                  </span>
                </div>
              </button>
            }
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center mt-8">
              <div class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <p class="text-gray-500 font-extrabold text-xl">No records yet</p>
              <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                Tap + to track money you've given to or received from someone — like a loan to a friend or cash from family.
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
      entries = entries.filter((e) =>
        e.person_name.toLowerCase().includes(query) ||
        (e.purpose && e.purpose.toLowerCase().includes(query))
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
}
