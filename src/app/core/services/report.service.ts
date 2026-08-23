import { Injectable, signal, inject, effect, untracked } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface ReportExpense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  paid_via?: string;
}

export interface MonthlySummary {
  user_id: string;
  month: string;
  total_spent: number;
  regular_expenses_total: number;
  goal_expenses_total: number;
  subscription_expenses_total: number;
  split_expenses_total: number;
  breakdown_by_source: Record<string, Record<string, number>>;
  breakdown_by_payment_method: Record<string, Record<string, number>>;
}

export type DateRangePreset = 'This Month' | 'Last Month' | 'Last 3 Months' | 'This Year' | 'All Time';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  readonly isLoading = signal(false);
  
  // Raw expenses for short-term presets
  readonly expenses = signal<ReportExpense[]>([]);
  
  // Aggregated summaries for long-term presets
  readonly monthlySummaries = signal<MonthlySummary[]>([]);
  
  // Explicit flag to help components know which data to use
  readonly isLongTerm = signal(false);

  // Filter state
  readonly activePreset = signal<DateRangePreset>('This Month');
  readonly showGoals = signal<boolean>(true);
  readonly showSubscriptions = signal<boolean>(true);
  readonly showSplits = signal<boolean>(true);
  readonly showExpenses = signal<boolean>(true);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (!user) {
        untracked(() => {
          this.expenses.set([]);
          this.monthlySummaries.set([]);
        });
      }
    });
  }

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
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else if (preset === 'This Year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear() + 1, 0, 1);
    } else {
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

    // Determine if this is a long-term preset
    const isLongTermPreset = preset === 'This Year' || preset === 'All Time' || preset === 'Last 3 Months';
    this.isLongTerm.set(isLongTermPreset);

    if (isLongTermPreset) {
      // 1. Fetch from monthly_summaries view (Very Fast)
      const startMonth = startDate.substring(0, 7); // 'YYYY-MM'
      const endMonth = endDate.substring(0, 7);

      const { data: summaryData, error: summaryError } = await this.supabaseService.client
        .from('monthly_summaries')
        .select('*')
        .gte('month', startMonth)
        .lt('month', endMonth)
        .eq('user_id', user.id);

      if (!summaryError && summaryData) {
        this.monthlySummaries.set(summaryData as MonthlySummary[]);
      } else {
        this.monthlySummaries.set([]);
      }
      
      // 2. Fetch Top 5 raw expenses separately (without fetching thousands of rows)
      const [
        { data: topExpenses },
        { data: topSplits }
      ] = await Promise.all([
        this.supabaseService.client
          .from('expenses')
          .select('id, title, amount, category, date, goal_id, subscription_id, paid_via')
          .gte('date', startDate)
          .lt('date', endDate)
          .order('amount', { ascending: false })
          .limit(10),
        this.supabaseService.client
          .from('split_expenses')
          .select('*')
          .gte('date', startDate)
          .lt('date', endDate)
          // Cannot natively sort by amountOwed easily on JSONB via Supabase JS without RPC, 
          // but we can fetch recent/all and sort in memory if count isn't huge.
          // Since we want to optimize, we'll fetch the highest amounts directly using an RPC or just fetch a reasonable chunk.
          // For now, we will fetch recent 20 and sort, or we can just fetch all for top splits.
          // To keep it simple and avoid RPC for top splits, let's fetch a small limit and sort.
          .order('date', { ascending: false })
          .limit(20)
      ]);

      let allTop: ReportExpense[] = [];
      if (topExpenses) {
        allTop = this.processRawExpenses(topExpenses, true);
      }
      if (topSplits) {
        allTop = [...allTop, ...this.processRawSplits(topSplits, user.id)];
      }
      
      // Sort and take top 5
      allTop.sort((a, b) => b.amount - a.amount);
      this.expenses.set(allTop.slice(0, 5));

    } else {
      // Short-term preset: Fetch all raw data for daily trends
      const [
        { data: expensesData, error: expensesError },
        { data: splitsData, error: splitsError }
      ] = await Promise.all([
        this.supabaseService.client
          .from('expenses')
          .select('id, title, amount, category, date, goal_id, subscription_id, paid_via')
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
        all = this.processRawExpenses(expensesData, false);
      }
      if (!splitsError && splitsData && this.showSplits()) {
        all = [...all, ...this.processRawSplits(splitsData, user.id)];
      }

      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      this.expenses.set(all);
      this.monthlySummaries.set([]);
    }
    
    this.isLoading.set(false);
  }

  private processRawExpenses(expensesData: any[], ignoreFilters: boolean): ReportExpense[] {
    const showGoals = this.showGoals();
    const showSubs = this.showSubscriptions();
    const showExp = this.showExpenses();
    
    const filteredExpenses = expensesData.filter(e => {
      if (!ignoreFilters) {
        if (!showGoals && e.category === 'virtual-invest') return false;
        if (!showSubs && e.subscription_id) return false;
        if (!showExp && e.category !== 'virtual-invest' && !e.subscription_id) return false;
      }
      return true;
    });
    
    return [...(filteredExpenses as ReportExpense[])];
  }

  private processRawSplits(splitsData: any[], currentUserId: string): ReportExpense[] {
    if (!this.showSplits()) return [];
    
    return splitsData
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
            paid_via: s.paid_via || 'UPI'
          };
        }
        return null;
      })
      .filter((x: any) => x !== null) as ReportExpense[];
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

  toggleExpenseFilter() {
    this.showExpenses.set(!this.showExpenses());
    this.fetchReports(this.activePreset());
  }
}
