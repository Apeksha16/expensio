import { Injectable, signal, computed, Inject, effect, inject, untracked } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { ExpenseService } from './expense.service';

export interface Goal {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  total_amount: number;
  saved_amount: number;
  target_date: string;
  frequency: 'monthly' | 'alternate' | 'quarterly';
  installment_date: number;
  calculated_installment: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoalService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private expenseService = inject(ExpenseService);

  readonly isLoading = signal(false);
  readonly goals = signal<Goal[]>([]);

  readonly totalSaved = computed(() => {
    return this.goals().reduce((acc, goal) => acc + (goal.saved_amount || 0), 0);
  });

  // Global bottom sheet state
  readonly isBottomSheetOpen = signal(false);
  readonly editingGoal = signal<Goal | null>(null);

  // Add funds sheet state
  readonly isAddFundsSheetOpen = signal(false);
  readonly activeGoalForFunds = signal<Goal | null>(null);
  readonly editingFund = signal<any | null>(null);

  private realtimeChannel: any = null;
  private fetchGoalsTimeout: any;

  constructor(@Inject(DOCUMENT) private document: Document) {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        untracked(() => {
          this.fetchGoals();
          this.setupRealtime();
        });
      } else {
        this.goals.set([]);
        if (this.realtimeChannel) {
          this.supabaseService.client.removeChannel(this.realtimeChannel);
          this.realtimeChannel = null;
        }
      }
    });
  }

  private setupRealtime() {
    if (this.realtimeChannel) return;
    this.realtimeChannel = this.supabaseService.client.channel('public:goals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => {
        this.triggerFetchGoals();
      })
      .subscribe();
  }

  triggerFetchGoals() {
    if (this.fetchGoalsTimeout) clearTimeout(this.fetchGoalsTimeout);
    this.fetchGoalsTimeout = setTimeout(() => {
      this.fetchGoals();
    }, 100);
  }

  async fetchGoals() {
    this.isLoading.set(true);
    const { data, error } = await this.supabaseService.client
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      this.goals.set(data as Goal[]);
    } else {
      console.warn('Could not fetch goals', error);
      this.goals.set([]);
    }
    this.isLoading.set(false);
  }

  openBottomSheet(goal?: Goal) {
    if (goal) {
      this.editingGoal.set(goal);
    } else {
      this.editingGoal.set(null);
    }
    this.isBottomSheetOpen.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeBottomSheet() {
    this.isBottomSheetOpen.set(false);
    this.document.body.classList.remove('overflow-hidden');
    setTimeout(() => this.editingGoal.set(null), 300); // Clear after animation
  }

  openAddFundsSheet(goal: Goal, expense?: any) {
    this.activeGoalForFunds.set(goal);
    this.editingFund.set(expense || null);
    this.isAddFundsSheetOpen.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeAddFundsSheet() {
    this.isAddFundsSheetOpen.set(false);
    this.document.body.classList.remove('overflow-hidden');
    setTimeout(() => {
      this.activeGoalForFunds.set(null);
      this.editingFund.set(null);
    }, 300); // Clear after animation
  }

  isGoalDueThisMonth(goal: Goal): boolean {
    const createdDate = new Date(goal.created_at || new Date().toISOString());
    const currentDate = new Date();
    
    const monthDiff = (currentDate.getFullYear() - createdDate.getFullYear()) * 12 + (currentDate.getMonth() - createdDate.getMonth());
    
    if (monthDiff < 0) return false;
    
    let interval = 1;
    if (goal.frequency === 'alternate') interval = 2;
    if (goal.frequency === 'quarterly') interval = 3;
    
    return monthDiff % interval === 0;
  }

  calculateInstallment(total: number, saved: number, targetDate: string, frequency: 'monthly' | 'alternate' | 'quarterly'): number {
    const remainingAmount = Math.max(0, total - saved);
    if (remainingAmount === 0) return 0;

    const today = new Date();
    const target = new Date(targetDate);
    
    let monthsRemaining = (target.getFullYear() - today.getFullYear()) * 12 + (target.getMonth() - today.getMonth());
    if (monthsRemaining <= 0) monthsRemaining = 1; // Minimum 1 month

    let freqDivider = 1;
    if (frequency === 'alternate') freqDivider = 2;
    if (frequency === 'quarterly') freqDivider = 3;

    const numberOfInstallments = Math.max(1, Math.floor(monthsRemaining / freqDivider));
    return Math.round(remainingAmount / numberOfInstallments);
  }

  async addGoal(goal: Omit<Goal, 'id' | 'user_id' | 'calculated_installment'>): Promise<boolean> {
    const user = this.authService.currentUser();
    if (!user) return false;

    const calculatedInstallment = this.calculateInstallment(goal.total_amount, goal.saved_amount, goal.target_date, goal.frequency);

    const { data, error } = await this.supabaseService.client
      .from('goals')
      .insert({
        user_id: user.id,
        name: goal.name,
        icon: goal.icon,
        total_amount: goal.total_amount,
        saved_amount: goal.saved_amount,
        target_date: goal.target_date,
        frequency: goal.frequency,
        installment_date: goal.installment_date,
        calculated_installment: calculatedInstallment,
        created_at: goal.created_at || new Date().toISOString()
      })
      .select()
      .single();

    if (!error && data) {
      this.goals.update(g => {
        const updated = [data as Goal, ...g];
        return updated.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      });
      this.toastService.showSuccess('Goal created successfully.');
      return true;
    }
    
    if (error) {
      console.error('Supabase addGoal error:', error);
      this.toastService.showError("Couldn't create goal. Please try again.");
    }
    return false;
  }

  async updateGoal(id: string, updates: Partial<Omit<Goal, 'id'>>, silent = false): Promise<boolean> {
    // If specific fields are updated, recalculate installment
    let updatedInstallment: number | undefined;
    
    // We need the current goal to calculate if any of the fields are missing in updates
    const currentGoal = this.goals().find(g => g.id === id);
    if (currentGoal) {
      // Only recalculate if the core goal parameters changed, not when just making a payment
      const parametersChanged = updates.total_amount !== undefined || updates.target_date !== undefined || updates.frequency !== undefined;
      
      if (parametersChanged) {
        const totalAmount = updates.total_amount !== undefined ? updates.total_amount : currentGoal.total_amount;
        const targetDate = updates.target_date !== undefined ? updates.target_date : currentGoal.target_date;
        const frequency = updates.frequency !== undefined ? updates.frequency : currentGoal.frequency;
        
        // Recalculate based on the original remaining amount logic, or just re-run calculateInstallment
        updatedInstallment = this.calculateInstallment(totalAmount, currentGoal.saved_amount, targetDate, frequency);
        updates.calculated_installment = updatedInstallment;
      }
    }

    const { data, error } = await this.supabaseService.client
      .from('goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      this.goals.update(goalsList => 
        goalsList.map(g => g.id === id ? { ...g, ...updates } : g)
      );
      if (!silent) this.toastService.showSuccess('Goal updated successfully.');
      return true;
    }

    // Fallback if updated_at column doesn't exist in Supabase yet
    if (error && updates.updated_at) {
      delete updates.updated_at;
      const fallback = await this.supabaseService.client
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (!fallback.error && fallback.data) {
        this.goals.update(goalsList => 
          goalsList.map(g => g.id === id ? { ...g, ...updates } : g)
        );
        if (!silent) this.toastService.showSuccess('Goal updated successfully.');
        return true;
      }
    }

    this.toastService.showError("Couldn't update goal.");
    return false;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from('goals')
      .delete()
      .eq('id', id);

    if (!error) {
      this.goals.update(goalsList => goalsList.filter(g => g.id !== id));
      this.toastService.showSuccess('Goal deleted successfully.');
      return true;
    }

    this.toastService.showError("Couldn't delete goal.");
    return false;
  }

  /**
   * Recalculates saved_amount for a goal by summing all matching virtual-invest expenses.
   * Call this as a safety net after any external modification to virtual-invest expenses.
   */
  async recalculateSavedAmount(goalName: string): Promise<void> {
    const goal = this.goals().find(g => g.name === goalName);
    if (!goal) return;

    const user = this.authService.currentUser();
    if (!user) return;

    // Fetch all virtual-invest expenses for this user to ensure we don't wipe historical progress
    // that might not be loaded in the local active-month cache.
    const { data: allExpenses, error } = await this.supabaseService.client
      .from('expenses')
      .select('amount, category, goal_id, title')
      .eq('user_id', user.id)
      .eq('category', 'virtual-invest');

    if (error || !allExpenses) return;

    const sum = allExpenses
      .filter(e => {
        if (e.goal_id) return e.goal_id === goal.id;
        // Fallback for older expenses
        const title = e.title.startsWith('Goal: ') ? e.title.replace('Goal: ', '') : e.title;
        return title === goalName;
      })
      .reduce((total, e) => total + e.amount, 0);

    if (Math.abs(sum - goal.saved_amount) < 0.01) return; // Already in sync

    await this.supabaseService.client
      .from('goals')
      .update({ saved_amount: sum })
      .eq('id', goal.id);

    this.goals.update(gs => gs.map(g => g.id === goal.id ? { ...g, saved_amount: sum } : g));
  }
}
