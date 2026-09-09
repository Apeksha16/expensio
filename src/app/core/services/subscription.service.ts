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

  readonly totalMonthlyAmount = computed(() => {
    return this.subscriptions().reduce((total, sub) => total + sub.amount, 0);
  });

  readonly upcomingSubscriptions = computed(() => {
    const monthStr = this.currentMonthStr();
    return [...this.subscriptions()]
      .filter(sub => sub.last_paid_month !== monthStr)
      .sort((a, b) => a.billing_day - b.billing_day);
  });

  readonly nextMonthSubscriptions = computed(() => {
    return [...this.subscriptions()]
      .sort((a, b) => a.billing_day - b.billing_day);
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

  private realtimeChannel: any = null;
  private fetchSubsTimeout: any;

  constructor(@Inject(DOCUMENT) private document: Document) {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        untracked(() => {
          this.fetchSubscriptions();
          this.setupRealtime();
        });
      } else {
        this.subscriptions.set([]);
        if (this.realtimeChannel) {
          this.supabaseService.client.removeChannel(this.realtimeChannel);
          this.realtimeChannel = null;
        }
      }
    });
  }

  private getCurrentMonthString() {
    const d = new Date();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }

  private setupRealtime() {
    if (this.realtimeChannel) return;
    this.realtimeChannel = this.supabaseService.client.channel('public:subscriptions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        this.triggerFetchSubscriptions();
      })
      .subscribe();
  }

  triggerFetchSubscriptions() {
    if (this.fetchSubsTimeout) clearTimeout(this.fetchSubsTimeout);
    this.fetchSubsTimeout = setTimeout(() => {
      this.fetchSubscriptions();
    }, 100);
  }

  async fetchSubscriptions() {
    // Only show shimmer on initial load or when list is empty
    if (this.subscriptions().length === 0) {
      this.isLoading.set(true);
    }
    
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
      this.toastService.showSuccess('Subscription added successfully.');
      return true;
    }
    
    if (error) {
      console.error('Supabase addSubscription error:', error);
      this.toastService.showError("Couldn't add subscription. Please try again.");
    }
    return false;
  }

  async updateSubscription(id: string, updates: Partial<Omit<Subscription, 'id' | 'last_paid_month'>>): Promise<boolean> {
    // Remove updated_at since it doesn't exist on the table
    if ('updated_at' in updates) {
      delete updates.updated_at;
    }

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
      this.toastService.showSuccess('Subscription updated successfully.');
      return true;
    }

    this.toastService.showError("Couldn't update subscription.");
    return false;
  }

  async deleteSubscription(id: string): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from('subscriptions')
      .delete()
      .eq('id', id);

    if (!error) {
      this.subscriptions.update(subs => subs.filter(s => s.id !== id));
      this.toastService.showSuccess('Subscription deleted successfully.');
      return true;
    }

    this.toastService.showError("Couldn't delete subscription.");
    return false;
  }

  async markAsPaid(subscription: Subscription): Promise<boolean> {
    const expenseDate = new Date().toISOString();

    // 1. Create the Expense. 
    // The backend trigger (trg_sync_subscription_status) will automatically 
    // update the subscription's last_paid_month in the exact same transaction.
    const expenseAdded = await this.expenseService.addExpense({
      title: subscription.title,
      amount: subscription.amount,
      category: `${subscription.category} (Subscription)`,
      date: expenseDate,
      subscription_id: subscription.id
    }, true);

    if (!expenseAdded) {
      // Toast shown by expense service
      return false;
    }

    // Since the database trigger updates the subscription, the realtime subscription 
    // will catch the change and update the UI automatically.
    this.toastService.showSuccess(`Payment recorded for ${subscription.title}.`);
    return true;
  }
}
