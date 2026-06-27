import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface ReportExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export type DateRangePreset = 'This Month' | 'Last Month' | 'Last 3 Months' | 'This Year' | 'All Time';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly expenses = signal<ReportExpense[]>([]);

  // Filter state
  readonly activePreset = signal<DateRangePreset>('This Month');
  readonly showGoals = signal<boolean>(true);
  readonly showSubscriptions = signal<boolean>(true);
  readonly showSplits = signal<boolean>(true);

  getDateRangeForPreset(preset: DateRangePreset): { startDate: string, endDate: string } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (preset === 'This Month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else if (preset === 'Last Month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (preset === 'Last 3 Months') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1); // 3 months inclusive
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else if (preset === 'This Year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
    } else {
      // All Time
      startDate = new Date(2000, 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  }

  async fetchReports(preset: DateRangePreset) {
    this.isLoading.set(true);
    this.activePreset.set(preset);
    
    const { startDate, endDate } = this.getDateRangeForPreset(preset);
    
    const user = this.authService.currentUser();
    if (!user) {
      this.isLoading.set(false);
      return;
    }

    const [
      { data: expensesData, error: expensesError },
      { data: splitsData, error: splitsError }
    ] = await Promise.all([
      this.supabaseService.client
        .from('expenses')
        .select('id, title, amount, category, date, goal_id, subscription_id')
        .gte('date', startDate)
        .lt('date', endDate),
      this.supabaseService.client
        .from('split_expenses')
        .select('*')
        .gte('date', startDate)
        .lt('date', endDate)
    ]);

    let all: ReportExpense[] = [];

    if (!expensesError && expensesData) {
      const showGoals = this.showGoals();
      const showSubs = this.showSubscriptions();
      
      const filteredExpenses = expensesData.filter(e => {
        if (!showGoals && e.category === 'virtual-invest') return false;
        if (!showSubs && e.subscription_id) return false;
        return true;
      });
      
      all = [...(filteredExpenses as ReportExpense[])];
    }

    if (!splitsError && splitsData && this.showSplits()) {
      const currentUserId = user.id;
      const mappedSplits: ReportExpense[] = splitsData
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
              date: s.date
            };
          }
          return null;
        })
        .filter((x: any) => x !== null) as ReportExpense[];
        
      all = [...all, ...mappedSplits];
    }

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    this.expenses.set(all);
    this.isLoading.set(false);
  }

  toggleGoalFilter() {
    this.showGoals.set(!this.showGoals());
    this.fetchReports(this.activePreset());
  }

  toggleSubscriptionFilter() {
    this.showSubscriptions.set(!this.showSubscriptions());
    this.fetchReports(this.activePreset());
  }
  
  toggleSplitFilter() {
    this.showSplits.set(!this.showSplits());
    this.fetchReports(this.activePreset());
  }
}
