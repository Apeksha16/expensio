import { Injectable, signal, computed, Inject, effect, inject, untracked, Injector } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { GoalService } from './goal.service';
import { BudgetService } from './budget.service';

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
        this.fetchExpenses(month);
      } else if (untracked(() => this.authService.isInitialized())) {
        this.allExpenses.set([]);
        this.monthlyCache.clear();
        this.applyFilterAndPagination();
        this.hasInitiallyLoaded.set(true);
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
  readonly monthlyTotalSpend = signal<number>(0);
  
  // Global bottom sheet state
  readonly isBottomSheetOpen = signal(false);
  readonly editingExpense = signal<Expense | null>(null);

  getCurrentMonthString() {
    const d = new Date();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }

  private monthlyCache = new Map<string, Expense[]>();

  async fetchExpenses(monthStr?: string) {
    this.isLoading.set(true);
    const month = monthStr || this.activeMonth();

    const [year, m] = month.split('-');
    const startDate = `${year}-${m}-01T00:00:00.000Z`;
    
    // Calculate the start of the next month
    const nextMDate = new Date(parseInt(year), parseInt(m), 1);
    const nextMonthStr = `${nextMDate.getFullYear()}-${(nextMDate.getMonth() + 1).toString().padStart(2, '0')}-01T00:00:00.000Z`;

    if (this.monthlyCache.has(month)) {
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

    if (!spendError && spendData !== null) {
      this.monthlyTotalSpend.set(Number(spendData));
    } else {
      this.monthlyTotalSpend.set(0);
    }

    let all: Expense[] = [];

    if (!expensesError && expensesData) {
      all = [...(expensesData as Expense[])];
    }

    if (!splitsError && splitsData) {
      const currentUserId = this.authService.currentUser()?.id;
      const mappedSplits: Expense[] = splitsData
        .filter((s: any) => s.title !== 'Settlement')
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
    const filtered = this.allExpenses().filter(e => e.date.startsWith(month));
    
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
      this.monthlyCache.clear(); // Invalidate cache on mutation
      this.allExpenses.update(exps => {
        const updated = [data as Expense, ...exps];
        return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
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
      this.monthlyCache.clear(); // Invalidate cache on mutation
      this.allExpenses.update(exps => {
        const updated = exps.map(exp => exp.id === id ? { ...exp, ...data } : exp);
        return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      this.applyFilterAndPagination();
      
      // Trigger Budget Rollover Sync for the new category/date
      const budgetService = this.injector.get(BudgetService);
      budgetService.syncRolloverForMonth(data.date, data.category);

      // Trigger Budget Rollover Sync for the old category/date if it changed
      if (oldExpense) {
        if (oldExpense.category !== data.category || oldExpense.date !== data.date) {
          budgetService.syncRolloverForMonth(oldExpense.date, oldExpense.category);
        }
      }

      // Trigger Goal Progress Sync
      if (data.category === 'virtual-invest' || oldExpense?.category === 'virtual-invest') {
        const goalService = this.injector.get(GoalService);
        const titleToSync = data.category === 'virtual-invest' ? data.title : oldExpense?.title;
        if (titleToSync) {
          goalService.recalculateSavedAmount(titleToSync);
        }
      }

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
      this.monthlyCache.clear(); // Invalidate cache
      this.allExpenses.update(exps => {
        return exps.map(exp => {
          if ((exp.title === oldTitleWithPrefix || exp.title === oldTitleWithoutPrefix) && exp.category === 'virtual-invest') {
            return { ...exp, title: newTitle };
          }
          return exp;
        });
      });
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

    if (!error) {
      this.monthlyCache.clear(); // Invalidate cache
      this.allExpenses.update(exps => exps.filter(exp => exp.id !== id));
      this.applyFilterAndPagination();
      
      if (expense) {
        // Trigger Budget Rollover Sync
        const budgetService = this.injector.get(BudgetService);
        budgetService.syncRolloverForMonth(expense.date, expense.category);
        
        // Trigger Goal Progress Sync
        if (expense.category === 'virtual-invest') {
          const goalService = this.injector.get(GoalService);
          goalService.recalculateSavedAmount(expense.title);
        }
        
        // Trigger Subscription Sync
        if (expense.subscription_id) {
          await this.supabaseService.client
            .from('subscriptions')
            .update({ last_paid_month: null })
            .eq('id', expense.subscription_id);
        }
      }

      this.toastService.showSuccess('Expense deleted successfully.');
      return true;
    }
    this.toastService.showError("Couldn't delete expense. Please try again.");
    return false;
  }

  getConsumedForCategory(category: string): number {
    const month = this.activeMonth();
    const catLower = category.toLowerCase();
    return this.allExpenses()
      .filter(e => {
        if (!e.date.startsWith(month)) return false;
        const eCat = e.category.toLowerCase();
        return eCat === catLower || eCat === `${catLower} (split)` || eCat === `${catLower} (group split)` || eCat === `${catLower} (subscription)`;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  }
}

