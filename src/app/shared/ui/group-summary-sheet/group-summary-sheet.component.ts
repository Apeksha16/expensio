import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplitService } from '../../../core/services/split.service';
import { FriendService } from '../../../core/services/friend.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-group-summary-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-[60]"
      [class.pointer-events-none]="!splitService.isGroupSummarySheetOpen()"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/40 transition-opacity duration-300"
        [class.opacity-0]="!splitService.isGroupSummarySheetOpen()"
        [class.opacity-100]="splitService.isGroupSummarySheetOpen()"
        (click)="close()"
      ></div>

      <!-- Bottom Sheet -->
      <div
        class="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl transition-transform duration-300 ease-out flex flex-col max-h-[90vh]"
        [class.translate-y-full]="!splitService.isGroupSummarySheetOpen()"
        [class.translate-y-0]="splitService.isGroupSummarySheetOpen()"
      >
          <!-- Header -->
          <div class="px-6 pt-6 pb-4 flex justify-between items-center shrink-0 border-b border-gray-100">
            <div>
              <h2 class="text-xl font-extrabold text-gray-900 tracking-tight">Group Summary</h2>
              <p class="text-[13px] font-bold text-gray-500 mt-0.5">
                {{ activeGroup()?.name }}
                @if (splitService.activeMonth()) {
                  <span> • {{ getMonthLabel(splitService.activeMonth()) }}</span>
                }
              </p>
            </div>
            
            @if (groupExpenses().length > 0 && memberBalances().length > 0) {
              <button 
                (click)="showSmartSettle.set(!showSmartSettle())"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-sm transition-all active:scale-95 text-[11px] uppercase tracking-wide font-extrabold"
                [ngClass]="showSmartSettle() ? 'text-splits-primary border-splits-primary bg-splits-primary/10' : 'bg-white border-gray-200 text-gray-600'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-3.5 h-3.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
                Simplify
              </button>
            }
          </div>

          <div class="px-6 py-4 flex-1 overflow-y-auto scroll-smooth no-scrollbar pb-8">
            <div class="flex flex-col gap-4">
              @if (groupExpenses().length === 0) {
                <div class="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <h4 class="text-[17px] font-extrabold text-slate-800 mb-2">No group expenses yet</h4>
                  <p class="text-[13px] font-medium text-slate-500 max-w-[240px] leading-relaxed">
                    Add an expense to this group to start tracking balances.
                  </p>
                </div>
              } @else {
                @if (!showSmartSettle()) {
                  @for (member of memberBalances(); track member.userId) {
                  <div class="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/80 mb-3 last:mb-0">
                    <div class="flex items-center gap-3 min-w-0">
                      <img [src]="member.avatar" class="w-11 h-11 rounded-full object-cover shadow-sm border-2 border-white bg-gray-100 shrink-0" />
                      
                      <div class="flex flex-col truncate pr-2">
                        <span class="font-bold text-gray-900 truncate text-[15px]">{{ member.name }}</span>
                        <span class="font-medium text-[13px] italic truncate mt-0.5"
                              [ngClass]="member.balance > 0 ? 'text-green-500' : 'text-red-500'">
                          {{ member.balance > 0 ? 'is owed' : 'owes' }}
                        </span>
                      </div>
                    </div>
                    <div class="flex flex-col items-end pl-3 shrink-0">
                      <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Amount</span>
                      <span class="text-base font-black tracking-tight"
                            [ngClass]="member.balance > 0 ? 'text-green-600' : 'text-red-600'">
                        ₹{{ (member.balance > 0 ? member.balance : -member.balance) | number: '1.0-0' }}
                      </span>
                    </div>
                  </div>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <span class="text-[16px] font-extrabold text-gray-400">All Settled!</span>
                    </div>
                  }
                } @else {
                  @for (settlement of groupSettlements(); track $index) {
                  <div class="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/80 mb-3 last:mb-0">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="relative shrink-0 flex items-center">
                         <div class="relative w-11 h-11">
                            <img [src]="settlement.debtorAvatar" class="w-8 h-8 rounded-full absolute top-0 left-0 border-2 border-white object-cover shadow-sm bg-gray-100" />
                            <img [src]="settlement.creditorAvatar" class="w-8 h-8 rounded-full absolute bottom-0 right-0 border-2 border-white object-cover shadow-sm bg-gray-100 z-10" />
                         </div>
                      </div>
                      
                      <div class="flex flex-col truncate pr-2">
                        <div class="flex items-center gap-1.5 text-[14px] truncate">
                          <span class="font-bold text-gray-900 truncate">{{ settlement.debtorName }}</span>
                        </div>
                        <div class="flex items-center gap-1.5 text-[14px] truncate">
                          <span class="text-gray-400 font-medium text-[13px] italic">pays</span>
                          <span class="font-bold text-gray-900 truncate">{{ settlement.creditorName }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-col items-end pl-3 shrink-0">
                      <span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Amount</span>
                      <span class="text-base font-black text-gray-900 tracking-tight">₹{{ settlement.amount | number: '1.0-0' }}</span>
                    </div>
                  </div>
                  } @empty {
                    <div class="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <span class="text-[16px] font-extrabold text-gray-400">All Settled!</span>
                    </div>
                  }
                }
              }
            </div>
            
            <!-- Bottom Actions -->
            <div class="mt-8 flex gap-3">
              @if (memberBalances().length === 0) {
                <button
                  (click)="close()"
                  class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-slate-100 text-slate-700 text-center"
                >
                  Close
                </button>
              } @else {
                <button
                  (click)="close()"
                  class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-slate-100 text-slate-700 text-center"
                >
                  Cancel
                </button>
                <button
                  (click)="settleAll()"
                  class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-splits-primary text-white shadow-md shadow-splits-primary/30 disabled:opacity-50 disabled:active:scale-100"
                >
                  Settle Up
                </button>
              }
            </div>
          </div>
      </div>
    </div>
  `,
})
export class GroupSummarySheetComponent {
  splitService = inject(SplitService);
  friendService = inject(FriendService);
  authService = inject(AuthService);
  confirmService = inject(ConfirmService);
  toastService = inject(ToastService);
  
  showSmartSettle = signal(false);
  
  currentUser = this.authService.userProfile;

  activeGroup = computed(() => {
    const id = this.splitService.activeGroupId();
    if (!id) return null;
    return this.splitService.groups().find(g => g.id === id) || null;
  });

  groupExpenses = computed(() => {
    const groupId = this.splitService.activeGroupId();
    if (!groupId) return [];
    return this.splitService.splits().filter(s => s.group_id === groupId && !s.parent_expense_id);
  });

  memberBalances = computed(() => {
    const group = this.activeGroup();
    if (!group) return [];
    const splits = this.groupExpenses();
    
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

    return Object.entries(netBalances)
      .filter(([_, balance]) => Math.abs(balance) > 0.01)
      .map(([userId, balance]) => ({
        userId,
        name: this.getMemberName(userId),
        avatar: this.getMemberAvatar(userId),
        balance
      }))
      .sort((a, b) => b.balance - a.balance); // Creditors first, then debtors
  });

  groupSettlements = computed(() => {
    const balances = this.memberBalances();
    // Create deep copies to avoid mutating memberBalances cache and sort largest to smallest
    const creditors = balances.filter(m => m.balance > 0).map(m => ({ ...m })).sort((a, b) => b.balance - a.balance);
    const debtors = balances.filter(m => m.balance < 0).map(m => ({ ...m, balance: -m.balance })).sort((a, b) => b.balance - a.balance);
    
    const settlements: Array<{ debtorId: string, creditorId: string, amount: number, debtorName: string, debtorAvatar: string, creditorName: string, creditorAvatar: string }> = [];

    // Phase 1: Exact matches (minimizes transactions for perfectly matching debts)
    for (let i = 0; i < debtors.length; i++) {
      if (debtors[i].balance < 0.01) continue;
      for (let j = 0; j < creditors.length; j++) {
        if (creditors[j].balance < 0.01) continue;
        
        if (Math.abs(debtors[i].balance - creditors[j].balance) < 0.01) {
          settlements.push({
            debtorId: debtors[i].userId,
            creditorId: creditors[j].userId,
            amount: debtors[i].balance,
            debtorName: debtors[i].name,
            debtorAvatar: debtors[i].avatar,
            creditorName: creditors[j].name,
            creditorAvatar: creditors[j].avatar
          });
          debtors[i].balance = 0;
          creditors[j].balance = 0;
          break; // Debtor settled, move to next
        }
      }
    }

    // Phase 2: Greedy matching for remaining balances
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      if (debtors[i].balance < 0.01) { i++; continue; }
      if (creditors[j].balance < 0.01) { j++; continue; }
      
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const amount = Math.min(debtor.balance, creditor.balance);
      
      settlements.push({
        debtorId: debtor.userId,
        creditorId: creditor.userId,
        amount,
        debtorName: debtor.name,
        debtorAvatar: debtor.avatar,
        creditorName: creditor.name,
        creditorAvatar: creditor.avatar
      });
      
      debtor.balance -= amount;
      creditor.balance -= amount;
      
      if (debtor.balance < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }

    return settlements;
  });

  getMemberName(memberId: string): string {
    if (memberId === this.currentUser()?.id) {
       return 'You';
    }
    const friend = this.friendService.acceptedFriends().find((f: any) => f.profile.id === memberId);
    return friend ? friend.profile.name : memberId;
  }
  
  isGuest(memberId: string): boolean {
    const friend = this.friendService.acceptedFriends().find((f: any) => f.profile.id === memberId);
    return friend ? !!friend.profile.isGuest : false;
  }
  
  getMemberAvatar(memberId: string): string {
    if (memberId === this.currentUser()?.id) {
       return this.authService.getAvatarUrl(this.currentUser()!.avatarId);
    }
    const friend = this.friendService.acceptedFriends().find((f: any) => f.profile.id === memberId);
    return friend ? this.authService.getAvatarUrl(friend.profile.avatarId) : '';
  }

  getMonthLabel(monthString: string): string {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  close() {
    this.splitService.isGroupSummarySheetOpen.set(false);
  }

  settleAll() {
    const month = this.splitService.activeMonth();
    const title = month ? `Settle ${this.getMonthLabel(month)} Expenses` : 'Settle All Expenses';
    const message = month 
      ? `Are you sure you want to settle all your expenses for ${this.getMonthLabel(month)} with everyone in this group?`
      : 'Are you sure you want to settle all your expenses with everyone in this group?';

    this.confirmService.open({
      title,
      message,
      confirmText: 'Settle All',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const promises: Promise<boolean>[] = [];
        const currentUserId = this.currentUser()?.id;
        
        this.groupExpenses().forEach((split) => {
          const updatedSplit = { ...split };
          let changed = false;

          updatedSplit.participants = updatedSplit.participants.map((p: any) => {
             if (p.userId === split.payer_id || p.status === 'settled') return p;
             
             const isPayerMe = split.payer_id === currentUserId;
             const isPayerGuest = this.isGuest(split.payer_id);
             const isPMe = p.userId === currentUserId;
             const isPGuest = this.isGuest(p.userId);

             // If the current user has authority over the payer or the participant
             if (isPayerMe) {
                 changed = true;
                 return { ...p, status: 'settled' };
             } else if (isPMe) {
                 changed = true;
                 return { ...p, status: isPayerGuest ? 'settled' : 'pending' };
             } else if (isPayerGuest && isPGuest) {
                 changed = true;
                 return { ...p, status: 'settled' };
             }
             return p;
          });
          
          if (changed) {
            promises.push(this.splitService.updateSplit(updatedSplit as any, true));
          }
        });

        const results = await Promise.all(promises);
        if (results.every((r) => r !== false)) {
          this.toastService.showSuccess('Group expenses are settled.');
          this.close();
        }
      }
    });
  }
}
