import { Injectable, signal, computed, Inject, effect, inject, untracked } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { ExpenseService } from './expense.service';

export interface Subscription {
  id: string;
  title: string;
  amount: number;
  category: string;
  billing_day: number;
  last_paid_month: string | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private expenseService = inject(ExpenseService);

  readonly isLoading = signal(false);
  readonly subscriptions = signal<Subscription[]>([]);

  // Computed: What is the current month string 'YYYY-MM'
  readonly currentMonthStr = signal<string>(this.getCurrentMonthString());

  readonly upcomingSubscriptions = computed(() => {
    const monthStr = this.currentMonthStr();
    return [...this.subscriptions()]
      .filter(sub => sub.last_paid_month !== monthStr)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  });

  readonly paidSubscriptions = computed(() => {
    const monthStr = this.currentMonthStr();
    return [...this.subscriptions()]
      .filter(sub => sub.last_paid_month === monthStr)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  });

  // Global bottom sheet state
  readonly isBottomSheetOpen = signal(false);
  readonly editingSubscription = signal<Subscription | null>(null);

  constructor(@Inject(DOCUMENT) private document: Document) {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.fetchSubscriptions();
      } else if (untracked(() => this.authService.isInitialized())) {
        this.subscriptions.set([]);
      }
    });
  }

  private getCurrentMonthString() {
    const d = new Date();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }

  async fetchSubscriptions() {
    this.isLoading.set(true);
    const { data, error } = await this.supabaseService.client
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      this.subscriptions.set(data as Subscription[]);
    } else {
      // In case the table doesn't exist yet, we don't want to crash everything
      console.warn('Could not fetch subscriptions', error);
      this.subscriptions.set([]);
    }
    this.isLoading.set(false);
  }

  openBottomSheet(subscription?: Subscription) {
    if (subscription) {
      this.editingSubscription.set(subscription);
    } else {
      this.editingSubscription.set(null);
    }
    this.isBottomSheetOpen.set(true);
    this.document.body.classList.add('overflow-hidden');
  }

  closeBottomSheet() {
    this.isBottomSheetOpen.set(false);
    this.document.body.classList.remove('overflow-hidden');
    setTimeout(() => this.editingSubscription.set(null), 300); // Clear after animation
  }

  async addSubscription(subscription: Omit<Subscription, 'id' | 'last_paid_month'>): Promise<boolean> {
    const user = this.authService.currentUser();
    if (!user) return false;

    const { data, error } = await this.supabaseService.client
      .from('subscriptions')
      .insert({
        user_id: user.id,
        title: subscription.title,
        amount: subscription.amount,
        category: subscription.category,
        billing_day: subscription.billing_day,
        last_paid_month: null,
        created_at: subscription.created_at || new Date().toISOString()
      })
      .select()
      .single();

    if (!error && data) {
      this.subscriptions.update(subs => {
        const updated = [data as Subscription, ...subs];
        return updated.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      });
      this.toastService.showSuccess('Subscription added successfully!');
      return true;
    }
    
    if (error) {
      console.error('Supabase addSubscription error:', error);
      this.toastService.showError('Failed to add subscription. Check database schema.');
    }
    return false;
  }

  async updateSubscription(id: string, updates: Partial<Omit<Subscription, 'id' | 'last_paid_month'>>): Promise<boolean> {
    const { data, error } = await this.supabaseService.client
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      this.subscriptions.update(subs => 
        subs.map(s => s.id === id ? { ...s, ...updates } : s)
      );
      this.toastService.showSuccess('Subscription updated!');
      return true;
    }

    // Fallback if updated_at column doesn't exist in Supabase yet
    if (error && updates.updated_at) {
      console.warn('Fallback update without updated_at due to error:', error);
      delete updates.updated_at;
      const fallback = await this.supabaseService.client
        .from('subscriptions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (!fallback.error && fallback.data) {
        this.subscriptions.update(subs => 
          subs.map(s => s.id === id ? { ...s, ...updates } : s)
        );
        this.toastService.showSuccess('Subscription updated!');
        return true;
      }
    }

    this.toastService.showError('Failed to update subscription');
    return false;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (!error) {
      this.subscriptions.update(subs => subs.filter(s => s.id !== id));
      this.toastService.showSuccess('Subscription deleted!');
      return true;
    }

    this.toastService.showError('Failed to delete subscription');
    return false;
  }

  async markAsPaid(subscription: Subscription): Promise<boolean> {
    const currentMonth = this.currentMonthStr();
    
    // Determine the exact date to record the expense
    const d = new Date();
    // Default to the billing day of current month, or today if billing day is in future?
    // Let's use today's date for accurate expense tracking, but they might be paying early.
    // It's safer to use the exact time they click "Mark Paid"
    const expenseDate = new Date().toISOString();

    // 1. Create the Expense
    const expenseAdded = await this.expenseService.addExpense({
      title: subscription.title,
      amount: subscription.amount,
      category: `${subscription.category} (Subscription)`,
      date: expenseDate
    }, true);

    if (!expenseAdded) {
      // Toast shown by expense service
      return false;
    }

    // 2. Update subscription last_paid_month
    const updatedTime = new Date().toISOString();
    const updatePayload: any = { last_paid_month: currentMonth, updated_at: updatedTime };
    const { error } = await this.supabaseService.client
      .from('subscriptions')
      .update(updatePayload)
      .eq('id', subscription.id);

    if (!error) {
      this.subscriptions.update(subs => 
        subs.map(s => s.id === subscription.id ? { ...s, last_paid_month: currentMonth, updated_at: updatedTime } : s)
      );
      this.toastService.showSuccess(`Your ${subscription.title} payment has been done.`);
      return true;
    }

    // Fallback if updated_at is not supported by DB
    if (error && updatePayload.updated_at) {
      delete updatePayload.updated_at;
      const fallback = await this.supabaseService.client
        .from('subscriptions')
        .update(updatePayload)
        .eq('id', subscription.id);
        
      if (!fallback.error) {
        this.subscriptions.update(subs => 
          subs.map(s => s.id === subscription.id ? { ...s, last_paid_month: currentMonth } : s)
        );
        this.toastService.showSuccess(`Your ${subscription.title} payment has been done.`);
        return true;
      }
    }

    this.toastService.showError('Logged expense but failed to update subscription status.');
    return false;
  }
}
