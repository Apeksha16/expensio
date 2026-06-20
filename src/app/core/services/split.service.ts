import { Injectable, signal, PLATFORM_ID, inject, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { ExpenseService } from './expense.service';

export interface SplitParticipant {
  userId: string;
  amountOwed: number;
}

export interface SplitExpense {
  id: string;
  title: string;
  total_amount: number;
  payer_id: string;
  participants: SplitParticipant[];
  participant_ids: string[];
  group_id?: string | null;
  category?: string | null;
  date: string;
  created_at: string;
}

export interface SplitGroup {
  id: string;
  name: string;
  creator_id: string;
  members: string[]; // user ids
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class SplitService {
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  private supabase = inject(SupabaseService);
  private toastService = inject(ToastService);
  private expenseService = inject(ExpenseService);

  // Sheet state
  readonly isSheetOpen = signal<boolean>(false);
  readonly isGroupSheetOpen = signal<boolean>(false);
  readonly editingGroup = signal<SplitGroup | null>(null);
  readonly editingSplit = signal<SplitExpense | null>(null);
  
  readonly activeTab = signal<'expenses' | 'groups'>('expenses');

  // Data state
  readonly splits = signal<SplitExpense[]>([]);
  readonly groups = signal<SplitGroup[]>([]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Small delay to ensure auth is ready or wait for auth events
      setTimeout(() => {
        this.loadData();
        this.setupRealtime();
      }, 100);
    }
  }

  private async loadData() {
    const user = this.authService.userProfile();
    if (!user) return;

    // Load Groups
    const { data: groupsData } = await this.supabase.client
      .from('split_groups')
      .select('*')
      .order('created_at', { ascending: false });
    if (groupsData) this.groups.set(groupsData);

    // Load Expenses
    const { data: expensesData } = await this.supabase.client
      .from('split_expenses')
      .select('*')
      .order('date', { ascending: false });
    if (expensesData) this.splits.set(expensesData);

    // Sync expense service so splits show up immediately in expenses list
    this.expenseService.fetchExpenses();
  }

  private setupRealtime() {
    this.supabase.client
      .channel('public:split_groups')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'split_groups' }, () => {
        this.loadData();
      })
      .subscribe();

    this.supabase.client
      .channel('public:split_expenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'split_expenses' }, () => {
        this.loadData();
      })
      .subscribe();
  }

  // --- Actions ---

  async addSplit(split: Omit<SplitExpense, 'id' | 'created_at'>) {
    const { data, error } = await this.supabase.client
      .from('split_expenses')
      .insert([split])
      .select()
      .single();
      
    if (error) {
      console.error('Error adding split:', error);
      this.toastService.showError('Failed to add split. Please try again.');
    } else if (data) {
      this.toastService.showSuccess('Split added successfully!');
      this.loadData();
    }
  }

  async updateSplit(split: SplitExpense) {
    const { data, error } = await this.supabase.client
      .from('split_expenses')
      .update({
        title: split.title,
        total_amount: split.total_amount,
        payer_id: split.payer_id,
        participants: split.participants,
        participant_ids: split.participant_ids,
        category: split.category,
        group_id: split.group_id
      })
      .eq('id', split.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating split:', error);
      this.toastService.showError('Failed to update split. Please try again.');
    } else if (data) {
      this.toastService.showSuccess('Split updated successfully!');
      this.loadData();
    }
  }

  async deleteSplit(id: string) {
    const { error } = await this.supabase.client
      .from('split_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting split:', error);
      this.toastService.showError('Failed to delete split. Please try again.');
    } else {
      this.toastService.showSuccess('Split deleted successfully!');
      this.loadData();
    }
  }

  async settleUp(friendId: string, amount: number) {
    const currentUser = this.authService.userProfile();
    if (!currentUser) return;

    let payerId = '';
    let participantId = '';
    const absAmount = Math.abs(amount);

    if (amount > 0) {
      // Friend owes me. Settle means Friend pays me.
      payerId = friendId;
      participantId = currentUser.id;
    } else {
      // I owe Friend. Settle means I pay Friend.
      payerId = currentUser.id;
      participantId = friendId;
    }

    const split: Omit<SplitExpense, 'id' | 'created_at'> = {
      title: 'Settlement',
      total_amount: absAmount,
      payer_id: payerId,
      participants: [{ userId: participantId, amountOwed: absAmount }, { userId: payerId, amountOwed: 0 }],
      participant_ids: [participantId, payerId],
      date: new Date().toISOString(),
    };

    await this.addSplit(split);
  }

  async createGroup(group: Omit<SplitGroup, 'id' | 'created_at'>) {
    const { data, error } = await this.supabase.client
      .from('split_groups')
      .insert([group])
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      this.toastService.showError('Failed to create group. Please try again.');
    } else if (data) {
      this.toastService.showSuccess('Group created successfully!');
      this.loadData();
    }
  }

  async updateGroup(group: SplitGroup) {
    const { data, error } = await this.supabase.client
      .from('split_groups')
      .update({ name: group.name, members: group.members })
      .eq('id', group.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating group:', error);
      this.toastService.showError('Failed to update group. Please try again.');
    } else if (data) {
      this.toastService.showSuccess('Group updated successfully!');
      this.loadData();
    }
  }

  async deleteGroup(id: string) {
    const { error } = await this.supabase.client
      .from('split_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting group:', error);
      this.toastService.showError('Failed to delete group. Please try again.');
    } else {
      this.toastService.showSuccess('Group deleted successfully!');
      this.loadData();
    }
  }

  // --- Computations ---

  // Calculate balances. Positive = they owe you. Negative = you owe them.
  balances = computed(() => {
    const currentUser = this.authService.userProfile()?.id;
    if (!currentUser) return {};

    const balanceMap: Record<string, number> = {};

    this.splits().forEach(split => {
      const isPayer = split.payer_id === currentUser;

      if (isPayer) {
        // You paid. Others owe you.
        split.participants.forEach(p => {
          if (p.userId !== currentUser) {
            balanceMap[p.userId] = (balanceMap[p.userId] || 0) + p.amountOwed;
          }
        });
      } else {
        // Someone else paid.
        // Did you participate?
        const myParticipant = split.participants.find(p => p.userId === currentUser);
        if (myParticipant) {
          // You owe the payer
          balanceMap[split.payer_id] = (balanceMap[split.payer_id] || 0) - myParticipant.amountOwed;
        }
      }
    });

    return balanceMap;
  });

  totalOwedToYou = computed(() => {
    return Object.values(this.balances()).filter(val => val > 0).reduce((sum, val) => sum + val, 0);
  });

  totalYouOwe = computed(() => {
    return Object.values(this.balances()).filter(val => val < 0).reduce((sum, val) => sum + Math.abs(val), 0);
  });

  // --- Sheet Controls ---

  openAddSplitSheet(split?: SplitExpense) {
    this.editingSplit.set(split || null);
    this.isSheetOpen.set(true);
  }

  openGroupSheet(group?: SplitGroup) {
    this.editingGroup.set(group || null);
    this.isGroupSheetOpen.set(true);
  }

  closeSheet() {
    this.isSheetOpen.set(false);
    this.editingSplit.set(null);
  }

  closeGroupSheet() {
    this.isGroupSheetOpen.set(false);
    this.editingGroup.set(null);
  }
}
