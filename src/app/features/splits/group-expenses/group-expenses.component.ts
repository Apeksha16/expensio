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
                    <span class="truncate">{{ split.category || 'Group Split' }}</span>
                    <span class="flex-shrink-0">•</span>
                    <span class="whitespace-nowrap flex-shrink-0">{{ split.date | date: 'mediumDate' }}</span>
                  </div>
                  <div class="flex justify-between items-center mt-1 w-full">
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <span class="whitespace-nowrap flex-shrink-0">Paid by {{ split.payer_id === currentUser().id ? 'Me' : getFriendName(split.payer_id) }}</span>
                    </span>
                    @if (split.category === 'Pending Settlement') {
                      <div class="flex items-center gap-2">
                        <span class="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest">Pending</span>
                        @if (split.participants && split.participants[0]?.userId === currentUser().id) {
                          <button
                            (click)="confirmSettlement($event, split.id)"
                            class="bg-green-500 text-white px-2 py-1 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-green-600 transition-colors"
                          >
                            Confirm
                          </button>
                        }
                      </div>
                    } @else if (split.category === 'Settlement') {
                       <span class="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">Settled</span>
                    } @else if (getExpenseBalance(split); as bal) {
                      <div class="flex items-center gap-3">
                        <span class="text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap" [ngClass]="bal.type === 'owed' ? 'text-green-500' : 'text-red-500'">
                          {{ bal.type === 'owed' ? 'You are owed' : 'You owe' }} ₹{{ bal.amount | number: '1.0-0' }}
                        </span>
                        <button
                          (click)="settleIndividualSplit($event, split)"
                          class="bg-black text-white px-2 py-1 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-gray-800 transition-colors"
                        >
                          Settle
                        </button>
                      </div>
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
  
  group = computed(() => this.splitService.groups().find(g => g.id === this.groupId()));
  groupExpenses = computed(() => this.splitService.splits().filter(s => s.group_id === this.groupId()));

  groupBalance = computed(() => {
    let owed = 0;
    let owe = 0;
    const currentUserId = this.currentUser()?.id;

    this.groupExpenses().forEach(split => {
      if (split.category === 'Pending Settlement') return;
      
      if (split.payer_id === currentUserId) {
        owed += split.participants
          .filter(p => p.userId !== currentUserId)
          .reduce((sum, p) => sum + p.amountOwed, 0);
      } else {
        owe += split.participants.find(p => p.userId === currentUserId)?.amountOwed || 0;
      }
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
    return friend ? friend.profile.username || friend.profile.email : 'Unknown';
  }

  getExpenseBalance(split: any): { type: 'owed' | 'owe', amount: number } | null {
    const user = this.currentUser();
    if (!user) return null;
    const me = user.id;
    const myParticipant = split.participants?.find((p: any) => p.userId === me);
    if (!myParticipant) return null;

    if (split.payer_id === me) {
      const iAmOwed = split.total_amount - myParticipant.amountOwed;
      if (iAmOwed > 0) return { type: 'owed', amount: iAmOwed };
      return null;
    } else {
      if (myParticipant.amountOwed > 0) return { type: 'owe', amount: myParticipant.amountOwed };
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
         const balances = new Map<string, number>();
         const currentUserId = this.currentUser()?.id;

         this.groupExpenses().forEach(split => {
            if (split.category === 'Pending Settlement') return;
            
            if (split.payer_id === currentUserId) {
              split.participants.forEach(p => {
                if (p.userId !== currentUserId) {
                  balances.set(p.userId, (balances.get(p.userId) || 0) + p.amountOwed);
                }
              });
            } else {
              const myParticipant = split.participants.find(p => p.userId === currentUserId);
              if (myParticipant && myParticipant.amountOwed > 0) {
                 balances.set(split.payer_id, (balances.get(split.payer_id) || 0) - myParticipant.amountOwed);
              }
            }
         });

         const promises: Promise<void>[] = [];
         balances.forEach((amount, friendId) => {
            if (Math.abs(amount) < 0.01) return;
            
            if (amount < 0) {
              const settleSplit: Partial<SplitExpense> = {
                title: 'Group Settlement',
                category: 'Pending Settlement',
                total_amount: Math.abs(amount),
                group_id: this.groupId(),
                payer_id: currentUserId,
                participant_ids: [friendId],
                participants: [{ userId: friendId, amountOwed: Math.abs(amount) }]
              };
              promises.push(this.splitService.addSplit(settleSplit as any));
            } else {
              const settleSplit: Partial<SplitExpense> = {
                title: 'Group Settlement',
                category: 'Settlement',
                total_amount: amount,
                group_id: this.groupId(),
                payer_id: friendId,
                participant_ids: [currentUserId],
                participants: [{ userId: currentUserId, amountOwed: amount }]
              };
              promises.push(this.splitService.addSplit(settleSplit as any));
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
    const message = isOwed
      ? 'Are you confirm that you have received the money for this expense?'
      : 'Are you sure you have paid this amount to someone?';

    this.confirmService.open({
      title: 'Settle Expense',
      message: message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: async () => {
        if (!isOwed) {
          const settleSplit: Partial<SplitExpense> = {
            title: 'Settle: ' + split.title,
            group_id: this.groupId(),
            category: 'Pending Settlement',
            total_amount: bal.amount,
            payer_id: this.currentUser()!.id,
            participant_ids: [split.payer_id],
            participants: [{ userId: split.payer_id, amountOwed: bal.amount }]
          };
          await this.splitService.addSplit(settleSplit as any);
        } else {
          const promises = split.participants
            .filter(p => p.userId !== this.currentUser()!.id && p.amountOwed > 0)
            .map(p => {
              const settleSplit: Partial<SplitExpense> = {
                title: 'Settle: ' + split.title,
                group_id: this.groupId(),
                category: 'Settlement',
                total_amount: p.amountOwed,
                payer_id: p.userId,
                participant_ids: [this.currentUser()!.id],
                participants: [{ userId: this.currentUser()!.id, amountOwed: p.amountOwed }]
              };
              return this.splitService.addSplit(settleSplit as any);
            });
          await Promise.all(promises);
        }
      }
    });
  }

  addExpenseToGroup() {
    this.keyboardService.openKeyboardSync();
    // Use the partial object to prepopulate group context
    this.splitService.openAddSplitSheet({ group_id: this.groupId() } as any);
  }

  confirmSettlement(event: Event, splitId: string) {
    event.stopPropagation();
    this.splitService.approveSettlement(splitId);
  }

  editSplit(split: SplitExpense) {
    if (split.payer_id !== this.currentUser()?.id) {
       this.toastService.showError("You can only edit expenses that you added.");
       return;
    }
    this.splitService.openAddSplitSheet(split);
  }
}
