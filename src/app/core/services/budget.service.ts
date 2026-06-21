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
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private document = inject(DOCUMENT);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);

  private _budgets = signal<Budget[]>([]);
  
  readonly budgets = computed(() => {
    const list = this._budgets();
    const hasOthers = list.some(b => b.name.toLowerCase() === 'others' || b.name.toLowerCase() === 'other');
    if (hasOthers) return list;
    
    const virtualOthers: Budget = {
      id: 'virtual-others',
      name: 'Others',
      amount: 0,
      icon_path: '<svg class="w-6 h-6 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>',
      month: this.expenseService.activeMonth(),
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
        this.fetchBudgets(month);
      } else {
        this._budgets.set([]);
      }
    });
  }
  
  // Global bottom sheet state
  readonly isBottomSheetOpen = signal(false);
  readonly editingBudget = signal<Budget | null>(null);

  // Calculate the remaining budget available to allocate
  readonly remainingSalary = computed(() => {
    const monthlySalary = this.authService.userProfile().salary;
    const allocated = this.budgets().reduce((sum, b) => sum + b.amount, 0);
    return monthlySalary - allocated;
  });

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
    const startDate = `${year}-${m}-01T00:00:00.000Z`;
    const nextMDate = new Date(parseInt(year), parseInt(m), 1);
    const nextMonthStr = `${nextMDate.getFullYear()}-${(nextMDate.getMonth() + 1).toString().padStart(2, '0')}-01T00:00:00.000Z`;
    return { startDate, endDate: nextMonthStr };
  }

  async fetchBudgets(monthStr: string) {
    this.isLoading.set(true);
    const { data, error } = await this.supabaseService.client
      .from('budgets')
      .select('*')
      .eq('month', monthStr)
      .order('created_at', { ascending: true });

    if (!error && data) {
      if (data.length === 0) {
        // Try to rollover from previous month
        const [year, m] = monthStr.split('-');
        let prevM = parseInt(m) - 1;
        let prevY = parseInt(year);
        if (prevM === 0) {
          prevM = 12;
          prevY -= 1;
        }
        const prevMonthStr = `${prevY}-${prevM.toString().padStart(2, '0')}`;
        
        const { data: prevData, error: prevError } = await this.supabaseService.client
          .from('budgets')
          .select('*')
          .eq('month', prevMonthStr)
          .eq('auto_rollover', true);
          
        if (!prevError && prevData && prevData.length > 0) {
          const user = this.authService.currentUser();
          if (user) {
            const newBudgets = prevData.map(b => ({
              user_id: user.id,
              name: b.name,
              amount: b.amount,
              icon_path: b.icon_path,
              month: monthStr,
              auto_rollover: true
            }));
            
            const { data: insertedData, error: insertError } = await this.supabaseService.client
              .from('budgets')
              .insert(newBudgets)
              .select();
              
            if (!insertError && insertedData) {
              this._budgets.set(insertedData as Budget[]);
              this.isLoading.set(false);
              return;
            }
          }
        }
      }
      this._budgets.set(data as Budget[]);
    }
    this.isLoading.set(false);
  }

  async addBudget(budget: Omit<Budget, 'id' | 'month'>): Promise<boolean> {
    const user = this.authService.currentUser();
    const month = this.expenseService.activeMonth();
    if (!user || !month) return false;

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
      this._budgets.update(bs => [...bs, data as Budget]);
      this.toastService.showSuccess('Budget added successfully!');
    } else {
      this.toastService.showError('Failed to add budget. Please try again.');
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
      // If the name changed, cascade the update to the expenses table for this month only
      if (oldName && oldName !== data.name) {
        const user = this.authService.currentUser();
        const month = this.expenseService.activeMonth();
        if (user && month) {
          const { startDate, endDate } = this.getMonthDateRange(month);
          await this.supabaseService.client
            .from('expenses')
            .update({ category: data.name })
            .eq('user_id', user.id)
            .eq('category', oldName)
            .gte('date', startDate)
            .lt('date', endDate);
        }
      }

      this._budgets.update(bs => bs.map(b => b.id === id ? { ...b, ...data } : b));
      this.toastService.showSuccess('Budget updated successfully!');
    } else {
      this.toastService.showError('Failed to update budget. Please try again.');
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
      // Cascade the update to the expenses table for this month only
      const user = this.authService.currentUser();
      const month = this.expenseService.activeMonth();
      if (user && month) {
        const { startDate, endDate } = this.getMonthDateRange(month);
        await this.supabaseService.client
          .from('expenses')
          .update({ category: 'Others' })
          .eq('user_id', user.id)
          .eq('category', budgetName)
          .gte('date', startDate)
          .lt('date', endDate);
      }
      this._budgets.update(bs => bs.filter(b => b.id !== id));
      this.toastService.showSuccess('Budget deleted successfully!');
    } else {
      this.toastService.showError('Failed to delete budget. Please try again.');
    }
    this.isDeleting.set(false);
    return !error;
  }
}
