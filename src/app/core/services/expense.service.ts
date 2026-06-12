import { Injectable, signal, computed, Inject, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  readonly isLoading = signal(false);

  constructor(@Inject(DOCUMENT) private document: Document) {
    effect(() => {
      const user = this.authService.currentUser();
      const month = this.activeMonth(); // Track month changes
      if (user) {
        this.fetchExpenses(month);
      } else {
        this.allExpenses.set([]);
        this.applyFilterAndPagination();
      }
    });
  }
  
  // All expenses in memory
  private allExpenses = signal<Expense[]>([]);

  // Filtering & Pagination State
  readonly activeMonth = signal<string>(this.getCurrentMonthString()); // Format: 'YYYY-MM'
  readonly currentPage = signal<number>(1);
  readonly pageSize = 15;
  readonly hasMore = signal<boolean>(true);

  // The displayed expenses
  readonly expenses = signal<Expense[]>([]);
  
  // Global bottom sheet state
  readonly isBottomSheetOpen = signal(false);
  readonly editingExpense = signal<Expense | null>(null);

  private getCurrentMonthString() {
    const d = new Date();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }

  async fetchExpenses(monthStr?: string) {
    this.isLoading.set(true);
    const month = monthStr || this.activeMonth();

    const [year, m] = month.split('-');
    const startDate = `${year}-${m}-01T00:00:00.000Z`;
    
    // Calculate the start of the next month
    const nextMDate = new Date(parseInt(year), parseInt(m), 1);
    const nextMonthStr = `${nextMDate.getFullYear()}-${(nextMDate.getMonth() + 1).toString().padStart(2, '0')}-01T00:00:00.000Z`;

    const { data, error } = await this.supabaseService.client
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lt('date', nextMonthStr)
      .order('date', { ascending: false });
      
    if (!error && data) {
      this.allExpenses.set(data as Expense[]);
      this.applyFilterAndPagination();
    }
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

  async addExpense(expense: Omit<Expense, 'id'>): Promise<boolean> {
    const user = this.authService.currentUser();
    if (!user) return false;

    const { data, error } = await this.supabaseService.client
      .from('expenses')
      .insert({
        user_id: user.id,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        date: expense.date
      })
      .select()
      .single();

    if (!error && data) {
      this.allExpenses.update(exps => {
        const updated = [data as Expense, ...exps];
        return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      this.applyFilterAndPagination();
      return true;
    }
    
    if (error) {
      console.error('Supabase addExpense error:', error);
    }
    return false;
  }

  async updateExpense(id: string, data: Omit<Expense, 'id'>): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from('expenses')
      .update({
        title: data.title,
        amount: data.amount,
        category: data.category,
        date: data.date
      })
      .eq('id', id);

    if (!error) {
      this.allExpenses.update(exps => {
        const updated = exps.map(exp => exp.id === id ? { ...exp, ...data } : exp);
        return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
      this.applyFilterAndPagination();
      return true;
    }
    return false;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from('expenses')
      .delete()
      .eq('id', id);

    if (!error) {
      this.allExpenses.update(exps => exps.filter(exp => exp.id !== id));
      this.applyFilterAndPagination();
      return true;
    }
    return false;
  }

  getConsumedForCategory(category: string): number {
    const month = this.activeMonth();
    return this.allExpenses()
      .filter(e => e.date.startsWith(month) && e.category.toLowerCase() === category.toLowerCase())
      .reduce((sum, e) => sum + e.amount, 0);
  }
}

