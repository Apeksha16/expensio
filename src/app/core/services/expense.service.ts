import { Injectable, signal, computed, Inject, effect, inject, untracked, Injector } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { GoalService } from './goal.service';
import { BudgetService } from './budget.service';
import { AccountTrackerService } from './account-tracker.service';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  goal_id?: string;
  subscription_id?: string;
  paid_via?: 'Cash' | 'Credit Card' | 'UPI';
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private injector = inject(Injector);

  readonly isLoading = signal(false);
  readonly hasInitiallyLoaded = signal(false);

  constructor(@Inject(DOCUMENT) private document: Document) {
    effect(() => {
      const user = this.authService.currentUser();
      const month = this.activeMonth(); // Track month changes
      if (user) {
        untracked(() => {
          this.fetchExpenses(month);
          this.setupRealtime(month);
        });
      } else {
        this.allExpenses.set([]);
        this.monthlyCache.clear();
        this.applyFilterAndPagination();
        this.hasInitiallyLoaded.set(true);
        if (this.realtimeChannel) {
          this.supabaseService.client.removeChannel(this.realtimeChannel);
          this.realtimeChannel = null;
        }
      }
    });

    // Auto-refresh activeMonth when app comes back to foreground (handles midnight rollover)
    this.document.addEventListener('visibilitychange', () => {
      if ((this.document as any).visibilityState === 'visible') {
        const current = this.getCurrentMonthString();
        if (current !== this.activeMonth()) {
          this.setMonthFilter(current);
        }
      }
    });
  }

  // All expenses in memory — public for GoalService and Goals page access
  readonly allExpenses = signal<Expense[]>([]);

  // Filtering & Pagination State
  readonly activeMonth = signal<string>(this.getCurrentMonthString()); // Format: 'YYYY-MM'
  readonly currentPage = signal<number>(1);
  readonly pageSize = 15;
  readonly hasMore = signal<boolean>(true);

  // The displayed expenses
  readonly expenses = signal<Expense[]>([]);
  readonly monthlyTotalSpend = computed(() => {
    return this.allExpenses().reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  });

  readonly salaryTotalSpend = computed(() => {
    return this.allExpenses()
      .filter((e) => (e.paid_via || 'UPI') !== 'Cash')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  });

  readonly cashTotalSpend = computed(() => {
    return this.allExpenses()
      .filter((e) => e.paid_via === 'Cash')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  });
  
  // Global bottom sheet state
  readonly isBottomSheetOpen = signal(false);
  readonly editingExpense = signal<Expense | null>(null);

  getCurrentMonthString() {
    const d = new Date();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }

  private monthlyCache = new Map<string, Expense[]>();
  private realtimeChannel: any = null;
  private fetchDebounceTimeout: any = null;

  private setupRealtime(monthStr: string) {
    const user = this.authService.currentUser();
    if (!user) return;

    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
    }
    
    this.realtimeChannel = this.supabaseService.client.channel('public:expenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `user_id=eq.${user.id}` }, () => {
        if (this.fetchDebounceTimeout) clearTimeout(this.fetchDebounceTimeout);
        this.fetchDebounceTimeout = setTimeout(() => {
          this.fetchExpenses(this.activeMonth(), true);
        }, 150);
      })
      .subscribe();
  }

  async fetchExpenses(monthStr?: string, force = false) {
    this.isLoading.set(true);
    const month = monthStr || this.activeMonth();

    const [year, m] = month.split('-');
    const localStart = new Date(parseInt(year), parseInt(m) - 1, 1);
    const localEnd = new Date(parseInt(year), parseInt(m), 1);
    
    const startDate = localStart.toISOString();
    const nextMonthStr = localEnd.toISOString();

    if (!force && this.monthlyCache.has(month)) {
      this.allExpenses.set(this.monthlyCache.get(month)!);
      this.applyFilterAndPagination();
      this.hasInitiallyLoaded.set(true);
      this.isLoading.set(false);
      return;
    }

    const [
      { data: expensesData, error: expensesError },
      { data: splitsData, error: splitsError },
      { data: spendData, error: spendError }
    ] = await Promise.all([
      this.supabaseService.client
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lt('date', nextMonthStr),
      this.supabaseService.client
        .from('split_expenses')
        .select('*')
        .gte('date', startDate)
        .lt('date', nextMonthStr),
      this.supabaseService.client
        .rpc('calculate_monthly_spend', {
          p_user_id: this.authService.currentUser()?.id,
          p_month: month
        })
    ]);

    let all: Expense[] = [];

    if (!expensesError && expensesData) {
      all = [...(expensesData as Expense[])];
    }

    if (!splitsError && splitsData) {
      const currentUserId = this.authService.currentUser()?.id;
      const mappedSplits: Expense[] = splitsData
        .filter((s: any) => s.category !== 'Settlement' && s.category !== 'Pending Settlement')
        .map((s: any) => {
          const myParticipant = s.participants?.find((p: any) => p.userId === currentUserId);
          if (myParticipant && myParticipant.amountOwed > 0) {
            const notation = s.group_id ? '(Group Split)' : '(Split)';
            const mappedCategory = s.category ? `${s.category} ${notation}` : `Split Expense ${notation}`;

            return {
              id: `split_${s.id}`,
              title: s.title,
              amount: myParticipant.amountOwed,
              category: mappedCategory,
              date: s.date,
              paid_via: s.paid_via
            };
          }
          return null;
        })
        .filter((x: any) => x !== null) as Expense[];
        
      all = [...all, ...mappedSplits];
    }

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Limit cache to 12 months to prevent unbounded memory growth
    if (this.monthlyCache.size >= 12) {
      const firstKey = this.monthlyCache.keys().next().value;
      if (firstKey) this.monthlyCache.delete(firstKey);
    }
    this.monthlyCache.set(month, all);

    this.allExpenses.set(all);
    this.applyFilterAndPagination();
    this.hasInitiallyLoaded.set(true);
    this.isLoading.set(false);
  }

  async refreshExpenses(monthStr?: string) {
    this.monthlyCache.clear();
    await this.fetchExpenses(monthStr);
  }

  setMonthFilter(monthStr: string) {
    this.activeMonth.set(monthStr);
    this.currentPage.set(1);
    // fetchExpenses is automatically called by the effect
  }

  loadMore() {
    if (!this.hasMore()) return;
    this.currentPage.update(p => p + 1);
    this.applyFilterAndPagination();
  }

  private applyFilterAndPagination() {
    const month = this.activeMonth();
    const filtered = this.allExpenses().filter(e => {
      const d = new Date(e.date);
      const mStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      return mStr === month;
    });
    
    const limit = this.currentPage() * this.pageSize;
    this.hasMore.set(filtered.length > limit);
    
    this.expenses.set(filtered.slice(0, limit));
  }

  openBottomSheet(expense?: Expense) {
    if (expense) {
      this.editingExpense.set(expense);
    } else {
      this.editingExpense.set(null);
    }
    this.isBottomSheetOpen.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeBottomSheet() {
    this.isBottomSheetOpen.set(false);
    this.document.body.classList.remove('overflow-hidden');
    setTimeout(() => this.editingExpense.set(null), 300); // Clear after animation
  }

  async addExpense(expense: Omit<Expense, 'id'>, silent = false): Promise<boolean> {
    const user = this.authService.currentUser();
    if (!user) return false;

    const { data, error } = await this.supabaseService.client
      .from('expenses')
      .insert({
        user_id: user.id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        paid_via: expense.paid_via || 'UPI',
        goal_id: expense.goal_id || null,
        subscription_id: expense.subscription_id || null
      })
      .select()
      .single();

    if (!error && data) {
      const currentMonth = this.activeMonth();
      const exps = this.allExpenses();
      const updated = [data as Expense, ...exps];
      updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      this.allExpenses.set(updated);
      this.monthlyCache.set(currentMonth, updated); // Specific cache update
      this.applyFilterAndPagination();

      if (!silent) {
        this.toastService.showSuccess('Expense added successfully.');
      }
      return true;
    }
    
    if (error) {
      console.error('Supabase addExpense error:', error);
      this.toastService.showError("Couldn't add expense. Please try again.");
    }
    return false;
  }

  async updateExpense(id: string, data: Omit<Expense, 'id'>, silent = false): Promise<boolean> {
    // Guard: split expenses must be edited from the Splits page
    if (id.startsWith('split_')) {
      this.toastService.showError('This expense can only be edited from Splits.');
      return false;
    }
    
    const oldExpense = this.allExpenses().find(e => e.id === id);

    const { error } = await this.supabaseService.client
      .from('expenses')
      .update({
        title: data.title,
        amount: data.amount,
        category: data.category,
        date: data.date,
        paid_via: data.paid_via || 'UPI'
      })
      .eq('id', id);

    if (!error) {
      const currentMonth = this.activeMonth();
      const exps = this.allExpenses();
      const updated = exps.map(exp => exp.id === id ? { ...exp, ...data } : exp);
      updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      this.allExpenses.set(updated);
      this.monthlyCache.set(currentMonth, updated); // Specific cache update
      this.applyFilterAndPagination();

      // Goal Progress Sync is now handled atomically by the trg_sync_goal_progress Postgres trigger

      if (!silent) {
        this.toastService.showSuccess('Expense updated successfully.');
      }
      return true;
    }
    this.toastService.showError("Couldn't update expense. Please try again.");
    return false;
  }

  async updateExpensesForGoalRename(oldName: string, newName: string): Promise<boolean> {
    const oldTitleWithPrefix = `Goal: ${oldName}`;
    const oldTitleWithoutPrefix = oldName;
    const newTitle = newName;
    
    // First update expenses with the 'Goal: ' prefix
    await this.supabaseService.client
      .from('expenses')
      .update({ title: newTitle })
      .eq('title', oldTitleWithPrefix)
      .eq('category', 'virtual-invest');

    // Then update expenses without the prefix
    const { error } = await this.supabaseService.client
      .from('expenses')
      .update({ title: newTitle })
      .eq('title', oldTitleWithoutPrefix)
      .eq('category', 'virtual-invest');

    if (!error) {
      const currentMonth = this.activeMonth();
      const updated = this.allExpenses().map(exp => {
        if ((exp.title === oldTitleWithPrefix || exp.title === oldTitleWithoutPrefix) && exp.category === 'virtual-invest') {
          return { ...exp, title: newTitle };
        }
        return exp;
      });
      this.allExpenses.set(updated);
      this.monthlyCache.set(currentMonth, updated); // Specific cache update
      this.applyFilterAndPagination();
      return true;
    }
    return false;
  }

  async deleteExpense(id: string): Promise<boolean> {
    // Guard: split expenses must be deleted from the Splits page
    if (id.startsWith('split_')) {
      this.toastService.showError('This expense can only be deleted from Splits.');
      return false;
    }

    const expense = this.allExpenses().find(e => e.id === id);

    const { error } = await this.supabaseService.client
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      this.toastService.showError("Couldn't delete expense. Please try again.");
      return false;
    } else {
      this.toastService.showSuccess('Expense deleted successfully.');
      
      // Note: If expense had a subscription_id, the trg_sync_subscription_status
      // trigger in Postgres will automatically reset the subscription's last_paid_month.

      // We still update local state optimistically.
      this.allExpenses.update(expenses => expenses.filter(e => e.id !== id));
      this.applyFilterAndPagination();
      this.monthlyCache.set(this.activeMonth(), this.allExpenses());
      return true;
    }
  }

  getConsumedForCategory(category: string): number {
    const month = this.activeMonth();
    const catLower = category.toLowerCase().trim();
    return this.allExpenses()
      .filter(e => {
        const d = new Date(e.date);
        const mStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        if (mStr !== month) return false;
        
        const eCat = e.category.toLowerCase();
        // Exact match or matches the category name immediately followed by a space and parenthetical string
        // E.g. "Food" matches "food (split)", "food (subscription)", etc.
        return eCat === catLower || eCat.startsWith(`${catLower} (`);
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }
}

