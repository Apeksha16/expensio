import { Injectable, signal, computed, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

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
  constructor(@Inject(DOCUMENT) private document: Document) {
    this.generateDummyData();
    this.applyFilterAndPagination();
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

  // Generate 150 dummy expenses across the last 12 months
  private generateDummyData() {
    const categories = ['Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Other'];
    const dummy: Expense[] = [];
    const now = new Date();
    
    for (let i = 0; i < 150; i++) {
      const pastDate = new Date();
      // Random date within the last 12 months
      pastDate.setDate(now.getDate() - Math.floor(Math.random() * 365));
      
      dummy.push({
        id: i.toString(),
        title: `Dummy Expense ${i}`,
        amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
        category: categories[Math.floor(Math.random() * categories.length)],
        date: pastDate.toISOString()
      });
    }
    
    // Sort descending by date
    dummy.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.allExpenses.set(dummy);
  }

  setMonthFilter(monthStr: string) {
    this.activeMonth.set(monthStr);
    this.currentPage.set(1);
    this.applyFilterAndPagination();
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

  addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense: Expense = {
      ...expense,
      id: Math.random().toString(36).substring(2, 11)
    };
    this.allExpenses.update(exps => {
      const updated = [newExpense, ...exps];
      return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    this.applyFilterAndPagination();
  }

  updateExpense(id: string, data: Omit<Expense, 'id'>) {
    this.allExpenses.update(exps => {
      const updated = exps.map(exp => exp.id === id ? { ...data, id } : exp);
      return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    this.applyFilterAndPagination();
  }

  deleteExpense(id: string) {
    this.allExpenses.update(exps => exps.filter(exp => exp.id !== id));
    this.applyFilterAndPagination();
  }

  getConsumedForCategory(category: string): number {
    const month = this.activeMonth();
    return this.allExpenses()
      .filter(e => e.date.startsWith(month) && e.category.toLowerCase() === category.toLowerCase())
      .reduce((sum, e) => sum + e.amount, 0);
  }
}

