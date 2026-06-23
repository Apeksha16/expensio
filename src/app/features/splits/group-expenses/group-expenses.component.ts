import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SplitService, SplitExpense } from '../../../core/services/split.service';
import { FriendService } from '../../../core/services/friend.service';
import { AuthService } from '../../../core/services/auth.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-group-expenses',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  template: `
    <div class="h-full bg-gray-50 flex flex-col relative w-full overflow-hidden">
      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto bg-gray-50 relative pb-20 p-4">
        <!-- Black Box for Group Balance -->
        <div class="bg-black p-6 mb-4 flex flex-col gap-4 rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
          <div class="flex justify-between items-center w-full">
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1"
                >YOU ARE OWED</span
              >
              <span class="text-3xl font-black tracking-tight text-green-500"
                >₹{{ groupBalance().owed | number: '1.0-2' }}</span
              >
            </div>
            <div class="flex flex-col items-end">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1"
                >YOU OWE</span
              >
              <span class="text-2xl font-black tracking-tight text-red-400"
                >₹{{ groupBalance().owe | number: '1.0-2' }}</span
              >
            </div>
          </div>
          
          <div class="flex justify-center w-full">
            <button
              (click)="settleUp()"
              class="px-8 py-2 border-2 border-white text-white font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors rounded-none"
            >
              Settle Up
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-1.5 mt-2">
          @if (groupExpenses().length > 0) {
            @for (split of groupExpenses(); track split.id) {
              <button
                (click)="editSplit(split)"
                class="w-full bg-gray-200 rounded-none p-4 flex flex-col gap-1 text-left hover:bg-gray-300 transition-colors active:bg-gray-400"
              >
                <div class="flex justify-between items-start gap-4">
                  <span class="font-extrabold text-lg text-black truncate flex-1">{{ split.title }}</span>
                  <span class="font-extrabold text-lg text-black flex-shrink-0">₹{{ split.total_amount | number: '1.0-2' }}</span>
                </div>
                  <div class="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-0 mt-1">
                    <span class="whitespace-nowrap flex-shrink-0">{{ split.date | date: 'mediumDate' }}</span>
                  </div>
                  <div class="flex justify-between items-center mt-1 w-full gap-2">
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate min-w-0">
                      <span class="truncate">Paid by {{ split.payer_id === currentUser().id ? 'Me' : getFriendName(split.payer_id) }}</span>
                    </span>
                    @if (getExpenseBalance(split); as bal) {
                      <div class="flex items-center gap-3">
                        <span class="text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap" [ngClass]="bal.type === 'owed' ? 'text-green-500' : 'text-red-500'">
                          ₹{{ bal.amount | number: '1.0-0' }}
                        </span>
                        
                        @if (bal.pending) {
                          @if (bal.type === 'owed') {
                            <button
                              (click)="confirmSettlement($event, split.id)"
                              [disabled]="processingIds().has('confirm_' + split.id)"
                              class="bg-green-500 text-white px-2 py-1 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              @if (processingIds().has('confirm_' + split.id)) {
                                <svg class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              }
                              Confirm
                            </button>
                            <button
                              (click)="disputeSettlement($event, split.id)"
                              class="bg-red-500 text-white px-2 py-1 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-red-600 transition-colors"
                            >
                              Dispute
                            </button>
                          } @else {
                            <button
                              (click)="cancelSettlement($event, split.id)"
                              class="bg-orange-500 text-white px-2 py-1 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-orange-600 transition-colors"
                            >
                              Cancel
                            </button>
                          }
                        } @else {
                          <button
                            (click)="settleIndividualSplit($event, split)"
                            class="bg-black text-white px-2 py-1 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                          >
                            Settle
                          </button>
                        }
                      </div>
                    } @else {
                       <span class="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Settled</span>
                    }
                  </div>
              </button>
            }
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center mt-12">
              <div
                class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6"
              >
                <svg
                  class="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p class="text-gray-500 font-extrabold text-xl">No expenses yet</p>
              <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                Tap the + button to add the first expense for this group.
              </p>
            </div>
          }
        </div>
      </main>
    </div>
  `
})
export class GroupExpenses implements OnInit {
  splitService = inject(SplitService);
  friendService = inject(FriendService);
  authService = inject(AuthService);
  keyboardService = inject(KeyboardService);
  toastService = inject(ToastService);
  confirmService = inject(ConfirmService);
  route = inject(ActivatedRoute);
  location = inject(Location);
  
