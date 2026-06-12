import { Injectable, signal, computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AuthService } from './auth';

export interface Budget {
  id: string;
  name: string;
  amount: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private document = inject(DOCUMENT);
  private authService = inject(AuthService);

  readonly budgets = signal<Budget[]>([]);
  
  // Global bottom sheet state
  readonly isBottomSheetOpen = signal(false);
  readonly editingBudget = signal<Budget | null>(null);

  constructor() {
    this.generateDummyData();
  }

  private generateDummyData() {
    const dummy: Budget[] = [
      { id: '1', name: 'Food', amount: 5000 },
      { id: '2', name: 'Transport', amount: 2000 },
      { id: '3', name: 'Entertainment', amount: 3000 },
      { id: '4', name: 'Shopping', amount: 4000 }
    ];
    this.budgets.set(dummy);
  }

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

  addBudget(budget: Omit<Budget, 'id'>) {
    const newBudget: Budget = {
      ...budget,
      id: Math.random().toString(36).substring(2, 11)
    };
    this.budgets.update(bs => [...bs, newBudget]);
  }

  updateBudget(id: string, data: Omit<Budget, 'id'>) {
    this.budgets.update(bs => bs.map(b => b.id === id ? { ...data, id } : b));
  }

  deleteBudget(id: string) {
    this.budgets.update(bs => bs.filter(b => b.id !== id));
  }
}
