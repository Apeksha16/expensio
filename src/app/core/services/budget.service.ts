import { Injectable, signal, computed, inject, effect, untracked } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { ExpenseService } from './expense.service';
import { ToastService } from './toast.service';

export interface Budget {
  id: string;
  name: string;
  amount: number;
  icon_path: string;
  month: string;
  auto_rollover: boolean;
  rollover_amount?: number;
  created_at?: string;
}

export const DEFAULT_CATEGORIES = [
  { name: 'Food', path: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7' },
  { name: 'Transport', path: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2 M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z' },
  { name: 'Shopping', path: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0' },
  { name: 'Utilities', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
  { name: 'Entertain', path: 'M2 10h20 M8 2v4 M16 2v4 M2 14h20 M2 18h20 M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z' },
  { name: 'Health', path: 'M22 12h-4l-3 9L9 3l-3 9H2' },
  { name: 'Travel', path: 'M22 2 11 13 M22 2l-7 20-4-9-9-4Z' },
  { name: 'Other', path: 'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0' },
];

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private document = inject(DOCUMENT);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);

  private _budgetsCache = signal<Record<string, Budget[]>>({});
  readonly budgetsCache = this._budgetsCache.asReadonly();
  
  readonly budgets = computed(() => {
    const month = this.expenseService.activeMonth();
    const cache = this._budgetsCache();
    const list = cache[month] || [];
    const hasOthers = list.some(b => b.name.toLowerCase() === 'others' || b.name.toLowerCase() === 'other');
    if (hasOthers) return list;
    
    const virtualOthers: Budget = {
      id: 'virtual-others',
      name: 'Others',
      amount: 0,
      icon_path: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
      month: month,
      auto_rollover: false
    };
    
    return [...list, virtualOthers];
  });
  
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      const month = this.expenseService.activeMonth();
      if (user && month) {
        untracked(() => {
          this.fetchBudgets(month);
          this.setupRealtime(month);
        });
      } else {
        this._budgetsCache.set({});
        if (this.realtimeChannel) {
          this.supabaseService.client.removeChannel(this.realtimeChannel);
          this.realtimeChannel = null;
        }
      }
    });
  }
  
  // Global bottom sheet state
  readonly isBottomSheetOpen = signal(false);
  readonly editingBudget = signal<Budget | null>(null);

  private realtimeChannel: any = null;
  private fetchBudgetsTimeout: any;

  // Calculate the remaining budget available to allocate
  readonly remainingSalary = computed(() => {
    const monthlySalary = this.authService.userProfile().salary;
    const allocated = this.budgets().reduce((sum, b) => sum + b.amount, 0);
    return monthlySalary - allocated;
  });

  sortCategories<T extends {name: string}>(categories: T[]): T[] {
    return categories.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      const aIsOther = aName === 'others' || aName === 'other';
      const bIsOther = bName === 'others' || bName === 'other';
      
      if (aIsOther && !bIsOther) return 1;
      if (!aIsOther && bIsOther) return -1;
      
      return aName.localeCompare(bName);
    });
  }

  openBottomSheet(budget?: Budget) {
    if (budget) {
      this.editingBudget.set(budget);
    } else {
      this.editingBudget.set(null);
    }
    this.isBottomSheetOpen.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeBottomSheet() {
    this.isBottomSheetOpen.set(false);
    this.document.body.classList.remove('overflow-hidden');
    setTimeout(() => this.editingBudget.set(null), 300); // Clear after animation
  }

  private getMonthDateRange(monthStr: string) {
    const [year, m] = monthStr.split('-');
    const localStart = new Date(parseInt(year), parseInt(m) - 1, 1);
    const localEnd = new Date(parseInt(year), parseInt(m), 1);
    return { startDate: localStart.toISOString(), endDate: localEnd.toISOString() };
  }

  getCategoryIconPath(categoryName: string): string {
    const defaultPath = 'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0';
    if (!categoryName) return defaultPath;

    // Check if budget exists with this name (if loaded)
    const matchingBudget = this.budgets().find(b => b.name.toUpperCase() === categoryName.toUpperCase());
    if (matchingBudget && matchingBudget.icon_path) {
      return matchingBudget.icon_path;
    }

    const matchingDefault = DEFAULT_CATEGORIES.find(c => c.name.toUpperCase() === categoryName.toUpperCase());
    if (matchingDefault) return matchingDefault.path;
    
    return defaultPath;
  }

  getCategoryTheme(categoryName: string) {
    const cat = (categoryName || '').toUpperCase();
    if (cat.includes('SHOPPING')) return { bg: 'bg-orange-50', text: 'text-orange-600', tagBg: 'bg-orange-100' };
    if (cat.includes('FOOD') || cat.includes('DINING')) return { bg: 'bg-blue-50', text: 'text-blue-600', tagBg: 'bg-blue-100' };
    if (cat.includes('TRAVEL')) return { bg: 'bg-rose-50', text: 'text-rose-600', tagBg: 'bg-rose-100' };
    if (cat.includes('UTILITIES') || cat.includes('BILLS')) return { bg: 'bg-emerald-50', text: 'text-emerald-600', tagBg: 'bg-emerald-100' };
    if (cat.includes('ENTERTAIN')) return { bg: 'bg-pink-50', text: 'text-pink-600', tagBg: 'bg-pink-100' };
    if (cat.includes('TRANSPORT')) return { bg: 'bg-indigo-50', text: 'text-indigo-600', tagBg: 'bg-indigo-100' };
    if (cat.includes('HEALTH')) return { bg: 'bg-red-50', text: 'text-red-600', tagBg: 'bg-red-100' };
    return { bg: 'bg-purple-50', text: 'text-purple-600', tagBg: 'bg-purple-100' };
  }

  private activeFetchMonth = '';

  private setupRealtime(monthStr: string) {
    if (this.realtimeChannel) {
      this.supabaseService.client.removeChannel(this.realtimeChannel);
    }
    
    // We filter realtime events to only those affecting the current active month, 
    // to prevent unnecessary re-fetches if background tasks update other months
    this.realtimeChannel = this.supabaseService.client.channel('public:budgets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets', filter: `month=eq.${monthStr}` }, () => {
        this.triggerFetchBudgets(monthStr);
      })
      .subscribe();
  }

  triggerFetchBudgets(monthStr: string) {
    if (this.fetchBudgetsTimeout) clearTimeout(this.fetchBudgetsTimeout);
    this.fetchBudgetsTimeout = setTimeout(() => {
      this.fetchBudgets(monthStr);
    }, 100);
  }

  async fetchBudgets(monthStr: string, force = false) {
    const currentCache = untracked(() => this._budgetsCache());
    if (!force && currentCache[monthStr]) return;

    if (untracked(() => this.isLoading()) && this.activeFetchMonth === monthStr) return;
    this.activeFetchMonth = monthStr;
    this.isLoading.set(true);
    const { data, error } = await this.supabaseService.client
      .from('budgets')
      .select('*')
      .eq('month', monthStr)
      .order('created_at', { ascending: true });

    if (!error && data) {
      if (data.length === 0) {
        // Try to rollover from previous month safely via backend RPC
        const [year, m] = monthStr.split('-');
        let prevM = parseInt(m) - 1;
        let prevY = parseInt(year);
        if (prevM === 0) {
          prevM = 12;
          prevY -= 1;
        }
        const prevMonthStr = `${prevY}-${prevM.toString().padStart(2, '0')}`;
        
        const { error: rpcError } = await this.supabaseService.client.rpc('safely_rollover_budgets', {
          p_target_month: monthStr,
          p_prev_month: prevMonthStr
        });
          
        if (!rpcError) {
          // Re-fetch after potential rollover insertion
          const { data: refetchedData } = await this.supabaseService.client
            .from('budgets')
            .select('*')
            .eq('month', monthStr)
            .order('created_at', { ascending: true });
            
          this._budgetsCache.update(c => ({...c, [monthStr]: (refetchedData || []) as Budget[]}));
          this.isLoading.set(false);
          return;
        } else {
          // Fallback if RPC fails
          console.error("Budget rollover RPC failed", rpcError);
        }
      }
      this._budgetsCache.update(c => ({...c, [monthStr]: data as Budget[]}));
    } else {
      this._budgetsCache.update(c => ({...c, [monthStr]: []}));
    }
    this.isLoading.set(false);
  }

  async syncRolloverForMonth(expenseDateStr: string, category: string) {
    // Intentionally empty. Rollover calculations are no longer needed.
  }

  async addBudget(budget: Omit<Budget, 'id' | 'month'>): Promise<boolean> {
    const user = this.authService.currentUser();
    const month = this.expenseService.activeMonth();
    if (!user || !month) return false;

    // Prevent duplicate budget names for the same month
    const list = this._budgetsCache()[month] || [];
    const duplicate = list.find(
      b => b.name.toLowerCase() === budget.name.toLowerCase()
    );
    if (duplicate) {
      this.toastService.showError(`A budget already exists for this period.`);
      return false;
    }

    this.isSaving.set(true);
    const { data, error } = await this.supabaseService.client
      .from('budgets')
      .insert({
        user_id: user.id,
        name: budget.name,
        amount: budget.amount,
        icon_path: budget.icon_path,
        month: month,
        auto_rollover: budget.auto_rollover
      })
      .select()
      .single();

    if (!error && data) {
      this._budgetsCache.update(c => {
        const mList = c[month] || [];
        return { ...c, [month]: [...mList, data as Budget] };
      });
      this.toastService.showSuccess('Budget created successfully.');
    } else {
      this.toastService.showError("Couldn't create budget. Please try again.");
    }
    this.isSaving.set(false);
    return !error;
  }

  async updateBudget(id: string, data: Omit<Budget, 'id' | 'month'>, oldName?: string): Promise<boolean> {
    this.isSaving.set(true);
    const { error } = await this.supabaseService.client
      .from('budgets')
      .update({
        name: data.name,
        amount: data.amount,
        icon_path: data.icon_path,
        auto_rollover: data.auto_rollover
      })
      .eq('id', id);

    if (!error) {
      // Find the budget's month
      let targetMonth = this.expenseService.activeMonth();
      const currentCache = this._budgetsCache();
      for (const [m, list] of Object.entries(currentCache)) {
        if (list.find(b => b.id === id)) {
          targetMonth = m;
          break;
        }
      }
      // Budget rename cascading is now handled securely and atomically by the trg_cascade_budget_rename Postgres trigger.

      this._budgetsCache.update(c => {
        const next = { ...c };
        for (const [m, list] of Object.entries(next)) {
          if (list.find(b => b.id === id)) {
            next[m] = list.map(b => b.id === id ? { ...b, ...data } : b);
          }
        }
        return next;
      });
      this.toastService.showSuccess('Budget updated successfully.');
    } else {
      this.toastService.showError("Couldn't update budget. Please try again.");
    }
    this.isSaving.set(false);
    return !error;
  }

  async deleteBudget(id: string, budgetName: string): Promise<boolean> {
    this.isDeleting.set(true);
    const { error } = await this.supabaseService.client
      .from('budgets')
      .delete()
      .eq('id', id);

    if (!error) {
      // Find the budget's month
      let targetMonth = this.expenseService.activeMonth();
      const currentCache = this._budgetsCache();
      for (const [m, list] of Object.entries(currentCache)) {
        if (list.find(b => b.id === id)) {
          targetMonth = m;
          break;
        }
      }

      // Cascade the update to the expenses table for this month only
      const user = this.authService.currentUser();
      if (user) {
        const { startDate, endDate } = this.getMonthDateRange(targetMonth);
        await this.supabaseService.client
          .from('expenses')
          .update({ category: 'Others' })
          .eq('user_id', user.id)
          .eq('category', budgetName)
          .gte('date', startDate)
          .lt('date', endDate);
      }
      this._budgetsCache.update(c => {
        const next = { ...c };
        for (const [m, list] of Object.entries(next)) {
          next[m] = list.filter(b => b.id !== id);
        }
        return next;
      });
      this.toastService.showSuccess('Budget deleted successfully.');
    } else {
      this.toastService.showError("Couldn't delete budget. Please try again.");
    }
    this.isDeleting.set(false);
    return !error;
  }
}
