import { Injectable, signal, computed, Inject, effect, inject, untracked } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export interface LedgerEntry {
  id: string;
  user_id?: string;
  person_name: string;
  amount: number;
  type: 'in' | 'out'; // 'in' = Received (Borrow), 'out' = Given (Lend)
  purpose: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

export interface LedgerSubTransaction {
  id: string;
  ledger_id: string;
  amount: number;
  type: 'in' | 'out'; // 'in' = Received, 'out' = Given
  purpose: string;
  date: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  readonly isLoading = signal(false);
  readonly ledgerEntries = signal<LedgerEntry[]>([]);
  readonly subTransactions = signal<LedgerSubTransaction[]>([]);

  // Parent sheet state
  readonly isBottomSheetOpen = signal(false);
  readonly editingEntry = signal<LedgerEntry | null>(null);

  // Sub-transaction sheet state
  readonly isSubBottomSheetOpen = signal(false);
  readonly activeLedgerForSub = signal<LedgerEntry | null>(null);
  readonly editingSubEntry = signal<LedgerSubTransaction | null>(null);

  // Computeds for convenience
  readonly totalReceived = computed(() => {
    const parentIn = this.ledgerEntries()
      .filter((e) => e.type === 'in')
      .reduce((sum, e) => sum + e.amount, 0);
    const subIn = this.subTransactions()
      .filter((s) => s.type === 'in')
      .reduce((sum, s) => sum + s.amount, 0);
    return parentIn + subIn;
  });

  readonly totalGiven = computed(() => {
    const parentOut = this.ledgerEntries()
      .filter((e) => e.type === 'out')
      .reduce((sum, e) => sum + e.amount, 0);
    const subOut = this.subTransactions()
      .filter((s) => s.type === 'out')
      .reduce((sum, s) => sum + s.amount, 0);
    return parentOut + subOut;
  });

  readonly netBalance = computed(() => this.totalReceived() - this.totalGiven());

  constructor(@Inject(DOCUMENT) private document: Document) {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.fetchEntries();
      } else if (untracked(() => this.authService.isInitialized())) {
        this.ledgerEntries.set([]);
        this.subTransactions.set([]);
      }
    });
  }

  getLedgerBalance(ledger: LedgerEntry): number {
    const subs = this.subTransactions().filter((s) => s.ledger_id === ledger.id);
    const parentVal = ledger.type === 'in' ? ledger.amount : -ledger.amount;
    const subsVal = subs.reduce((sum, s) => sum + (s.type === 'in' ? s.amount : -s.amount), 0);
    return parentVal + subsVal;
  }

  async fetchEntries() {
    this.isLoading.set(true);
    const [entriesRes, subsRes] = await Promise.all([
      this.supabaseService.client
        .from('ledger_entries')
        .select('*')
        .order('date', { ascending: false }),
      this.supabaseService.client
        .from('ledger_sub_transactions')
        .select('*')
        .order('date', { ascending: false })
    ]);

    if (!entriesRes.error && entriesRes.data) {
      this.ledgerEntries.set(entriesRes.data as LedgerEntry[]);
    } else {
      console.warn('Could not fetch ledger entries', entriesRes.error);
      this.ledgerEntries.set([]);
    }

    if (!subsRes.error && subsRes.data) {
      this.subTransactions.set(subsRes.data as LedgerSubTransaction[]);
    } else {
      console.warn('Could not fetch ledger sub-transactions', subsRes.error);
      this.subTransactions.set([]);
    }
    this.isLoading.set(false);
  }

  openBottomSheet(entry?: LedgerEntry) {
    if (entry) {
      this.editingEntry.set(entry);
    } else {
      this.editingEntry.set(null);
    }
    this.isBottomSheetOpen.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeBottomSheet() {
    this.isBottomSheetOpen.set(false);
    this.document.body.classList.remove('overflow-hidden');
    setTimeout(() => this.editingEntry.set(null), 300); // Clear after animation
  }

  openSubBottomSheet(parent: LedgerEntry, sub?: LedgerSubTransaction) {
    this.activeLedgerForSub.set(parent);
    if (sub) {
      this.editingSubEntry.set(sub);
    } else {
      this.editingSubEntry.set(null);
    }
    this.isSubBottomSheetOpen.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeSubBottomSheet() {
    this.isSubBottomSheetOpen.set(false);
    this.document.body.classList.remove('overflow-hidden');
    setTimeout(() => {
      this.activeLedgerForSub.set(null);
      this.editingSubEntry.set(null);
    }, 300); // Clear after animation
  }

  async addEntry(entry: Omit<LedgerEntry, 'id' | 'user_id'>): Promise<boolean> {
    const user = this.authService.currentUser();
    if (!user) return false;

    const { data, error } = await this.supabaseService.client
      .from('ledger_entries')
      .insert({
        user_id: user.id,
        person_name: entry.person_name,
        amount: entry.amount,
        type: entry.type,
        purpose: entry.purpose,
        date: entry.date,
        created_at: entry.created_at || new Date().toISOString()
      })
      .select()
      .single();

    if (!error && data) {
      this.ledgerEntries.update((entries) => {
        const updated = [data as LedgerEntry, ...entries];
        return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      this.toastService.showSuccess('Record added ✓');
      return true;
    } else {
      console.error('Error adding ledger entry', error);
      this.toastService.showError('Couldn\'t save. Try again?');
      return false;
    }
  }

  async updateEntry(id: string, entry: Partial<LedgerEntry>): Promise<boolean> {
    const { data, error } = await this.supabaseService.client
      .from('ledger_entries')
      .update({
        person_name: entry.person_name,
        amount: entry.amount,
        type: entry.type,
        purpose: entry.purpose,
        date: entry.date,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      this.ledgerEntries.update((entries) => {
        const index = entries.findIndex((e) => e.id === id);
        if (index > -1) {
          const next = [...entries];
          next[index] = data as LedgerEntry;
          return next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return entries;
      });
      this.toastService.showSuccess('Record updated ✓');
      return true;
    } else {
      console.error('Error updating ledger entry', error);
      this.toastService.showError('Couldn\'t update. Try again?');
      return false;
    }
  }

  async deleteEntry(id: string): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from('ledger_entries')
      .delete()
      .eq('id', id);

    if (!error) {
      this.ledgerEntries.update((entries) => entries.filter((e) => e.id !== id));
      // Delete any local sub-transactions linked to this parent
      this.subTransactions.update((subs) => subs.filter((s) => s.ledger_id !== id));
      this.toastService.showSuccess('Record deleted');
      return true;
    } else {
      console.error('Error deleting ledger entry', error);
      this.toastService.showError('Couldn\'t delete. Try again?');
      return false;
    }
  }

  async addSubEntry(entry: Omit<LedgerSubTransaction, 'id'>): Promise<boolean> {
    const { data, error } = await this.supabaseService.client
      .from('ledger_sub_transactions')
      .insert({
        ledger_id: entry.ledger_id,
        amount: entry.amount,
        type: entry.type,
        purpose: entry.purpose,
        date: entry.date,
        created_at: entry.created_at || new Date().toISOString()
      })
      .select()
      .single();

    if (!error && data) {
      this.subTransactions.update((subs) => {
        const updated = [data as LedgerSubTransaction, ...subs];
        return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      this.toastService.showSuccess('Payment recorded ✓');
      return true;
    } else {
      console.error('Error adding ledger sub transaction', error);
      this.toastService.showError('Couldn\'t save payment. Try again?');
      return false;
    }
  }

  async updateSubEntry(id: string, entry: Partial<LedgerSubTransaction>): Promise<boolean> {
    const { data, error } = await this.supabaseService.client
      .from('ledger_sub_transactions')
      .update({
        amount: entry.amount,
        type: entry.type,
        purpose: entry.purpose,
        date: entry.date,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      this.subTransactions.update((subs) => {
        const index = subs.findIndex((s) => s.id === id);
        if (index > -1) {
          const next = [...subs];
          next[index] = data as LedgerSubTransaction;
          return next.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return subs;
      });
      this.toastService.showSuccess('Payment updated ✓');
      return true;
    } else {
      console.error('Error updating ledger sub transaction', error);
      this.toastService.showError('Couldn\'t update payment. Try again?');
      return false;
    }
  }

  async deleteSubEntry(id: string): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from('ledger_sub_transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      this.subTransactions.update((subs) => subs.filter((s) => s.id !== id));
      this.toastService.showSuccess('Payment removed');
      return true;
    } else {
      console.error('Error deleting ledger sub transaction', error);
      this.toastService.showError('Couldn\'t delete payment. Try again?');
      return false;
    }
  }
}
