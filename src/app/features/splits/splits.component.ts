import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="h-full bg-white flex flex-col relative">
      <!-- Fixed Header Container -->
      <div class="px-4 pt-4 shrink-0 flex flex-col gap-4">
        @if (isInitialLoading()) {
          <!-- Top Summary Box Shimmer -->
          <div class="flex gap-4 w-full">
            <div class="flex-1 bg-gray-50 border border-gray-100 rounded-3xl h-[160px] animate-pulse"></div>
            <div class="flex-1 bg-gray-50 border border-gray-100 rounded-3xl h-[160px] animate-pulse"></div>
          </div>
        } @else {
          <!-- Summary Cards -->
          <div class="flex gap-4 w-full">
            <!-- You'll Get -->
            <div class="flex-1 bg-[#F4F2FF] rounded-3xl p-5 flex flex-col items-start relative overflow-hidden shadow-sm">
              <div class="w-10 h-10 rounded-full bg-[#E8E4FF] flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-splits-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <span class="text-[11px] font-bold text-gray-500 mb-1">You'll Get</span>
              <span class="text-2xl font-extrabold text-gray-900 tracking-tight">
                ₹{{ splitService.totalOwedToYou() | number: '1.0-0' }}
              </span>
              <span class="text-[10px] font-bold text-gray-400 mt-1">from {{ splitService.peopleOwedToYou() }} people</span>
            </div>

            <!-- You Owe -->
            <div class="flex-1 bg-[#FFF0F4] rounded-3xl p-5 flex flex-col items-start relative overflow-hidden shadow-sm">
              <div class="w-10 h-10 rounded-full bg-[#FFE4EC] flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-[#E11D48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <span class="text-[11px] font-bold text-gray-500 mb-1">You Owe</span>
              <span class="text-2xl font-extrabold text-gray-900 tracking-tight">
                ₹{{ splitService.totalYouOwe() | number: '1.0-0' }}
              </span>
              <span class="text-[10px] font-bold text-gray-400 mt-1">to {{ splitService.peopleYouOwe() }} people</span>
            </div>
          </div>

          <!-- Tabs -->
          <div class="w-full bg-gray-100 p-1.5 rounded-[16px] flex shrink-0 mt-2">
            <button
              (click)="splitService.activeTab.set('expenses')"
              [class.bg-white]="splitService.activeTab() === 'expenses'"
              [class.text-splits-primary]="splitService.activeTab() === 'expenses'"
              [class.shadow-sm]="splitService.activeTab() === 'expenses'"
              [class.text-gray-500]="splitService.activeTab() !== 'expenses'"
              [class.hover:text-gray-700]="splitService.activeTab() !== 'expenses'"
              class="flex-1 py-3 font-extrabold text-[13px] transition-all rounded-xl"
            >
              Expenses
            </button>
            <button
              (click)="splitService.activeTab.set('groups')"
              [class.bg-white]="splitService.activeTab() === 'groups'"
              [class.text-splits-primary]="splitService.activeTab() === 'groups'"
              [class.shadow-sm]="splitService.activeTab() === 'groups'"
              [class.text-gray-500]="splitService.activeTab() !== 'groups'"
              [class.hover:text-gray-700]="splitService.activeTab() !== 'groups'"
              class="flex-1 py-3 font-extrabold text-[13px] transition-all rounded-xl"
            >
              Groups
            </button>
          </div>
        }
      </div>

      <!-- Scrollable Area -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pb-28 mt-4">
        @if (isInitialLoading()) {
          <div class="flex flex-col gap-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="w-full bg-gray-50 border border-gray-100 rounded-2xl h-[76px] animate-pulse"></div>
            }
          </div>
        } @else {
          @if (splitService.activeTab() === 'expenses') {
            @if (individualSplits().length > 0) {
              <div class="flex justify-between items-center mb-3">
                <h3 class="font-extrabold text-gray-900 uppercase tracking-wider text-[11px]">
                  All Expenses
                </h3>
                <button
                  (click)="settleUp()"
                  class="px-3 py-1.5 border border-gray-200 bg-white text-gray-700 font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 hover:border-gray-300 transition-colors rounded-xl shadow-sm active:scale-95"
                >
                  Settle Up
                </button>
              </div>
            }
            <div class="flex flex-col gap-3">
              @if (individualSplits().length > 0) {
                @for (split of individualSplits(); track split.id) {
                  <button
                    (click)="editSplit(split)"
                    class="w-full bg-white border border-gray-100 rounded-3xl p-4 flex gap-4 text-left hover:shadow-md shadow-sm transition-all active:scale-[0.99] items-center"
                  >
                    <!-- Category Icon -->
                    <div class="w-12 h-12 rounded-full bg-[#F4F2FF] flex items-center justify-center shrink-0">
                      <svg class="w-6 h-6 text-splits-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>

                    <!-- Details -->
                    <div class="flex flex-col flex-1 min-w-0 justify-center gap-1">
                      <div class="flex justify-between items-start">
                        <span class="font-extrabold text-[15px] text-gray-900 truncate pr-2">{{ split.title }}</span>
                        <span class="font-extrabold text-[15px] text-gray-900 shrink-0">
                          ₹{{ split.total_amount % 1 === 0 ? (split.total_amount | number: '1.0-0') : (split.total_amount | number: '1.2-2') }}
                        </span>
                      </div>
                      
                      <div class="flex justify-between items-center">
                        <span class="text-[11px] font-semibold text-gray-500 truncate">
                          {{ split.date | date: 'mediumDate' }} • Paid by {{ split.payer_id === currentUser().id ? 'You' : getFriendName(split.payer_id) }}
                        </span>
                      </div>
                      
                      @if (getExpenseBalances(split).length > 0) {
                        <div class="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-100 border-dashed">
                          @for (bal of getExpenseBalances(split); track bal.participantId) {
                            <div class="flex justify-between items-center w-full gap-2">
                              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" [ngClass]="bal.type === 'owed' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'">
                                {{ bal.type === 'owed' ? 'You get' : 'You owe' }} ₹{{ bal.amount % 1 === 0 ? (bal.amount | number: '1.0-0') : (bal.amount | number: '1.2-2') }}
                              </span>
                              
                              <!-- Actions -->
                              <div class="flex items-center gap-2">
                                @if (bal.pending) {
                                  <span class="text-[10px] font-bold text-orange-500 uppercase tracking-wider mr-1">Pending</span>
                                  @if (bal.type === 'owed') {
                                    <button (click)="confirmSettlement($event, split.id, bal.participantId)" [disabled]="processingIds().has('confirm_' + split.id + '_' + bal.participantId)" class="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-1">
                                      Confirm
                                    </button>
                                  } @else {
                                    <button (click)="cancelSettlement($event, split.id)" class="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide shadow-sm hover:bg-gray-200 transition-colors">
                                      Cancel
                                    </button>
                                  }
                                } @else {
                                  <button (click)="settleIndividualSplit($event, split, bal)" class="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-colors">
                                    Settle
                                  </button>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="flex mt-1">
                          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider border border-gray-200 px-2 py-0.5 rounded-md">Settled</span>
                        </div>
                      }
                    </div>
                  </button>
                }
              } @else {
                <div class="mt-8 flex flex-col items-center justify-center text-center px-4">
                  <!-- Custom illustration placeholder for empty state -->
                  <div class="w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm overflow-hidden">
                    <img src="assets/images/empty-splits.png" alt="Empty Splits" class="w-full h-full object-cover opacity-80" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                    <svg style="display:none;" class="w-16 h-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h4 class="text-[17px] font-extrabold text-slate-800 mb-2">No split expenses yet</h4>
                  <p class="text-[13px] font-medium text-slate-500 max-w-[240px] mb-8 leading-relaxed">
                    Keep track of shared expenses, balances, and who owes who.
                  </p>
                  <button
                    (click)="splitService.openAddSplitSheet()"
                    class="w-[200px] bg-splits-primary hover:bg-splits-dark text-white py-4 rounded-[20px] font-bold text-[14px] tracking-wide shadow-lg shadow-splits-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    New Split
                  </button>
                </div>
              }
            </div>
          }

          <!-- Groups List -->
          @if (splitService.activeTab() === 'groups') {
            <div class="flex flex-col gap-3">
              @if (splitService.activeGroups().length > 0) {
                @for (group of splitService.activeGroups(); track group.id) {
                  <button
                    (click)="openGroup(group.id)"
                    class="w-full bg-white border border-gray-100 rounded-3xl p-4 flex gap-4 text-left hover:shadow-md shadow-sm transition-all active:scale-[0.99] items-center"
                  >
                    <!-- Group Icon -->
                    <div class="w-12 h-12 rounded-full bg-[#F4F2FF] flex items-center justify-center shrink-0">
                      <svg class="w-6 h-6 text-splits-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>

                    <!-- Details -->
                    <div class="flex flex-col flex-1 min-w-0 justify-center gap-1">
                      <div class="flex justify-between items-start">
                        <span class="font-extrabold text-[15px] text-gray-900 truncate pr-2">{{ group.name }}</span>
                        <button (click)="archiveGroup($event, group.id)" class="text-[10px] font-bold text-gray-400 border border-gray-200 rounded-md uppercase tracking-wider hover:text-gray-900 hover:border-gray-300 px-1.5 py-0.5 transition-colors flex-shrink-0 mt-0.5">
                          Archive
                        </button>
                      </div>
                      
                      <span class="text-[11px] font-semibold text-gray-500">
                        {{ group.members.length }} members
                      </span>
                      
                      <div class="flex flex-wrap gap-1 mt-1">
                        @if (getGroupBalance(group.id).net > 0) {
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                            You get ₹{{ getGroupBalance(group.id).net | number: '1.0-0' }}
                          </span>
                        } @else if (getGroupBalance(group.id).net < 0) {
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                            You owe ₹{{ 0 - getGroupBalance(group.id).net | number: '1.0-0' }}
                          </span>
                        } @else {
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Settled</span>
                        }
                      </div>
                    </div>
                  </button>
                }
              } @else {
                <div class="mt-8 flex flex-col items-center justify-center text-center px-4">
                  <!-- Custom illustration placeholder for empty state -->
                  <div class="w-40 h-40 bg-gray-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm overflow-hidden">
                    <img src="assets/images/empty-splits.png" alt="Empty Groups" class="w-full h-full object-cover opacity-80" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                    <svg style="display:none;" class="w-16 h-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 class="text-[17px] font-extrabold text-slate-800 mb-2">No groups yet</h4>
                  <p class="text-[13px] font-medium text-slate-500 max-w-[240px] mb-8 leading-relaxed">
                    Create groups to easily split expenses with trips, roommates, or friends.
                  </p>
                  <button
                    (click)="splitService.openGroupSheet()"
                    class="w-[200px] bg-splits-primary hover:bg-splits-dark text-white py-4 rounded-[20px] font-bold text-[14px] tracking-wide shadow-lg shadow-splits-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    New Group
                  </button>
                </div>
              }

              <!-- Archived Groups -->
              @if (splitService.archivedGroups().length > 0) {
                <div class="mt-4 mb-1">
                  <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Archived Groups</span>
                </div>
                @for (group of splitService.archivedGroups(); track group.id) {
                  <div class="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col gap-2 opacity-70">
                    <div class="flex justify-between items-center w-full">
                      <span class="font-extrabold text-sm text-gray-500 truncate">{{ group.name }}</span>
                      <button (click)="restoreGroup($event, group.id)" class="text-[10px] font-bold text-gray-500 border border-gray-300 rounded-md uppercase tracking-wider hover:text-gray-900 hover:border-gray-500 px-1.5 py-0.5 transition-colors">
                        Restore
                      </button>
                    </div>
                    <span class="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest">
                      {{ group.members.length }} members · Archived
                    </span>
                  </div>
                }
              }
            </div>
          }
        }
      </div>
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
    return this.splitService.splits().filter((s) => !s.group_id && !s.parent_expense_id);
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
      title: 'Settle All Expenses',
      message: 'Are you sure you want to settle all your expenses with everyone?',
      confirmText: 'Settle All',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const currentUserId = this.currentUser()?.id;

        const promises: Promise<boolean>[] = [];
        this.individualSplits().forEach((split) => {
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
          this.toastService.showSuccess('All expenses are settled.');
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
            const success = await this.splitService.updateSplit(updatedSplit as any, true, true);
            if (success)
              this.toastService.showSuccess('Settlement request sent. Waiting for confirmation.');
          } else {
            updatedSplit.participants = updatedSplit.participants.map((p: any) =>
              (targetId === 'all' ? p.userId !== myId && p.amountOwed > 0 : p.userId === targetId)
                ? { ...p, status: 'settled' }
                : p,
            );
            const success = await this.splitService.updateSplit(updatedSplit as any, true, true);
            if (success) this.toastService.showSuccess('Expense settled successfully.');
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
      message:
        'This will cancel the settlement request and revert this expense to pending. The other person will need to re-initiate the settle.',
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

  getGroupBalance(groupId: string) {
    const groupSplits = this.splitService.splits().filter((s) => s.group_id === groupId);
    let owed = 0;
    let owe = 0;
    const currentUserId = this.currentUser()?.id;
    if (!currentUserId) return { owed: 0, owe: 0, net: 0 };

    const simplified = this.splitService.simplifyDebts(groupSplits, currentUserId);
    Object.values(simplified).forEach((amount) => {
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
      message:
        'Archived groups are read-only. Balances are still calculated. You can restore anytime.',
      confirmText: 'Archive',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await this.splitService.archiveGroup(groupId, true);
      },
    });
  }

  restoreGroup(event: Event, groupId: string) {
    event.stopPropagation();
    this.splitService.archiveGroup(groupId, false);
  }
}
