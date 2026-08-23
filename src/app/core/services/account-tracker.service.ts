import { Injectable, signal, computed, effect, inject, untracked } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export type AccountType = 'Salary' | 'Cash' | 'Savings';
export type TransactionType = 'Income' | 'Expense' | 'Transfer' | 'Rollover';

export interface UserAccount {
  id: string;
  user_id: string;
  account_type: AccountType;
  balance: number;
  updated_at?: string;
}

export interface AccountTransaction {
  id: string;
  user_id: string;
  account_type: AccountType;
  transaction_type: TransactionType;
  amount: number;
  month: string; // 'YYYY-MM'
  description?: string;
  target_account_type?: AccountType;
  date: string;
  created_at?: string;
}

export interface AccountRollover {
  id: string;
  user_id: string;
  month: string; // 'YYYY-MM'
  salary_remaining: number;
  rolled_over_amount: number;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountTrackerService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  readonly isLoading = signal(false);
  readonly activeMonth = signal<string>(this.getCurrentMonthString());
  readonly accounts = signal<UserAccount[]>([]);
  readonly transactions = signal<AccountTransaction[]>([]);
  readonly rollovers = signal<AccountRollover[]>([]);

  // Computed accounts
  readonly salaryAccount = computed(() => this.accounts().find(a => a.account_type === 'Salary'));
  readonly cashAccount = computed(() => this.accounts().find(a => a.account_type === 'Cash'));
  readonly savingsAccount = computed(() => this.accounts().find(a => a.account_type === 'Savings'));

  readonly salaryBalance = computed(() => this.salaryAccount()?.balance ?? 0);
  readonly cashBalance = computed(() => this.cashAccount()?.balance ?? 0);
  readonly savingsBalance = computed(() => this.savingsAccount()?.balance ?? 0);
  readonly totalBalance = computed(() => this.salaryBalance() + this.cashBalance() + this.savingsBalance());

