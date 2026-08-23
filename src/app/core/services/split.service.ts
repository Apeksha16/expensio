import { Injectable, signal, PLATFORM_ID, inject, computed, effect, untracked } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { ExpenseService } from './expense.service';

export interface SplitParticipant {
  userId: string;
  amountOwed: number;
  status?: 'pending' | 'settled';
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
  parent_expense_id?: string | null;
  paid_via?: 'Cash' | 'Credit Card' | 'UPI';
  created_at: string;
}

export interface SplitGroup {
  id: string;
  name: string;
  creator_id: string;
  members: string[]; // user ids
  created_at: string;
  is_archived?: boolean;
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
  readonly activeGroupId = signal<string | null>(null);

  // Data state
  readonly splits = signal<SplitExpense[]>([]);
  readonly groups = signal<SplitGroup[]>([]);

  // Computed group views
  readonly activeGroups = computed(() => this.groups().filter(g => !g.is_archived));
  readonly archivedGroups = computed(() => this.groups().filter(g => !!g.is_archived));

  readonly globalRpcBalances = signal<Record<string, number>>({});
  readonly rpcFailed = signal(false);

  private groupChannel: any = null;
  private expenseChannel: any = null;
  private loadDataTimeout: any;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      effect(() => {
        const user = this.authService.currentUser();
        if (user) {
          untracked(() => {
            // Small delay to ensure auth is ready
            setTimeout(() => {
              this.loadData();
              this.setupRealtime();
            }, 100);
          });
        } else {
          this.splits.set([]);
          this.groups.set([]);
          this.globalRpcBalances.set({});
          if (this.groupChannel) {
            this.supabase.client.removeChannel(this.groupChannel);
            this.groupChannel = null;
          }
          if (this.expenseChannel) {
            this.supabase.client.removeChannel(this.expenseChannel);
            this.expenseChannel = null;
          }
        }
      });
    }
  }

  async loadData(syncExpenses: boolean = false) {
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
      .order('date', { ascending: false })
      .limit(50);
      
    let allSplits = expensesData || [];

    const currentGroupId = this.activeGroupId();
    if (currentGroupId) {
       const { data: groupData } = await this.supabase.client
          .from('split_expenses')
          .select('*')
          .eq('group_id', currentGroupId)
          .order('date', { ascending: false });
          
       if (groupData) {
          const map = new Map(allSplits.map(s => [s.id, s]));
          groupData.forEach(s => map.set(s.id, s));
          allSplits = Array.from(map.values()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
       }
    }
    
    this.splits.set(allSplits);

    // Call RPC for global balances
    const { data: rpcData, error: rpcError } = await this.supabase.client.rpc('calculate_user_balances', { p_user_id: user.id });
    if (!rpcError && rpcData) {
      const balances: Record<string, number> = {};
      rpcData.forEach((row: any) => {
        balances[row.partner_id] = row.net_balance;
      });
      this.globalRpcBalances.set(balances);
      this.rpcFailed.set(false);
    } else {
      this.rpcFailed.set(true);
    }

    // Sync expense service so splits show up immediately in expenses list
    if (syncExpenses) {
      this.expenseService.refreshExpenses();
    }
  }

  triggerLoadData(syncExpenses: boolean = false) {
    if (this.loadDataTimeout) clearTimeout(this.loadDataTimeout);
    this.loadDataTimeout = setTimeout(() => {
      this.loadData(syncExpenses);
    }, 100);
  }

  private setupRealtime() {
    if (!this.groupChannel) {
      this.groupChannel = this.supabase.client
        .channel('public:split_groups')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'split_groups' }, () => {
          this.triggerLoadData(true);
        })
        .subscribe();
    }

    if (!this.expenseChannel) {
      this.expenseChannel = this.supabase.client
        .channel('public:split_expenses')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'split_expenses' }, () => {
          this.triggerLoadData(true);
        })
        .subscribe();
    }
  }

  // --- Actions ---

  async addSplit(split: Omit<SplitExpense, 'id' | 'created_at'>) {
    const splitData = { ...split, paid_via: split.paid_via || 'UPI' };
    const { data, error } = await this.supabase.client
      .from('split_expenses')
      .insert([splitData])
      .select()
      .single();
      
    if (error) {
      console.error('Error adding split:', error);
      this.toastService.showError("Couldn't create split expense. Please try again.");
    } else if (data) {
      if (split.category === 'Pending Settlement') {
        this.toastService.showSuccess('Settlement request sent. Waiting for confirmation.');
      } else if (split.category === 'Settlement') {
        this.toastService.showSuccess('Expense settled successfully.');
      } else {
        this.toastService.showSuccess('Split expense created successfully.');
      }
      this.loadData(true);
    }
  }

  async handleConfirmSettlement(originalSplitId: string, participantId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client.rpc('confirm_settlement', {
      p_original_split_id: originalSplitId,
      p_participant_id: participantId
    });

    if (!error && data) {
       this.loadData(true);
       return true;
    }
    
    console.error('Error confirming settlement:', error);
    return false;
  }

  async handleCancelOrDisputeSettlement(originalSplitId: string, participantId: string): Promise<boolean> {
    const { data, error } = await this.supabase.client.rpc('cancel_dispute_settlement', {
      p_original_split_id: originalSplitId,
      p_participant_id: participantId
    });

    if (!error && data) {
       this.loadData(true);
       return true;
    }
    
    console.error('Error cancelling settlement:', error);
    return false;
  }

  async updateSplit(split: SplitExpense, silent: boolean = false, skipValidation: boolean = false) {
    // Validate: participant amounts must sum to total_amount
    if (!skipValidation) {
      const totalParticipantAmount = split.participants
        .reduce((s, p) => s + Number(p.amountOwed || 0), 0);
      if (Math.abs(totalParticipantAmount - Number(split.total_amount || 0)) > 1) {
        this.toastService.showError(
          `Split amounts must match the total expense amount.`
        );
        return false;
      }
    }
    const { data, error } = await this.supabase.client
      .from('split_expenses')
      .update({
        title: split.title,
        total_amount: split.total_amount,
        payer_id: split.payer_id,
        participants: split.participants,
        participant_ids: split.participant_ids,
        category: split.category,
        group_id: split.group_id,
        date: split.date,
        paid_via: split.paid_via || 'UPI'
      })
      .eq('id', split.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating split:', error);
      this.toastService.showError("Couldn't update split expense. Please try again.");
      return false;
    } else if (data && !silent) {
      this.toastService.showSuccess('Split expense updated successfully.');
      this.loadData(true);
      return true;
    } else if (data) {
      this.loadData(true);
      return true;
    }
    return false;
  }

  async deleteSplit(id: string) {
    const { error } = await this.supabase.client
      .from('split_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting split:', error);
      this.toastService.showError("Couldn't delete split expense. Please try again.");
    } else {
      this.toastService.showSuccess('Split expense deleted successfully.');
      this.loadData(true);
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
      this.toastService.showError("Couldn't create group. Please try again.");
    } else if (data) {
      this.toastService.showSuccess('Group created successfully.');
      this.loadData(true);
    }
  }

  async updateGroup(group: SplitGroup) {
    const originalGroup = this.groups().find(g => g.id === group.id);
    if (originalGroup) {
      const removedMembers = originalGroup.members.filter(m => !group.members.includes(m));
      if (removedMembers.length > 0) {
        const { data: groupSplits, error: splitsError } = await this.supabase.client
          .from('split_expenses')
          .select('*')
          .eq('group_id', group.id);

        if (splitsError) {
          this.toastService.showError("Couldn't verify member balances.");
          return;
        }

        for (const userId of removedMembers) {
          const splitsWithUser = groupSplits.filter((s: any) => s.participant_ids.includes(userId));
          if (splitsWithUser.length > 0) {
             const balances = this.simplifyDebts(splitsWithUser as SplitExpense[], userId);
             const hasDues = Object.values(balances).some(b => Math.abs(b) > 0.01);
             if (hasDues) {
                this.toastService.showError("This member still has pending balances and can't be removed.");
                return;
             }
          }
        }
      }
    }

    const { data, error } = await this.supabase.client
      .from('split_groups')
      .update({ name: group.name, members: group.members })
      .eq('id', group.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating group:', error);
      this.toastService.showError("Couldn't update group. Please try again.");
    } else if (data) {
      this.toastService.showSuccess('Group updated successfully.');
      this.loadData(true);
    }
  }

  async archiveGroup(groupId: string, archive = true) {
    const { error } = await this.supabase.client
      .from('split_groups')
      .update({ is_archived: archive })
      .eq('id', groupId);

    if (error) {
      this.toastService.showError(`Couldn't ${archive ? 'archive' : 'restore'} group.`);
    } else {
      this.groups.update(gs =>
        gs.map(g => g.id === groupId ? { ...g, is_archived: archive } : g)
      );
      this.toastService.showSuccess(`Group ${archive ? 'archived' : 'restored'} successfully.`);
    }
  }

  async deleteGroup(id: string) {
    const { error } = await this.supabase.client
      .from('split_groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting group:', error);
      this.toastService.showError("Couldn't delete group. Please try again.");
    } else {
      this.toastService.showSuccess('Group deleted successfully.');
      this.loadData(true);
    }
  }

  // --- Computations ---

  simplifyDebts(splits: SplitExpense[], currentUserId: string): Record<string, number> {
    const netBalances: Record<string, number> = {};

    splits.forEach(split => {
      if (split.category === 'Pending Settlement') return;
      
      const payerId = split.payer_id;
      split.participants.forEach(p => {
        if (p.userId !== payerId && p.status !== 'settled') {
          netBalances[payerId] = (netBalances[payerId] || 0) + p.amountOwed;
          netBalances[p.userId] = (netBalances[p.userId] || 0) - p.amountOwed;
        }
      });
    });

    const creditors = Object.entries(netBalances)
      .map(([userId, balance]) => ({ userId, balance }))
      .filter(x => x.balance > 0.01)
      .sort((a, b) => b.balance - a.balance);

    const debtors = Object.entries(netBalances)
      .map(([userId, balance]) => ({ userId, balance }))
      .filter(x => x.balance < -0.01)
      .sort((a, b) => a.balance - b.balance);

    const optimizedBalances: Record<string, number> = {};

    // Pass 1: Exact 1-to-1 matching to prevent redundant transaction paths in cycle cancellation
    for (let c = 0; c < creditors.length; c++) {
      for (let d = 0; d < debtors.length; d++) {
        if (creditors[c].balance > 0.01 && debtors[d].balance < -0.01) {
          if (Math.abs(creditors[c].balance - Math.abs(debtors[d].balance)) < 0.01) {
            const amount = creditors[c].balance;
            const creditor = creditors[c];
            const debtor = debtors[d];
            
            if (debtor.userId === currentUserId) {
              optimizedBalances[creditor.userId] = (optimizedBalances[creditor.userId] || 0) - amount;
            } else if (creditor.userId === currentUserId) {
              optimizedBalances[debtor.userId] = (optimizedBalances[debtor.userId] || 0) + amount;
            }
            
            creditor.balance = 0;
            debtor.balance = 0;
            break; // Move to next creditor since this one is settled
          }
        }
      }
    }

    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      if (creditor.balance < 0.01) {
        i++;
        continue;
      }
      if (debtor.balance > -0.01) {
        j++;
        continue;
      }

      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      if (debtor.userId === currentUserId) {
        optimizedBalances[creditor.userId] = (optimizedBalances[creditor.userId] || 0) - amount;
      } else if (creditor.userId === currentUserId) {
        optimizedBalances[debtor.userId] = (optimizedBalances[debtor.userId] || 0) + amount;
      }

      creditor.balance -= amount;
      debtor.balance += amount;

      if (creditor.balance < 0.01) i++;
      if (debtor.balance > -0.01) j++;
    }

    return optimizedBalances;
  }

  // Calculate unsimplified balances for individual expense views.
  balances = computed(() => {
    const currentUser = this.authService.userProfile()?.id;
    if (!currentUser) return {};
    
    const rawBalances: Record<string, number> = {};
    
    this.splits().forEach(split => {
      if (split.category === 'Pending Settlement') return;
      
      const payerId = split.payer_id;
      split.participants.forEach(p => {
        if (p.userId !== payerId && p.status !== 'settled') {
          if (payerId === currentUser) {
            rawBalances[p.userId] = (rawBalances[p.userId] || 0) + p.amountOwed;
          } else if (p.userId === currentUser) {
            rawBalances[payerId] = (rawBalances[payerId] || 0) - p.amountOwed;
          }
        }
      });
    });
    
    return rawBalances;
  });

  // Calculate simplified balances for dashboard and group summaries.
  simplifiedBalances = computed(() => {
    if (this.rpcFailed()) {
      const currentUser = this.authService.userProfile()?.id;
      if (!currentUser) return {};
      return this.simplifyDebts(this.splits(), currentUser);
    }
    return this.globalRpcBalances();
  });

  totalOwedToYou = computed(() => {
    return Object.values(this.simplifiedBalances()).filter(val => val > 0).reduce((sum, val) => sum + val, 0);
  });

  peopleOwedToYou = computed(() => {
    return Object.values(this.simplifiedBalances()).filter(val => val > 0).length;
  });

  totalYouOwe = computed(() => {
    return Object.values(this.simplifiedBalances()).filter(val => val < 0).reduce((sum, val) => sum + Math.abs(val), 0);
  });

  peopleYouOwe = computed(() => {
    return Object.values(this.simplifiedBalances()).filter(val => val < 0).length;
  });

  // --- Sheet Controls ---

  openAddSplitSheet(split?: SplitExpense) {
    if (split && split.id) {
      const hasSettlements = split.participants?.some(p => p.status === 'settled' || p.status === 'pending');
      const hasPartialSettlements = this.splits().some(s => s.parent_expense_id === split.id);
      
      if (hasSettlements || hasPartialSettlements) {
        this.toastService.showError("Settled expenses can't be edited.");
        return;
      }
    }
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
