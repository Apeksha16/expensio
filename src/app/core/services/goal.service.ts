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

export interface GoalEmi {
  id: string;
  goal_id: string;
  expected_amount: number;
  due_date: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'skipped';
  created_at: string;
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
  readonly currentMonthEmis = signal<GoalEmi[]>([]);

  // Add funds sheet state
  readonly isAddFundsSheetOpen = signal(false);
  readonly activeGoalForFunds = signal<Goal | null>(null);
  readonly activeEmiForFunds = signal<GoalEmi | null>(null);
  readonly editingFund = signal<any | null>(null);
  readonly fundMode = signal<'installment' | 'custom'>('installment');

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

  async fetchGoalEmis(goalId: string): Promise<GoalEmi[]> {
    const { data, error } = await this.supabaseService.client
      .from('goal_emis')
      .select('*')
      .eq('goal_id', goalId)
      .order('due_date', { ascending: true });

    if (!error && data) {
      return data as GoalEmi[];
    }
    return [];
  }

  async fetchCurrentMonthEmis(monthStr: string) {
    // monthStr is 'YYYY-MM'
    const startOfMonth = `${monthStr}-01`;
    const endOfMonth = new Date(parseInt(monthStr.split('-')[0]), parseInt(monthStr.split('-')[1]), 0).toISOString().split('T')[0];

    const { data, error } = await this.supabaseService.client
      .from('goal_emis')
      .select('*')
      .gte('due_date', startOfMonth)
      .lte('due_date', endOfMonth)
      .order('due_date', { ascending: true });

    if (!error && data) {
      this.currentMonthEmis.set(data as GoalEmi[]);
    } else {
      this.currentMonthEmis.set([]);
    }
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

  openAddFundsSheet(goal: Goal, emi?: GoalEmi | null, expense?: any) {
    this.activeGoalForFunds.set(goal);
    // Backward compatibility: if 2nd arg is an expense instead of an EMI
    let isEditing = false;
    if (emi && !('expected_amount' in emi) && !expense) {
      this.activeEmiForFunds.set(null);
      this.editingFund.set(emi);
      isEditing = true;
    } else {
      this.activeEmiForFunds.set(emi || null);
      this.editingFund.set(expense || null);
      if (expense) isEditing = true;
    }
    
    this.fundMode.set(isEditing ? 'custom' : 'installment');
    this.isAddFundsSheetOpen.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeAddFundsSheet() {
    this.isAddFundsSheetOpen.set(false);
    this.document.body.classList.remove('overflow-hidden');
    setTimeout(() => {
      this.activeGoalForFunds.set(null);
      this.activeEmiForFunds.set(null);
      this.editingFund.set(null);
    }, 300); // Clear after animation
  }

  isGoalDueThisMonth(goal: Goal): boolean {
    if (goal.saved_amount >= goal.total_amount) return false;
    // An EMI is considered due this month if there is an active (pending/partially_paid) 
    // EMI for this goal currently loaded in the currentMonthEmis list.
    return this.currentMonthEmis().some(emi => emi.goal_id === goal.id && (emi.status === 'pending' || emi.status === 'partially_paid'));
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
      this.toastService.showSuccess('Goal Set Up', 'Your goal is set! Plan your spending to stay on track.');
      return true;
    }
    
    if (error) {
      console.error('Supabase addGoal error:', error);
      this.toastService.showError("Couldn't Set Goal", 'We couldn\'t set up your goal. Please try again.');
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
      if (!silent) this.toastService.showSuccess('Goal Updated', 'Your goal has been updated.');
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
        if (!silent) this.toastService.showSuccess('Goal Updated', 'Your goal has been updated.');
        return true;
      }
    }

    this.toastService.showError("Couldn't Update Goal", 'We couldn\'t update your goal. Please try again.');
    return false;
  }

  async updateGoalEmi(emiId: string, updates: Partial<GoalEmi>): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from('goal_emis')
      .update(updates)
      .eq('id', emiId);

    if (!error) {
      return true;
    }
    return false;
  }

  async deleteGoal(id: string): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from('goals')
      .delete()
      .eq('id', id);

    if (!error) {
      this.goals.update(goalsList => goalsList.filter(g => g.id !== id));
      this.toastService.showSuccess('Goal Removed', 'Your goal has been removed, you can relax for your expenses.');
      return true;
    }

    this.toastService.showError("Couldn't Remove Goal", 'We couldn\'t remove your goal. Please try again.');
    return false;
  }

  // recalculateSavedAmount has been removed. 
  // It is now handled securely and atomically by the trg_sync_goal_progress Postgres trigger.
}