  currentUser = this.authService.userProfile;
  groupId = signal<string>('');
  processingIds = signal<Set<string>>(new Set());
  
  group = computed(() => this.splitService.groups().find(g => g.id === this.groupId()));
  groupExpenses = computed(() => this.splitService.splits().filter(s => s.group_id === this.groupId() && !s.parent_expense_id));

  groupBalance = computed(() => {
    let owed = 0;
    let owe = 0;
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) return { owed: 0, owe: 0, net: 0 };

    const simplified = this.splitService.simplifyDebts(this.groupExpenses(), currentUserId);
    Object.values(simplified).forEach(amount => {
      if (amount > 0) owed += amount;
      else if (amount < 0) owe += Math.abs(amount);
    });

    return { owed, owe, net: owed - owe };
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.groupId.set(id);
        this.splitService.activeTab.set('groups');
      }
    });
  }

  getFriendName(id: string): string {
    const friend = this.friendService.acceptedFriends().find((f) => f.profile.id === id);
    return friend ? friend.profile.name.split(' ')[0] : id;
  }

  getExpenseBalance(split: any): { type: 'owed' | 'owe', amount: number, pending?: boolean } | null {
    const me = this.currentUser()?.id;
    if (!me) return null;
    const myParticipant = split.participants?.find((p: any) => p.userId === me);
    if (!myParticipant) return null;

    const partialSettlements = this.splitService.splits().filter((s: any) => s.parent_expense_id === split.id);
    const partialSettledSum = partialSettlements
        .filter((s: any) => s.category === 'Settlement' || s.participants.some((p: any) => p.status === 'settled'))
        .reduce((sum: number, s: any) => sum + s.total_amount, 0);
        
    const partialPendingSum = partialSettlements
        .filter((s: any) => s.category === 'Pending Settlement' && !s.participants.some((p: any) => p.status === 'settled'))
        .reduce((sum: number, s: any) => sum + s.total_amount, 0);

    if (split.payer_id === me) {
      let iAmOwed = 0;
      let hasPending = false;
      split.participants.forEach((p: any) => {
        if (p.userId !== me && p.status !== 'settled') {
          iAmOwed += p.amountOwed;
          if (p.status === 'pending') hasPending = true;
        }
      });
      
      iAmOwed -= (partialSettledSum + partialPendingSum);
      if (partialPendingSum > 0) hasPending = true;

      if (iAmOwed > 0) return { type: 'owed', amount: iAmOwed, pending: hasPending };
      return null;
    } else {
      if (myParticipant.amountOwed > 0 && myParticipant.status !== 'settled') {
        const iOwe = myParticipant.amountOwed - partialSettledSum - partialPendingSum;
        const isPending = myParticipant.status === 'pending' || partialPendingSum > 0;
        if (iOwe > 0) return { type: 'owe', amount: iOwe, pending: isPending };
      }
      return null;
    }
  }

  settleUp() {
    this.confirmService.open({
      title: 'Settle Group Expenses',
      message: 'Are you sure you want to settle all your expenses with everyone in this group?',
      confirmText: 'Settle All',
      cancelText: 'Cancel',
      onConfirm: async () => {
         const promises: Promise<void>[] = [];
         const currentUserId = this.currentUser()?.id;
         this.groupExpenses().forEach(split => {
           const updatedSplit = { ...split };
           let changed = false;
           
           if (split.payer_id === currentUserId) {
             updatedSplit.participants = updatedSplit.participants.map((p: any) => {
               if (p.userId !== currentUserId && p.status !== 'settled') {
                 changed = true;
                 return { ...p, status: 'settled' };
               }
               return p;
             });
           } else {
             updatedSplit.participants = updatedSplit.participants.map((p: any) => {
               if (p.userId === currentUserId && p.status !== 'settled' && p.status !== 'pending') {
                 changed = true;
                 return { ...p, status: 'pending' };
               }
               return p;
             });
           }
           if (changed) {
             promises.push(this.splitService.updateSplit(updatedSplit as any, true));
           }
         });

         await Promise.all(promises);
         this.toastService.showSuccess('All group expenses settled up!');
      }
    });
  }

  settleIndividualSplit(event: Event, split: SplitExpense) {
    event.stopPropagation();
    const bal = this.getExpenseBalance(split);
    if (!bal) return;

    const isOwed = bal.type === 'owed';
    
    let targetId = '';
    let targetName = 'everyone';
    if (!isOwed) {
      targetId = split.payer_id;
      targetName = this.getFriendName(split.payer_id);
    } else {
      const otherPart = split.participants?.find((p: any) => p.userId !== this.currentUser()!.id && p.amountOwed > 0);
      if (otherPart) {
        targetId = otherPart.userId;
        targetName = this.getFriendName(otherPart.userId);
      }
    }

    const message = isOwed
      ? `Are you sure you have received the money from ${targetName}?`
      : `Are you sure you have paid this amount to ${targetName}?`;

    this.confirmService.open({
      title: 'Settle Expense',
      message: message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      showInput: true,
      inputValue: bal.amount,
      inputMax: bal.amount,
      onConfirm: async (amount?: number) => {
        const settleAmount = amount ?? bal.amount;
        const isFullSettlement = settleAmount >= bal.amount;
        const myId = this.currentUser()!.id;
        
        if (isFullSettlement) {
          const updatedSplit = { ...split };
          if (!isOwed) {
            updatedSplit.participants = updatedSplit.participants.map((p: any) => 
              p.userId === myId ? { ...p, status: 'pending' } : p
            );
            await this.splitService.updateSplit(updatedSplit as any, true);
            this.toastService.showSuccess('Settlement requested! Waiting for confirmation.');
          } else {
            updatedSplit.participants = updatedSplit.participants.map((p: any) => 
              (p.userId !== myId && p.amountOwed > 0) ? { ...p, status: 'settled' } : p
            );
            await this.splitService.updateSplit(updatedSplit as any, true);
            this.toastService.showSuccess('Expense settled successfully!');
          }
        } else {
          // Partial Settlement
          let payerId = '';
          let participantId = '';
          
          if (isOwed) {
             payerId = targetId;
             participantId = myId;
          } else {
             payerId = myId;
             participantId = targetId;
          }

          const newSplit: Omit<SplitExpense, 'id' | 'created_at'> = {
             title: 'Partial Settlement',
             total_amount: settleAmount,
             payer_id: payerId,
             participants: [
               { userId: participantId, amountOwed: settleAmount }, 
               { userId: payerId, amountOwed: 0 }
             ],
             participant_ids: [participantId, payerId],
             date: new Date().toISOString(),
             category: isOwed ? 'Settlement' : 'Pending Settlement',
             group_id: split.group_id || null,
             parent_expense_id: split.id
          };

          await this.splitService.addSplit(newSplit);
        }
      }
    });
  }

  addExpenseToGroup() {
    this.keyboardService.openKeyboardSync();
    this.splitService.openAddSplitSheet({ group_id: this.groupId() } as any);
  }

  confirmSettlement(event: Event, splitId: string) {
    event.stopPropagation();
    const split = this.splitService.splits().find((s: any) => s.id === splitId);
    if (!split) return;
    
    this.confirmService.open({
      title: 'Confirm Settlement',
      message: 'Are you sure you have received the money?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const key = 'confirm_' + splitId;
        const current = new Set(this.processingIds());
        current.add(key);
        this.processingIds.set(current);
        
        try {
          const updatedSplit = { ...split };
          updatedSplit.participants = updatedSplit.participants.map((p: any) => 
            p.status === 'pending' ? { ...p, status: 'settled' } : p
          );
          await this.splitService.updateSplit(updatedSplit as any, true);
          this.toastService.showSuccess('Settlement confirmed successfully!');
        } finally {
          const after = new Set(this.processingIds());
          after.delete(key);
          this.processingIds.set(after);
        }
      }
    });
  }

  cancelSettlement(event: Event, splitId: string) {
    event.stopPropagation();
    const myId = this.currentUser()?.id;
    if (!myId) return;
    this.confirmService.open({
      title: 'Cancel Settlement Request',
      message: 'Are you sure you want to cancel your settlement request?',
      confirmText: 'Yes, Cancel',
      cancelText: 'Keep',
      onConfirm: async () => {
        await this.splitService.cancelSettlement(splitId, myId);
      }
    });
  }

  disputeSettlement(event: Event, splitId: string) {
    event.stopPropagation();
    this.confirmService.open({
      title: 'Dispute Settlement',
      message: 'This will cancel the settlement request and revert this expense to pending.',
      confirmText: 'Dispute',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await this.splitService.disputeSettlement(splitId);
      }
    });
  }

  editSplit(split: SplitExpense) {
    if (split.category === 'Settlement' || split.category === 'Pending Settlement') return;
    if (split.payer_id !== this.currentUser()?.id) {
       this.toastService.showError("You can only edit expenses that you added.");
       return;
    }
    this.splitService.openAddSplitSheet(split);
  }
}
