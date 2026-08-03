import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="h-full bg-white flex flex-col relative w-full overflow-hidden">
      <!-- Fixed Header Container -->
      <div class="px-4 pt-4 shrink-0 flex flex-col gap-4">
        <!-- Top Summary Box -->
        <div class="bg-black text-white p-5 rounded-2xl flex flex-col gap-5 relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(132,204,22,1)]">
          <div class="flex justify-between items-center w-full z-10 relative">
            <div class="flex flex-col flex-1 min-w-0">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">You Are Owed</span>
              <span class="text-3xl font-black tracking-tight text-white truncate">
                ₹{{ groupBalance().owed | number: '1.0-2' }}
              </span>
            </div>
            <div class="flex flex-col flex-1 min-w-0 items-end text-right">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">You Owe</span>
              <span class="text-2xl font-black tracking-tight text-white truncate">
                ₹{{ groupBalance().owe | number: '1.0-2' }}
              </span>
            </div>
          </div>

          <div class="flex justify-center w-full z-10 relative">
            <button
              (click)="settleUp()"
              class="px-8 py-2 border-2 border-white text-white font-black text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors rounded-xl shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] active:scale-[0.98]"
            >
              Settle Up
            </button>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <main class="flex-1 overflow-y-auto no-scrollbar px-4 pb-28 mt-4">
        <div class="flex flex-col gap-3">
          @if (groupExpenses().length > 0) {
            @for (split of groupExpenses(); track split.id) {
              <button
                (click)="editSplit(split)"
                class="w-full bg-white border-2 border-black rounded-2xl p-4 flex flex-col gap-2 text-left hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-[0.99]"
              >
                <div class="flex justify-between items-start gap-4">
                  <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                    <span class="font-extrabold text-sm text-gray-900 truncate">{{ split.title }}</span>
                    <div class="flex items-center gap-2 text-[9px] font-extrabold text-gray-400 uppercase tracking-widest min-w-0">
                      <span class="truncate">{{ split.date | date: 'mediumDate' }}</span>
                    </div>
                  </div>
                  <span class="font-black text-base text-black flex-shrink-0">
                    ₹{{ split.total_amount | number: '1.0-2' }}
                  </span>
                </div>
                <div class="flex flex-col mt-1 w-full gap-2 pt-2">
                  @for (bal of getExpenseBalances(split); track bal.participantId) {
                    <div class="flex justify-between items-center w-full gap-2">
                      <span class="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest truncate min-w-0">
                        {{ bal.type === 'owed' ? 'Owed by ' + bal.name : 'You owe ' + bal.name }}
                      </span>
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] font-black tracking-widest whitespace-nowrap" [ngClass]="bal.type === 'owed' ? 'text-emerald-500' : 'text-red-500'">
                          ₹{{ bal.amount | number: '1.0-2' }}
                        </span>

                        @if (bal.pending) {
                          @if (bal.type === 'owed') {
                            <button
                              (click)="confirmSettlement($event, split.id, bal.participantId)"
                              [disabled]="processingIds().has('confirm_' + split.id + '_' + bal.participantId)"
                              class="border-2 border-emerald-500 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                              @if (processingIds().has('confirm_' + split.id + '_' + bal.participantId)) {
                                <svg class="animate-spin h-3 w-3 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              }
                              Confirm
                            </button>
                            <button
                              (click)="disputeSettlement($event, split.id, bal.participantId)"
                              class="border-2 border-red-500 text-red-600 bg-red-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                            >
                              Dispute
                            </button>
                          } @else {
                            <button
                              (click)="cancelSettlement($event, split.id)"
                              class="border-2 border-orange-500 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-orange-100 transition-colors"
                            >
                              Cancel
                            </button>
                          }
                        } @else {
                          <button
                            (click)="settleIndividualSplit($event, split, bal)"
                            class="border-2 border-black bg-black text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
                          >
                            Settle
                          </button>
                        }
                      </div>
                    </div>
                  }
                  @if (getExpenseBalances(split).length === 0) {
                    <div class="flex justify-between items-center w-full gap-2">
                      <span class="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest truncate min-w-0">
                        Paid by {{ split.payer_id === currentUser().id ? 'Me' : getFriendName(split.payer_id) }}
                      </span>
                      <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest border border-gray-200 px-1.5 py-0.5 rounded">
                        Settled
                      </span>
                    </div>
                  }
                </div>
              </button>
            }
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center h-[300px]">
              <div class="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p class="text-black font-extrabold text-xl">No expenses yet</p>
              <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                Tap the + button to add the first expense for this group.
              </p>
            </div>
          }
        </div>
      </main>
    </div>
  `,
})
export class GroupExpenses implements OnInit, OnDestroy {
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

  group = computed(() => this.splitService.groups().find((g) => g.id === this.groupId()));
  groupExpenses = computed(() =>
    this.splitService.splits().filter((s) => s.group_id === this.groupId() && !s.parent_expense_id),
  );

  groupBalance = computed(() => {
    let owed = 0;
    let owe = 0;
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) return { owed: 0, owe: 0, net: 0 };

    const simplified = this.splitService.simplifyDebts(this.groupExpenses(), currentUserId);
    Object.values(simplified).forEach((amount) => {
      if (amount > 0) owed += amount;
      else if (amount < 0) owe += Math.abs(amount);
    });

    return { owed, owe, net: owed - owe };
  });

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.groupId.set(id);
        this.splitService.activeGroupId.set(id);
        this.splitService.activeTab.set('groups');
        this.splitService.loadData();
      }
    });
  }

  ngOnDestroy() {
    this.splitService.activeGroupId.set(null);
  }

  getFriendName(id: string): string {
    const friend = this.friendService.acceptedFriends().find((f) => f.profile.id === id);
    return friend ? friend.profile.name.split(' ')[0] : id;
  }

  getExpenseBalances(
    split: any,
  ): {
    participantId: string;
    name: string;
    type: 'owed' | 'owe';
    amount: number;
    pending: boolean;
    status?: string;
  }[] {
    const me = this.currentUser()?.id;
    if (!me) return [];
    const myParticipant = split.participants?.find((p: any) => p.userId === me);
    if (!myParticipant) return [];

    const balances: any[] = [];

    const partialSettlements = this.splitService
      .splits()
      .filter((s: any) => s.parent_expense_id === split.id);

    if (split.payer_id === me) {
      split.participants.forEach((p: any) => {
        if (p.userId !== me && p.status !== 'settled' && p.amountOwed > 0) {
          const pSettled = partialSettlements
            .filter((s) => s.payer_id === p.userId && s.category === 'Settlement')
            .reduce((sum, s) => sum + s.total_amount, 0);
          const pPending = partialSettlements
            .filter((s) => s.payer_id === p.userId && s.category === 'Pending Settlement')
            .reduce((sum, s) => sum + s.total_amount, 0);

          const iAmOwed = p.amountOwed - pSettled - pPending;
          const hasPending = p.status === 'pending' || pPending > 0;

          if (iAmOwed > 0 && p.status !== 'pending') {
            balances.push({
              participantId: p.userId,
              name: this.getFriendName(p.userId),
              type: 'owed',
              amount: iAmOwed,
              pending: false,
              status: p.status,
            });
          }
          if (p.status === 'pending' || pPending > 0) {
            balances.push({
              participantId: p.userId,
              name: this.getFriendName(p.userId),
              type: 'owed',
              amount: p.status === 'pending' ? p.amountOwed : pPending,
              pending: true,
              status: p.status,
            });
          }
        }
      });
    } else {
      if (myParticipant.amountOwed > 0 && myParticipant.status !== 'settled') {
        const mySettled = partialSettlements
          .filter((s) => s.payer_id === me && s.category === 'Settlement')
          .reduce((sum, s) => sum + s.total_amount, 0);
        const myPending = partialSettlements
          .filter((s) => s.payer_id === me && s.category === 'Pending Settlement')
          .reduce((sum, s) => sum + s.total_amount, 0);

        const iOwe = myParticipant.amountOwed - mySettled - myPending;
        const isPending = myParticipant.status === 'pending' || myPending > 0;

        if (iOwe > 0 && myParticipant.status !== 'pending') {
          balances.push({
            participantId: split.payer_id,
            name: this.getFriendName(split.payer_id),
            type: 'owe',
            amount: iOwe,
            pending: false,
            status: myParticipant.status,
          });
        }
        if (myParticipant.status === 'pending' || myPending > 0) {
          balances.push({
            participantId: split.payer_id,
            name: this.getFriendName(split.payer_id),
            type: 'owe',
            amount: myParticipant.status === 'pending' ? myParticipant.amountOwed : myPending,
            pending: true,
            status: myParticipant.status,
          });
        }
      }
    }

    if (split.payer_id === me && balances.length > 1) {
      if (balances.every((b) => !b.pending)) {
        const totalOwed = balances.reduce((sum, b) => sum + b.amount, 0);
        return [
          {
            participantId: 'all',
            name: 'everyone',
            type: 'owed',
            amount: totalOwed,
            pending: false,
          },
        ];
      }
    }

    return balances;
  }

  settleUp() {
    this.confirmService.open({
      title: 'Settle Group Expenses',
      message: 'Are you sure you want to settle all your expenses with everyone in this group?',
      confirmText: 'Settle All',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const promises: Promise<boolean>[] = [];
        const currentUserId = this.currentUser()?.id;
        this.groupExpenses().forEach((split) => {
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
        if (results.every((r) => r !== false)) {
          this.toastService.showSuccess('All group expenses are settled.');
        }
      },
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
              p.userId === myId ? { ...p, status: 'pending' } : p,
            );
            await this.splitService.updateSplit(updatedSplit as any, true, true);
            this.toastService.showSuccess('Settlement request sent. Waiting for confirmation.');
          } else {
            updatedSplit.participants = updatedSplit.participants.map((p: any) =>
              (targetId === 'all' ? p.userId !== myId && p.amountOwed > 0 : p.userId === targetId)
                ? { ...p, status: 'settled' }
                : p,
            );
            await this.splitService.updateSplit(updatedSplit as any, true, true);
            this.toastService.showSuccess('Expense settled successfully.');
          }
        } else {
          // Partial Settlement
          if (targetId === 'all') {
            this.toastService.showError(
              'Partial settlement is not allowed when settling multiple participants at once.',
            );
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
            title: 'Settlement',
            total_amount: settleAmount,
            payer_id: payerId,
            participants: [
              { userId: participantId, amountOwed: settleAmount },
              { userId: payerId, amountOwed: 0 },
            ],
            participant_ids: [participantId, payerId],
            date: new Date().toISOString(),
            category: isOwed ? 'Settlement' : 'Pending Settlement',
            group_id: split.group_id || null,
            parent_expense_id: split.id,
          };

          await this.splitService.addSplit(newSplit);
        }
      },
    });
  }

  addExpenseToGroup() {
    this.keyboardService.openKeyboardSync();
    this.splitService.openAddSplitSheet({ group_id: this.groupId() } as any);
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
          const success = await this.splitService.handleConfirmSettlement(splitId, participantId);
          if (success) {
            this.toastService.showSuccess('Settlement confirmed successfully.');
          }
        } finally {
          const after = new Set(this.processingIds());
          after.delete(key);
          this.processingIds.set(after);
        }
      },
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
        const success = await this.splitService.handleCancelOrDisputeSettlement(splitId, myId);
        if (success) {
          this.toastService.showSuccess('Settlement request cancelled.');
        }
      },
    });
  }

  disputeSettlement(event: Event, splitId: string, participantId: string) {
    event.stopPropagation();
    const split = this.splitService.splits().find((s: any) => s.id === splitId);
    if (!split) return;

    this.confirmService.open({
      title: 'Dispute Settlement',
      message: 'This will cancel the settlement request and revert this expense to pending.',
      confirmText: 'Dispute',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const success = await this.splitService.handleCancelOrDisputeSettlement(splitId, participantId);
        if (success) {
          this.toastService.showSuccess('Settlement disputed successfully.');
        }
      },
    });
  }

  editSplit(split: SplitExpense) {
    if (split.category === 'Settlement' || split.category === 'Pending Settlement') return;
    if (split.payer_id !== this.currentUser()?.id) {
      this.toastService.showError('You can only edit expenses you created.');
      return;
    }
    this.splitService.openAddSplitSheet(split);
  }
}
