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
  readonly settlementData = signal<{ amount: number; type: 'in' | 'out' } | null>(null);

  private ledgerChannel: any = null;
  private subLedgerChannel: any = null;
  private fetchEntriesTimeout: any;

  // Computeds for convenience
  readonly totalReceived = computed(() => {
    // Sum of all negative outstanding balances (money I received)
    return this.ledgerEntries().reduce((sum, ledger) => {
      const bal = this.getLedgerBalance(ledger);
      return bal < 0 ? sum + Math.abs(bal) : sum;
    }, 0);
  });

  readonly totalGiven = computed(() => {
    // Sum of all positive outstanding balances (money I gave)
    return this.ledgerEntries().reduce((sum, ledger) => {
      const bal = this.getLedgerBalance(ledger);
      return bal > 0 ? sum + bal : sum;
    }, 0);
  });

  readonly netBalance = computed(() => this.totalReceived() - this.totalGiven());

  constructor(@Inject(DOCUMENT) private document: Document) {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        untracked(() => {
          this.fetchEntries();
          this.setupRealtime();
        });
      } else {
        this.ledgerEntries.set([]);
        this.subTransactions.set([]);
        if (this.ledgerChannel) {
          this.supabaseService.client.removeChannel(this.ledgerChannel);
          this.ledgerChannel = null;
        }
        if (this.subLedgerChannel) {
          this.supabaseService.client.removeChannel(this.subLedgerChannel);
          this.subLedgerChannel = null;
        }
      }
    });
  }

  getLedgerBalance(ledger: LedgerEntry): number {
    const subs = this.subTransactions().filter((s) => s.ledger_id === ledger.id);
    const parentVal = ledger.type === 'out' ? ledger.amount : -ledger.amount;
    const subsVal = subs.reduce((sum, s) => sum + (s.type === 'out' ? s.amount : -s.amount), 0);
    return parentVal + subsVal;
  }

  private setupRealtime() {
    if (!this.ledgerChannel) {
      this.ledgerChannel = this.supabaseService.client.channel('public:ledger_entries')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_entries' }, () => {
          this.triggerFetchEntries();
        })
        .subscribe();
    }

    if (!this.subLedgerChannel) {
      this.subLedgerChannel = this.supabaseService.client.channel('public:ledger_sub_transactions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ledger_sub_transactions' }, () => {
          this.triggerFetchEntries();
        })
        .subscribe();
    }
  }

  triggerFetchEntries() {
    if (this.fetchEntriesTimeout) clearTimeout(this.fetchEntriesTimeout);
    this.fetchEntriesTimeout = setTimeout(() => {
      this.fetchEntries();
    }, 100);
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

  openSubBottomSheetForSettlement(parent: LedgerEntry, amount: number, type: 'in' | 'out') {
    this.activeLedgerForSub.set(parent);
    this.settlementData.set({ amount, type });
    this.isSubBottomSheetOpen.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeSubBottomSheet() {
    this.isSubBottomSheetOpen.set(false);
    this.document.body.classList.remove('overflow-hidden');
    setTimeout(() => {
      this.activeLedgerForSub.set(null);
      this.editingSubEntry.set(null);
      this.settlementData.set(null);
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
      const msg = entry.type === 'in'
        ? `Payment received from ${entry.person_name} ₹${entry.amount}`
        : `Payment given to ${entry.person_name} ₹${entry.amount}`;
      this.toastService.showSuccess(msg);
      return true;
    } else {
      console.error('Error adding ledger entry:', error);
      this.toastService.showError('Couldn\'t save. Try again?');
      return false;
    }
  }

  async updateEntry(id: string, entry: Partial<LedgerEntry>): Promise<boolean> {
    const oldEntry = this.ledgerEntries().find((e) => e.id === id);
    const amountChanged = oldEntry && oldEntry.amount !== entry.amount;
    const typeChanged = oldEntry && oldEntry.type !== entry.type;

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
      let msg = 'Record updated ✓';
      if (amountChanged || typeChanged) {
        msg = entry.type === 'in'
          ? `Payment received from ${entry.person_name} ₹${entry.amount}`
          : `Payment given to ${entry.person_name} ₹${entry.amount}`;
      }
      this.toastService.showSuccess(msg);
      return true;
    } else {
      console.error('Error updating ledger entry:', error);
      this.toastService.showError('Couldn\'t update. Try again?');
      return false;
    }
  }

  async deleteEntry(id: string): Promise<boolean> {
    // First, delete all sub-transactions associated with this ledger account
    const { error: subsError } = await this.supabaseService.client
      .from('ledger_sub_transactions')
      .delete()
      .eq('ledger_id', id);

    if (subsError) {
      console.error('Error deleting associated transactions', subsError);
      this.toastService.showError('Couldn\'t delete associated transactions.');
      return false;
    }

    // Once sub-transactions are deleted, delete the main account record
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
      const parent = this.ledgerEntries().find((e) => e.id === entry.ledger_id);
      const personName = parent?.person_name || 'Person';
      const msg = entry.type === 'in'
        ? `Payment received from ${personName} ₹${entry.amount}`
        : `Payment given to ${personName} ₹${entry.amount}`;
      this.toastService.showSuccess(msg);
      return true;
    } else {
      console.error('Error adding ledger sub transaction:', error);
      this.toastService.showError('Couldn\'t save payment. Try again?');
      return false;
    }
  }

  async updateSubEntry(id: string, entry: Partial<LedgerSubTransaction>): Promise<boolean> {
    const oldSub = this.subTransactions().find((s) => s.id === id);
    const amountChanged = oldSub && oldSub.amount !== entry.amount;
    const typeChanged = oldSub && oldSub.type !== entry.type;

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
      
      const subEntry = data as LedgerSubTransaction;
      const parent = this.ledgerEntries().find((e) => e.id === subEntry.ledger_id);
      const personName = parent?.person_name || 'Person';
      let msg = 'Payment record updated ✓';
      if (amountChanged || typeChanged) {
        msg = entry.type === 'in'
          ? `Payment received from ${personName} ₹${entry.amount}`
          : `Payment given to ${personName} ₹${entry.amount}`;
      }
      this.toastService.showSuccess(msg);
      return true;
    } else {
      console.error('Error updating ledger sub transaction:', error);
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