  readonly salarySpentThisMonth = computed(() => {
    return this.transactions()
      .filter(t => t.account_type === 'Salary' && t.transaction_type === 'Expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  });

  readonly cashSpentThisMonth = computed(() => {
    return this.transactions()
      .filter(t => t.account_type === 'Cash' && t.transaction_type === 'Expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  });

  // Bottom Sheet State
  readonly isSheetOpen = signal(false);
  readonly sheetMode = signal<'deposit' | 'withdrawal' | 'transfer' | 'adjust'>('deposit');
  readonly selectedAccountType = signal<AccountType>('Salary');

  private realtimeChannel: any = null;
  private userAccountsTableAvailable = true;
  private fetchDebounceTimeout: any = null;

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      const month = this.activeMonth();
      if (user) {
        untracked(() => {
          this.fetchTrackerData(month);
          this.setupRealtime();
        });
      } else {
        this.accounts.set([]);
        this.transactions.set([]);
        this.rollovers.set([]);
        if (this.realtimeChannel) {
          this.supabaseService.client.removeChannel(this.realtimeChannel);
          this.realtimeChannel = null;
        }
        if (this.fetchDebounceTimeout) {
          clearTimeout(this.fetchDebounceTimeout);
        }
      }
    });
  }

  getCurrentMonthString(): string {
    const d = new Date();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }

  setMonthFilter(monthStr: string) {
    this.activeMonth.set(monthStr);
  }

  debouncedFetchTrackerData() {
    if (this.fetchDebounceTimeout) {
      clearTimeout(this.fetchDebounceTimeout);
    }
    this.fetchDebounceTimeout = setTimeout(() => {
      void this.fetchTrackerData();
    }, 500); // 500ms debounce
  }

  async fetchTrackerData(monthStr?: string) {
    this.isLoading.set(true);
    const user = this.authService.currentUser();
    if (!user) return;

    const month = monthStr || this.activeMonth();

    try {
      // 1. Fetch Accounts (prefer the cached account table when available)
      let { data: accountsData, error: accountsErr } = await this.supabaseService.client
        .from('user_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (accountsErr) {
        const message = String((accountsErr as any)?.message || accountsErr);
        if (message.includes('Could not find the table') || message.includes('schema cache')) {
          this.userAccountsTableAvailable = false;
          accountsData = null;
          if (this.realtimeChannel) {
            this.supabaseService.client.removeChannel(this.realtimeChannel);
            this.realtimeChannel = null;
          }
        } else {
          throw accountsErr;
        }
      }

      if (this.userAccountsTableAvailable) {
        // Ensure all 3 default accounts exist
        if (!accountsData || accountsData.length < 3) {
          accountsData = await this.initializeDefaultAccounts(user.id, accountsData || []);
        }

        this.accounts.set(accountsData as UserAccount[]);
      } else {
        const { data: txHistory, error: txHistoryErr } = await this.supabaseService.client
          .from('account_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (txHistoryErr) {
          this.accounts.set(this.buildFallbackAccounts([]));
        } else {
          this.accounts.set(this.buildFallbackAccounts(txHistory || []));
        }
      }

      // 2. Fetch Transactions for active month
      const { data: txData, error: txErr } = await this.supabaseService.client
        .from('account_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month)
        .order('date', { ascending: false });

      if (txErr) {
        this.transactions.set([]);
      } else {
        this.transactions.set((txData || []) as AccountTransaction[]);
      }

      // 3. Fetch Rollovers for active month
      const { data: rolloverData, error: rollErr } = await this.supabaseService.client
        .from('account_rollovers')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', month);

      if (rollErr) {
        this.rollovers.set([]);
      } else {
        this.rollovers.set((rolloverData || []) as AccountRollover[]);
      }

    } catch (err: any) {
      const msg = String(err?.message || err);
      if (!msg.includes('Could not find the table') && !msg.includes('schema cache')) {
        console.error('Error fetching tracker data:', err);
        this.toastService.show(err.message || 'Failed to load tracker data', 'error');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  private async initializeDefaultAccounts(userId: string, existing: any[]): Promise<UserAccount[]> {
    const requiredTypes: AccountType[] = ['Salary', 'Cash', 'Savings'];
    const existingTypes = existing.map((a: any) => a.account_type);

    const userProfileSalary = this.authService.userProfile()?.salary || 0;

    const toInsert = requiredTypes
      .filter(type => !existingTypes.includes(type))
      .map(type => ({
        user_id: userId,
        account_type: type,
        // Default salary account balance to user's registered monthly salary if available
        balance: type === 'Salary' ? userProfileSalary : 0
      }));

    if (toInsert.length > 0) {
      const { data: inserted, error } = await this.supabaseService.client
        .from('user_accounts')
        .insert(toInsert)
        .select('*');

      if (!error && inserted) {
        return [...existing, ...inserted] as UserAccount[];
      }
    }
    return existing as UserAccount[];
  }

  private getStoredFallbackBalances(): Record<AccountType, number> {
    const salaryBase = this.authService.userProfile()?.salary || 0;
    try {
      const stored = localStorage.getItem('expensio_account_balances');
      if (stored) {
        const p = JSON.parse(stored);
        return {
          Salary: typeof p.salary === 'number' ? p.salary : salaryBase,
          Cash: typeof p.cash === 'number' ? p.cash : 0,
          Savings: typeof p.savings === 'number' ? p.savings : 0,
        };
      }
    } catch (e) {}
    return { Salary: salaryBase, Cash: 0, Savings: 0 };
  }

  private buildFallbackAccounts(transactions: AccountTransaction[]): UserAccount[] {
    const balances = this.getStoredFallbackBalances();

    const orderedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date || a.created_at || 0).getTime() - new Date(b.date || b.created_at || 0).getTime(),
    );

    for (const tx of orderedTransactions) {
      if (tx.transaction_type === 'Income') {
        balances[tx.account_type] += tx.amount;
      } else if (tx.transaction_type === 'Expense') {
        balances[tx.account_type] -= tx.amount;
      } else if (tx.transaction_type === 'Transfer' && tx.target_account_type) {
        balances[tx.account_type] -= tx.amount;
        balances[tx.target_account_type] += tx.amount;
      } else if (tx.transaction_type === 'Rollover') {
        balances.Salary -= tx.amount;
        balances.Savings += tx.amount;
      }
    }

    return (['Salary', 'Cash', 'Savings'] as AccountType[]).map((accountType) => ({
      id: `fallback-${accountType.toLowerCase()}`,
      user_id: this.authService.currentUser()?.id || '',
      account_type: accountType,
      balance: balances[accountType],
      updated_at: new Date().toISOString(),
    }));
  }

  // Check if month-end rollover was already completed for current month
  currentMonthRollover = computed(() => {
    const month = this.activeMonth();
    return this.rollovers().find(r => r.month === month);
  });

  // Calculate potential salary surplus for active month
  salarySurplusForActiveMonth = computed(() => {
    const salaryAcc = this.salaryAccount();
    if (!salaryAcc) return 0;
    return salaryAcc.balance;
  });

  openBottomSheet(mode: 'deposit' | 'withdrawal' | 'transfer' | 'adjust' = 'deposit', defaultType: AccountType = 'Salary') {
    this.sheetMode.set(mode);
    this.selectedAccountType.set(defaultType);
    this.isSheetOpen.set(true);
  }

  closeBottomSheet() {
    this.isSheetOpen.set(false);
  }

  async addTransaction(params: {
    account_type: AccountType;
    transaction_type: TransactionType;
    amount: number;
    description?: string;
    target_account_type?: AccountType;
    date?: string;
  }) {
    const user = this.authService.currentUser();
    if (!user) return;

    if (params.amount <= 0) {
      this.toastService.show('Amount must be greater than zero', 'error');
      return;
    }

    const month = this.activeMonth();
    const txDate = params.date || new Date().toISOString();

    try {
      this.isLoading.set(true);

      // Insert transaction record. The database trigger will automatically update account balances.
      const { error: txErr } = await this.supabaseService.client
        .from('account_transactions')
        .insert({
          user_id: user.id,
          account_type: params.account_type,
          transaction_type: params.transaction_type,
          amount: params.amount,
          month: month,
          description: params.description || `${params.transaction_type} to ${params.account_type}`,
          target_account_type: params.target_account_type || null,
          date: txDate
        });

      if (txErr) throw txErr;

      this.toastService.show('Transaction added successfully!', 'success');
      this.closeBottomSheet();
      await this.fetchTrackerData(month);

    } catch (err: any) {
      console.error('Error adding transaction:', err);
      this.toastService.show(err.message || 'Failed to add transaction', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async executeMonthEndRollover() {
    const user = this.authService.currentUser();
    if (!user) return;

    const month = this.activeMonth();
    const salaryAcc = this.salaryAccount();
    const savingsAcc = this.savingsAccount();

    if (!salaryAcc || !savingsAcc) {
      this.toastService.show('Salary and Savings accounts must be initialized', 'error');
      return;
    }

    const remainingAmount = salaryAcc.balance;

    if (remainingAmount <= 0) {
      this.toastService.show('No remaining salary balance to roll over into savings', 'error');
      return;
    }

    try {
      this.isLoading.set(true);

      // 1. Insert Rollover Record
      const { error: rollErr } = await this.supabaseService.client
        .from('account_rollovers')
        .upsert({
          user_id: user.id,
          month: month,
          salary_remaining: remainingAmount,
          rolled_over_amount: remainingAmount
        }, { onConflict: 'user_id,month' });

      if (rollErr) throw rollErr;

      // 2. Insert Transfer Transaction. The DB trigger handles the balance update.
      const { error: txErr } = await this.supabaseService.client
        .from('account_transactions')
        .insert({
          user_id: user.id,
          account_type: 'Salary',
          transaction_type: 'Rollover',
          amount: remainingAmount,
          month: month,
          description: `Month-End Surplus Salary Rollover to Savings (${month})`,
          target_account_type: 'Savings',
          date: new Date().toISOString()
        });

      if (txErr) throw txErr;

      this.toastService.show(
        `Rolled over remaining ₹${remainingAmount.toLocaleString()} from Salary into Savings! 🎉`,
        'success'
      );

      await this.fetchTrackerData(month);

    } catch (err: any) {
      console.error('Error executing month-end rollover:', err);
      this.toastService.show(err.message || 'Failed to execute month-end rollover', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  async recordExpensePayment(paidVia: string, amount: number, title: string, dateStr?: string) {
    const accountType: AccountType = paidVia === 'Cash' ? 'Cash' : 'Salary';
    const month = this.activeMonth();

    // Update in-memory signal state and localStorage balance immediately
    const balances = this.getStoredFallbackBalances();
    if (accountType === 'Cash') {
      balances.Cash -= amount;
    } else {
      balances.Salary -= amount;
    }

    try {
      localStorage.setItem('expensio_account_balances', JSON.stringify(balances));
    } catch (e) {}

    this.accounts.update((accs) =>
      accs.map((a) =>
        a.account_type === accountType
          ? { ...a, balance: a.balance - amount }
          : a,
      ),
    );

    try {
      await this.updateAccountBalance(accountType, -amount);

      const user = this.authService.currentUser();
      if (user) {
        await this.supabaseService.client.from('account_transactions').insert({
          user_id: user.id,
          account_type: accountType,
          transaction_type: 'Expense',
          amount: amount,
          month: month,
          description: `Expense: ${title} (Paid via ${paidVia || 'UPI'})`,
          date: dateStr || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error recording expense payment in account tracker:', err);
    }
  }

  async revertExpensePayment(paidVia: string, amount: number, title: string) {
    const accountType: AccountType = paidVia === 'Cash' ? 'Cash' : 'Salary';
    try {
      await this.updateAccountBalance(accountType, amount);
      await this.fetchTrackerData();
    } catch (err) {
      console.error('Error reverting expense payment in account tracker:', err);
    }
  }

  async setInitialBalances(salaryAmount: number, cashAmount: number, savingsAmount: number) {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      this.isLoading.set(true);

      // Save locally to localStorage for instant fallback persistence
      try {
        localStorage.setItem(
          'expensio_account_balances',
          JSON.stringify({ salary: salaryAmount, cash: cashAmount, savings: savingsAmount }),
        );
      } catch (e) {}

      // Immediately update signal state
      const uid = user.id;
      this.accounts.set([
        { id: 'acc_salary', user_id: uid, account_type: 'Salary', balance: salaryAmount },
        { id: 'acc_cash', user_id: uid, account_type: 'Cash', balance: cashAmount },
        { id: 'acc_savings', user_id: uid, account_type: 'Savings', balance: savingsAmount },
      ]);

      if (!this.userAccountsTableAvailable) {
        const baseDate = new Date().toISOString();
        const initialBalances = [
          { account_type: 'Salary' as AccountType, amount: salaryAmount },
          { account_type: 'Cash' as AccountType, amount: cashAmount },
          { account_type: 'Savings' as AccountType, amount: savingsAmount },
        ];

        for (const item of initialBalances) {
          if (item.amount <= 0) continue;

          await this.supabaseService.client.from('account_transactions').insert({
            user_id: user.id,
            account_type: item.account_type,
            transaction_type: 'Income',
            amount: item.amount,
            month: this.activeMonth(),
            description: `Initial balance setup for ${item.account_type}`,
            date: baseDate,
          });
        }

        return;
      }

      const updates = [
        { type: 'Salary' as AccountType, bal: salaryAmount },
        { type: 'Cash' as AccountType, bal: cashAmount },
        { type: 'Savings' as AccountType, bal: savingsAmount },
      ];

      for (const item of updates) {
        const existingAcc = this.accounts().find((a) => a.account_type === item.type);
        if (existingAcc && existingAcc.id && !existingAcc.id.startsWith('acc_')) {
          await this.supabaseService.client
            .from('user_accounts')
            .update({ balance: item.bal, updated_at: new Date().toISOString() })
            .eq('id', existingAcc.id);
        } else {
          await this.supabaseService.client.from('user_accounts').upsert(
            {
              user_id: user.id,
              account_type: item.type,
              balance: item.bal,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,account_type' },
          );
        }
      }

      await this.fetchTrackerData();
    } catch (err: any) {
      console.error('Error setting initial balances:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async updateAccountBalance(accountType: AccountType, delta: number) {
    if (!this.userAccountsTableAvailable) {
      return;
    }

    const user = this.authService.currentUser();
    if (!user) return;

    const currentAcc = this.accounts().find(a => a.account_type === accountType);
    if (!currentAcc) return;

    const newBalance = (currentAcc.balance || 0) + delta;

    const { error } = await this.supabaseService.client
      .from('user_accounts')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', currentAcc.id);

    if (error) throw error;
  }

  private setupRealtime() {
    const user = this.authService.currentUser();
    if (!user) return;

    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
    }

    const channel = this.supabaseService.client.channel('public:account_tracker_realtime');

    if (this.userAccountsTableAvailable) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_accounts', filter: `user_id=eq.${user.id}` },
        () => this.debouncedFetchTrackerData()
      );
    }

    this.realtimeChannel = channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'account_transactions', filter: `user_id=eq.${user.id}` },
        () => this.debouncedFetchTrackerData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'account_rollovers', filter: `user_id=eq.${user.id}` },
        () => this.debouncedFetchTrackerData()
      )
      .subscribe();
  }
}
