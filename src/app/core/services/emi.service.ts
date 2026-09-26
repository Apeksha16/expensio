import { Injectable, signal, computed, inject, effect, untracked } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

export interface Emi {
  id: string;
  title: string;
  amount: number;
  category: string;
  icon?: string;
  due_day: number;
  total_months: number;
  months_paid: number;
  last_paid_month: string | null;
  start_date?: string;
  end_date?: string;
  transactions?: any[];
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmiService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  readonly isLoading = signal(false);
  readonly emis = signal<Emi[]>([]);

  readonly currentMonthStr = signal<string>(this.getCurrentMonthString());

  readonly totalMonthlyAmount = computed(() => {
    return this.runningEmis().reduce((total, emi) => total + emi.amount, 0);
  });

  readonly runningEmis = computed(() => {
    return [...this.emis()]
      .filter(emi => emi.months_paid < emi.total_months)
      .sort((a, b) => a.due_day - b.due_day);
  });

  readonly completedEmis = computed(() => {
    return [...this.emis()]
      .filter(emi => emi.months_paid >= emi.total_months)
      .sort((a, b) => (b.updated_at ? new Date(b.updated_at).getTime() : 0) - (a.updated_at ? new Date(a.updated_at).getTime() : 0));
  });

  readonly isBottomSheetOpen = signal(false);
  readonly isDetailsSheetOpen = signal(false);
  readonly selectedEmi = signal<Emi | null>(null);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        untracked(() => this.fetchEmis());
      } else {
        untracked(() => this.emis.set([]));
      }
    });
  }

  getCurrentMonthString(): string {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  }

  openBottomSheet(emi?: Emi) {
    this.selectedEmi.set(emi || null);
    this.isBottomSheetOpen.set(true);
  }

  closeBottomSheet() {
    this.isBottomSheetOpen.set(false);
    setTimeout(() => this.selectedEmi.set(null), 300);
  }

  openDetailsSheet(emi: Emi) {
    this.selectedEmi.set(emi);
    this.isDetailsSheetOpen.set(true);
  }

  closeDetailsSheet() {
    this.isDetailsSheetOpen.set(false);
    setTimeout(() => this.selectedEmi.set(null), 300);
  }

  async fetchEmis() {
    try {
      this.isLoading.set(true);
      const user = this.authService.currentUser();
      if (!user) return;

      const { data, error } = await this.supabaseService.client
        .from('emis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          console.warn('EMIs table does not exist yet. Please create it.');
        } else {
          throw error;
        }
      }
      this.emis.set(data || []);
    } catch (error: any) {
      this.toastService.showError('Failed to fetch EMIs', error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async addEmi(emiData: Partial<Emi>) {
    try {
      const user = this.authService.currentUser();
      if (!user) throw new Error('Not authenticated');

      const dataToInsert = {
        ...emiData,
        user_id: user.id
      };

      const { data, error } = await this.supabaseService.client
        .from('emis')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) throw error;

      this.emis.update(emis => [data, ...emis]);
      this.toastService.showSuccess('EMI added successfully');
      this.closeBottomSheet();
    } catch (error: any) {
      this.toastService.showError('Failed to add EMI', error.message);
      throw error;
    }
  }

  async updateEmi(id: string, updates: Partial<Emi>) {
    try {
      const { data, error } = await this.supabaseService.client
        .from('emis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.emis.update(emis =>
        emis.map(e => e.id === id ? { ...e, ...data } : e)
      );
      this.toastService.showSuccess('EMI updated successfully');
      this.closeBottomSheet();
    } catch (error: any) {
      this.toastService.showError('Failed to update EMI', error.message);
      throw error;
    }
  }

  async deleteEmi(id: string) {
    try {
      const { error } = await this.supabaseService.client
        .from('emis')
        .delete()
        .eq('id', id);

      if (error) throw error;

      this.emis.update(emis => emis.filter(e => e.id !== id));
      this.toastService.showSuccess('EMI deleted successfully');
      this.closeBottomSheet();
    } catch (error: any) {
      this.toastService.showError('Failed to delete EMI', error.message);
      throw error;
    }
  }

  async markAsPaid(id: string, actualAmount: number, monthStr: string) {
    try {
      const emi = this.emis().find(e => e.id === id);
      if (!emi) throw new Error('EMI not found');
      
      const newMonthsPaid = emi.months_paid + 1;
      const transactions = emi.transactions || [];
      const newTransaction = {
        id: crypto.randomUUID(),
        amount: actualAmount,
        month: monthStr,
        paid_at: new Date().toISOString()
      };

      const { data, error } = await this.supabaseService.client
        .from('emis')
        .update({ 
          last_paid_month: monthStr, 
          months_paid: newMonthsPaid,
          transactions: [...transactions, newTransaction]
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      this.emis.update(emis =>
        emis.map(e => e.id === id ? { ...e, ...data } : e)
      );
      this.toastService.showSuccess('EMI marked as paid for this month');
    } catch (error: any) {
      this.toastService.showError('Failed to mark EMI as paid', error.message);
      throw error;
    }
  }
}
