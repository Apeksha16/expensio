import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SplitService, SplitExpense } from '../../core/services/split.service';
import { FriendService } from '../../core/services/friend.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { KeyboardService } from '../../core/services/keyboard.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-splits',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  template: `
    <div class="h-full bg-gray-50 p-4 flex flex-col gap-4">
      @if (isInitialLoading()) {
        <!-- Top Summary Box Shimmer -->
        <div
          class="bg-gray-200 p-5 rounded-none flex flex-col gap-4 relative overflow-hidden h-[124px]"
        >
          <div class="flex justify-between relative z-10 mt-2">
            <div class="flex flex-col gap-2">
              <div class="h-3 bg-gray-300 w-24 animate-pulse"></div>
              <div class="h-8 bg-gray-300 w-16 animate-pulse mt-1"></div>
            </div>
            <div class="flex flex-col gap-2 items-end">
              <div class="h-3 bg-gray-300 w-24 animate-pulse"></div>
              <div class="h-8 bg-gray-300 w-16 animate-pulse mt-1"></div>
            </div>
          </div>
        </div>
        <!-- List Shimmer -->
        <div class="flex flex-col gap-1.5 pb-36 mt-2">
          @for (i of [1, 2, 3]; track i) {
            <div
              class="w-full bg-gray-200 rounded-none p-4 flex items-center gap-4 h-[76px] animate-pulse"
            >
              <div class="flex flex-col gap-2 flex-1">
                <div class="h-4 bg-gray-300 w-1/3"></div>
                <div class="h-3 bg-gray-300 w-1/4"></div>
              </div>
              <div class="h-6 bg-gray-300 w-16"></div>
            </div>
          }
        </div>
      } @else {
        <!-- Top Summary Box -->
        <div
          class="shrink-0 bg-splits-primary text-white p-5 rounded-none flex flex-col gap-4 relative overflow-hidden"
        >
          <div class="flex justify-between relative z-10 gap-4">
            <div class="flex flex-col flex-1 min-w-0">
              <span class="text-[10px] font-bold text-splits-surface uppercase tracking-widest mb-1 opacity-80"
                >You Are Owed</span
              >
              <span class="text-3xl font-extrabold tracking-tight text-white">
                ₹{{ splitService.totalOwedToYou() | number: '1.0-0' }}
              </span>
            </div>
            <div class="flex flex-col flex-1 min-w-0 text-right">
              <span class="text-[10px] font-bold text-splits-surface uppercase tracking-widest mb-1 opacity-80"
                >You Owe</span
              >
              <span class="text-3xl font-extrabold tracking-tight text-white">
                ₹{{ splitService.totalYouOwe() | number: '1.0-0' }}
              </span>
            </div>
          </div>
        </div>
        <!-- Tabs -->
        <div class="shrink-0 flex border-b-2 mt-2 border-splits-primary">
          <button
            (click)="splitService.activeTab.set('expenses')"
            [class.bg-splits-primary]="splitService.activeTab() === 'expenses'"
            [class.text-white]="splitService.activeTab() === 'expenses'"
            class="flex-1 py-3 font-extrabold tracking-widest uppercase transition-colors"
          >
            Expenses
          </button>
          <button
            (click)="splitService.activeTab.set('groups')"
            [class.bg-splits-primary]="splitService.activeTab() === 'groups'"
            [class.text-white]="splitService.activeTab() === 'groups'"
            class="flex-1 py-3 font-extrabold tracking-widest uppercase transition-colors"
          >
            Groups
          </button>
        </div>
        
        @if (splitService.activeTab() === 'expenses') {
          @if (individualSplits().length > 0) {
            <div class="flex justify-between items-center mt-4">
               <h3 class="font-extrabold text-black uppercase tracking-widest text-sm">All Expenses</h3>
               <button
                  (click)="settleUp()"
                  class="px-4 py-1.5 border-2 border-expense-primary text-expense-dark font-bold text-[10px] uppercase tracking-widest hover:bg-expense-primary hover:text-white transition-colors rounded-none"
               >
                  Settle Up
               </button>
            </div>
          }
          <div class="flex-1 flex flex-col gap-1.5 pb-36 mt-2">
            @if (individualSplits().length > 0) {
              @for (split of individualSplits(); track split.id) {
                <button
                  (click)="editSplit(split)"
                  class="w-full bg-splits-surface border-2 border-splits-primary rounded-none p-4 flex flex-col gap-1 text-left hover:bg-splits-light transition-colors active:bg-splits-primary active:text-white"
                >
                  <div class="flex justify-between items-start gap-4">
                    <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                      <span class="font-extrabold text-lg text-splits-dark truncate">{{ split.title }}</span>
                      <div class="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-0">
                        <span class="truncate">{{ split.date | date: 'mediumDate' }}</span>
                      </div>
                    </div>
                    <span class="font-extrabold text-lg text-black flex-shrink-0">₹{{ split.total_amount | number: '1.0-2' }}</span>
                  </div>
                  <div class="flex flex-col mt-1 w-full gap-2">
                    @for (bal of getExpenseBalances(split); track bal.participantId) {
                      <div class="flex justify-between items-center w-full gap-2">
                        <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate min-w-0">
                          <span class="truncate">
                            {{ bal.type === 'owed' ? 'Owed by ' + bal.name : 'You owe ' + bal.name }}
                          </span>
                        </span>
                        <div class="flex items-center gap-3">
                          <span class="text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap" [ngClass]="bal.type === 'owed' ? 'text-green-500' : 'text-red-500'">
                            ₹{{ bal.amount | number: '1.0-2' }}
                          </span>
                          
                          @if (bal.pending) {
                            @if (bal.type === 'owed') {
                              <button
                                (click)="confirmSettlement($event, split.id, bal.participantId)"
                                [disabled]="processingIds().has('confirm_' + split.id + '_' + bal.participantId)"
                                class="bg-green-500 text-white px-2 py-1 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                              >
                                @if (processingIds().has('confirm_' + split.id + '_' + bal.participantId)) {
                                  <svg class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                }
                                Confirm
                              </button>
                              <button
                                (click)="disputeSettlement($event, split.id, bal.participantId)"
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
                              (click)="settleIndividualSplit($event, split, bal)"
                              class="bg-black text-white px-2 py-1 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                            >
                              Settle
                            </button>
                          }
                        </div>
                      </div>
                    }
                    @if (getExpenseBalances(split).length === 0) {
                       <div class="flex justify-between items-center w-full gap-2">
                         <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate min-w-0">
                           <span class="truncate">Paid by {{ split.payer_id === currentUser().id ? 'Me' : getFriendName(split.payer_id) }}</span>
                         </span>
                         <span class="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Settled</span>
                       </div>
                    }
                  </div>
                </button>
              }
            } @else {
              <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <p class="text-gray-500 font-extrabold text-xl">No splits yet</p>
                <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                  Tap the + button to add an expense with a friend.
                </p>
              </div>
            }
          </div>
        }
        
        <!-- Groups List -->
        @if (splitService.activeTab() === 'groups') {
          <div class="flex-1 flex flex-col gap-1.5 pb-36 mt-2">
          <!-- Active Groups -->
            @if (splitService.activeGroups().length > 0) {
              @for (group of splitService.activeGroups(); track group.id) {
                <button
                  (click)="openGroup(group.id)"
                  class="w-full bg-splits-surface border-2 border-splits-primary rounded-none p-4 flex flex-col gap-1 text-left hover:bg-splits-light transition-colors active:bg-splits-primary active:text-white"
                >
                  <div class="flex justify-between items-start w-full">
                    <span class="font-extrabold text-lg text-splits-dark truncate">{{ group.name }}</span>
                    <button
                      (click)="archiveGroup($event, group.id)"
                      class="text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-black px-2 py-1 transition-colors flex-shrink-0"
                    >
                      Archive
                    </button>
                  </div>
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest"
                    >{{ group.members.length }} members</span
                  >
                  @if (getGroupBalance(group.id).net > 0) {
                    <div class="flex items-center gap-4 mt-2 border-t-2 border-gray-300 pt-2 w-full">
                       <span class="text-[10px] font-extrabold text-green-600 uppercase tracking-wider">You are owed ₹{{ getGroupBalance(group.id).net | number: '1.0-2' }}</span>
                    </div>
                  } @else if (getGroupBalance(group.id).net < 0) {
                    <div class="flex items-center gap-4 mt-2 border-t-2 border-gray-300 pt-2 w-full">
                       <span class="text-[10px] font-extrabold text-red-500 uppercase tracking-wider">You owe ₹{{ (0 - getGroupBalance(group.id).net) | number: '1.0-2' }}</span>
                    </div>
                  } @else {
                     <div class="flex items-center mt-2 border-t-2 border-gray-300 pt-2 w-full">
                        <span class="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">Settled up</span>
                     </div>
                  }
                </button>
              }
            } @else {
              <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
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
                <p class="text-gray-500 font-extrabold text-xl">No groups yet</p>
                <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                  Tap the + button below to create your first group.
                </p>
              </div>
            }

            <!-- Archived Groups -->
            @if (splitService.archivedGroups().length > 0) {
              <div class="mt-6 mb-2">
                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Archived Groups</span>
              </div>
              @for (group of splitService.archivedGroups(); track group.id) {
                <div class="w-full bg-white border border-gray-200 rounded-none p-4 flex flex-col gap-1 opacity-60">
                  <div class="flex justify-between items-center w-full">
                    <span class="font-extrabold text-base text-gray-500 truncate">{{ group.name }}</span>
                    <button
                      (click)="restoreGroup($event, group.id)"
                      class="text-[9px] font-bold text-gray-500 uppercase tracking-widest hover:text-black px-2 py-1 transition-colors border border-gray-300"
                    >
                      Restore
                    </button>
                  </div>
                  <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{{ group.members.length }} members · Archived</span>
                </div>
              }
            }
          </div>
        }
      }
    </div>
  `,
})
export class Splits implements OnInit {
  splitService = inject(SplitService);
  friendService = inject(FriendService);
  authService = inject(AuthService);
  confirmService = inject(ConfirmService);
  toastService = inject(ToastService);
  keyboardService = inject(KeyboardService);
  router = inject(Router);
  currentUser = this.authService.userProfile;

  isInitialLoading = signal(true);
  processingIds = signal<Set<string>>(new Set());
  Math = Math; // for template

  individualSplits = computed(() => {
    return this.splitService.splits().filter(s => !s.group_id && !s.parent_expense_id);
  });

  ngOnInit() {
    setTimeout(() => {
      this.isInitialLoading.set(false);
    }, 2000);
  }

  getFriendName(id: string): string {
    const f = this.friendService.acceptedFriends().find((x: any) => x.profile.id === id);
    return f ? f.profile.name.split(' ')[0] : id;
  }

  getExpenseBalances(split: any): { participantId: string, name: string, type: 'owed' | 'owe', amount: number, pending: boolean, status?: string }[] {
    const me = this.currentUser()?.id;
    if (!me) return [];
    const myParticipant = split.participants?.find((p: any) => p.userId === me);
    if (!myParticipant) return [];

    const balances: any[] = [];

    const partialSettlements = this.splitService.splits().filter((s: any) => s.parent_expense_id === split.id);
    
    if (split.payer_id === me) {
      split.participants.forEach((p: any) => {
        if (p.userId !== me && p.status !== 'settled' && p.amountOwed > 0) {
          const pSettled = partialSettlements.filter(s => s.payer_id === p.userId && s.category === 'Settlement').reduce((sum, s) => sum + s.total_amount, 0);
          const pPending = partialSettlements.filter(s => s.payer_id === p.userId && s.category === 'Pending Settlement').reduce((sum, s) => sum + s.total_amount, 0);
          
          const iAmOwed = p.amountOwed - pSettled - pPending;
          const hasPending = p.status === 'pending' || pPending > 0;
          
          if (iAmOwed > 0 || hasPending) {
             balances.push({
                participantId: p.userId,
                name: this.getFriendName(p.userId),
                type: 'owed',
                amount: iAmOwed > 0 ? iAmOwed : p.amountOwed,
                pending: hasPending,
                status: p.status
             });
          }
        }
      });
    } else {
      if (myParticipant.amountOwed > 0 && myParticipant.status !== 'settled') {
         const mySettled = partialSettlements.filter(s => s.payer_id === me && s.category === 'Settlement').reduce((sum, s) => sum + s.total_amount, 0);
         const myPending = partialSettlements.filter(s => s.payer_id === me && s.category === 'Pending Settlement').reduce((sum, s) => sum + s.total_amount, 0);
         
         const iOwe = myParticipant.amountOwed - mySettled - myPending;
         const isPending = myParticipant.status === 'pending' || myPending > 0;
         
         if (iOwe > 0 || isPending) {
            balances.push({
               participantId: split.payer_id,
               name: this.getFriendName(split.payer_id),
               type: 'owe',
               amount: iOwe > 0 ? iOwe : myParticipant.amountOwed,
               pending: isPending,
               status: myParticipant.status
            });
         }
      }
    }
    
    if (split.payer_id === me && balances.length > 1) {
      if (balances.every(b => !b.pending)) {
         const totalOwed = balances.reduce((sum, b) => sum + b.amount, 0);
         return [{
            participantId: 'all',
            name: 'everyone',
            type: 'owed',
            amount: totalOwed,
            pending: false
         }];
      }
    }
    
    return balances;
  }

  settleUp() {
    this.confirmService.open({
      title: 'Settle All Expenses',
      message: 'Are you sure you want to settle all your expenses with everyone?',
      confirmText: 'Settle All',
      cancelText: 'Cancel',
      onConfirm: async () => {
         const currentUserId = this.currentUser()?.id;

         const promises: Promise<boolean>[] = [];
         this.individualSplits().forEach(split => {
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

         const results = await Promise.all(promises);
         if (results.every(r => r !== false)) {
           this.toastService.showSuccess('All expenses are settled.');
         }
      }
    });
  }

  settleIndividualSplit(event: Event, split: SplitExpense, bal: any) {
    event.stopPropagation();
    const isOwed = bal.type === 'owed';
    
    let targetId = bal.participantId;
    let targetName = bal.name;

    const message = isOwed
      ? `Are you sure you have received the money from ${targetName}?`
      : `Are you sure you have paid this amount to ${targetName}?`;

    this.confirmService.open({
      title: 'Settle Expense',
      message: message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      showInput: targetId !== 'all',
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
            const success = await this.splitService.updateSplit(updatedSplit as any, true, true);
            if (success) this.toastService.showSuccess('Settlement request sent. Waiting for confirmation.');
          } else {
            updatedSplit.participants = updatedSplit.participants.map((p: any) => 
              (targetId === 'all' ? (p.userId !== myId && p.amountOwed > 0) : (p.userId === targetId)) 
                 ? { ...p, status: 'settled' } 
                 : p
            );
            const success = await this.splitService.updateSplit(updatedSplit as any, true, true);
            if (success) this.toastService.showSuccess('Expense settled successfully.');
          }
        } else {
          // Partial Settlement
          if (targetId === 'all') {
             this.toastService.showError("Partial settlement is not allowed when settling multiple participants at once.");
             return;
          }
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

  confirmSettlement(event: Event, splitId: string, participantId: string) {
    event.stopPropagation();
    const split = this.splitService.splits().find((s: any) => s.id === splitId);
    if (!split) return;
    
    this.confirmService.open({
      title: 'Confirm Settlement',
      message: 'Are you sure you have received the money?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const key = 'confirm_' + splitId + '_' + participantId;
        const current = new Set(this.processingIds());
        current.add(key);
        this.processingIds.set(current);
        
        try {
          const updatedSplit = { ...split };
          updatedSplit.participants = updatedSplit.participants.map((p: any) => 
            p.userId === participantId && p.status === 'pending' ? { ...p, status: 'settled' } : p
          );
          const success = await this.splitService.updateSplit(updatedSplit as any, true);
          if (success) this.toastService.showSuccess('Settlement confirmed successfully.');
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

  disputeSettlement(event: Event, splitId: string, participantId: string) {
    event.stopPropagation();
    const split = this.splitService.splits().find((s: any) => s.id === splitId);
    if (!split) return;

    this.confirmService.open({
      title: 'Dispute Settlement',
      message: 'This will cancel the settlement request and revert this expense to pending. The other person will need to re-initiate the settle.',
      confirmText: 'Dispute',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const updatedSplit = { ...split };
        updatedSplit.participants = updatedSplit.participants.map((p: any) => 
          p.userId === participantId && p.status === 'pending' ? { ...p, status: undefined } : p
        );
        const success = await this.splitService.updateSplit(updatedSplit as any, true);
        if (success) this.toastService.showSuccess('Settlement disputed successfully.');
      }
    });
  }

  editSplit(split: SplitExpense) {
    if (split.category === 'Settlement' || split.category === 'Pending Settlement') return;
    if (split.payer_id !== this.currentUser()?.id) {
       this.toastService.showError("You can only edit expenses you created.");
       return;
    }
    this.splitService.openAddSplitSheet(split);
  }

  getGroupBalance(groupId: string) {
    const groupSplits = this.splitService.splits().filter(s => s.group_id === groupId);
    let owed = 0;
    let owe = 0;
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) return { owed: 0, owe: 0, net: 0 };

    const simplified = this.splitService.simplifyDebts(groupSplits, currentUserId);
    Object.values(simplified).forEach(amount => {
      if (amount > 0) owed += amount;
      else if (amount < 0) owe += Math.abs(amount);
    });
    
    return { owed, owe, net: owed - owe };
  }

  openGroup(groupId: string) {
    this.router.navigate(['/splits/group', groupId]);
  }

  archiveGroup(event: Event, groupId: string) {
    event.stopPropagation();
    this.confirmService.open({
      title: 'Archive Group',
      message: 'Archived groups are read-only. Balances are still calculated. You can restore anytime.',
      confirmText: 'Archive',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await this.splitService.archiveGroup(groupId, true);
      }
    });
  }

  restoreGroup(event: Event, groupId: string) {
    event.stopPropagation();
    this.splitService.archiveGroup(groupId, false);
  }
}
