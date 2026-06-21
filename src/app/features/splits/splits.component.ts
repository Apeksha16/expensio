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
          class="bg-black text-white p-5 border border-black rounded-none flex flex-col gap-4 relative overflow-hidden h-[124px]"
        >
          <div class="flex justify-between relative z-10 mt-2">
            <div class="flex flex-col gap-2">
              <div class="h-3 bg-gray-800 w-24 animate-pulse"></div>
              <div class="h-8 bg-gray-800 w-16 animate-pulse mt-1"></div>
            </div>
            <div class="flex flex-col gap-2 items-end">
              <div class="h-3 bg-gray-800 w-24 animate-pulse"></div>
              <div class="h-8 bg-gray-800 w-16 animate-pulse mt-1"></div>
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
          class="shrink-0 bg-black text-white p-5 border border-black rounded-none flex flex-col gap-4 relative overflow-hidden"
        >
          <div
            class="absolute -right-10 -top-10 w-32 h-32 bg-gray-800 rounded-full opacity-50 blur-2xl pointer-events-none"
          ></div>
          <div class="flex justify-between relative z-10 gap-4">
            <div class="flex flex-col flex-1 min-w-0">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1"
                >You Are Owed</span
              >
              <span class="text-3xl font-extrabold tracking-tight text-green-400">
                ₹{{ splitService.totalOwedToYou() | number: '1.0-0' }}
              </span>
            </div>
            <div class="flex flex-col flex-1 min-w-0 text-right">
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1"
                >You Owe</span
              >
              <span class="text-3xl font-extrabold tracking-tight text-red-400">
                ₹{{ splitService.totalYouOwe() | number: '1.0-0' }}
              </span>
            </div>
          </div>
        </div>
        <!-- Tabs -->
        <div class="shrink-0 flex border-b-2 border-black mt-2">
          <button
            (click)="splitService.activeTab.set('expenses')"
            [class.bg-black]="splitService.activeTab() === 'expenses'"
            [class.text-white]="splitService.activeTab() === 'expenses'"
            class="flex-1 py-3 font-extrabold tracking-widest uppercase transition-colors"
          >
            Expenses
          </button>
          <button
            (click)="splitService.activeTab.set('groups')"
            [class.bg-black]="splitService.activeTab() === 'groups'"
            [class.text-white]="splitService.activeTab() === 'groups'"
            class="flex-1 py-3 font-extrabold tracking-widest uppercase transition-colors"
          >
            Groups
          </button>
        </div>
        
        <!-- Individual Expenses List -->
        @if (splitService.activeTab() === 'expenses') {
          <div class="flex justify-between items-center mt-4">
             <h3 class="font-extrabold text-black uppercase tracking-widest text-sm">All Expenses</h3>
             <button
                (click)="settleUp()"
                class="px-4 py-1.5 border-2 border-black text-black font-bold text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-colors rounded-none"
             >
                Settle Up
             </button>
          </div>
          <div class="flex-1 flex flex-col gap-1.5 pb-36 mt-2">
            @if (individualSplits().length > 0) {
              @for (split of individualSplits(); track split.id) {
                <button
                  (click)="editSplit(split)"
                  class="w-full bg-gray-200 rounded-none p-4 flex flex-col gap-1 text-left hover:bg-gray-300 transition-colors active:bg-gray-400"
                >
                  <div class="flex justify-between items-start gap-4">
                    <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                      <span class="font-extrabold text-lg text-black truncate">{{ split.title }}</span>
                      <div class="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-0">
                        <span class="truncate">{{ split.date | date: 'mediumDate' }}</span>
                      </div>
                    </div>
                    <span class="font-extrabold text-lg text-black flex-shrink-0">₹{{ split.total_amount | number: '1.0-2' }}</span>
                  </div>
                  <div class="flex justify-between items-center mt-1 w-full">
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <span class="whitespace-nowrap flex-shrink-0">Paid by {{ split.payer_id === currentUser().id ? 'Me' : getFriendName(split.payer_id) }}</span>
                    </span>
                    @if (getExpenseBalance(split); as bal) {
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
            @if (splitService.groups().length > 0) {
              @for (group of splitService.groups(); track group.id) {
                <button
                  (click)="openGroup(group.id)"
                  class="w-full bg-gray-200 rounded-none p-4 flex flex-col gap-1 text-left hover:bg-gray-300 transition-colors active:bg-gray-400"
                >
                  <div class="flex justify-between items-start w-full">
                    <span class="font-extrabold text-lg text-black truncate">{{ group.name }}</span>
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
  Math = Math; // for template

  individualSplits = computed(() => {
    return this.splitService.splits().filter(s => !s.group_id);
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

  getExpenseBalance(split: any): { type: 'owed' | 'owe', amount: number } | null {
    const me = this.currentUser().id;
    const myParticipant = split.participants?.find((p: any) => p.userId === me);
    if (!myParticipant) return null;

    if (split.payer_id === me) {
      // I paid. Calculate how much others owe me.
      const iAmOwed = split.total_amount - myParticipant.amountOwed;
      if (iAmOwed > 0) return { type: 'owed', amount: iAmOwed };
      return null;
    } else {
      // Someone else paid. I owe my share.
      if (myParticipant.amountOwed > 0) return { type: 'owe', amount: myParticipant.amountOwed };
      return null;
    }
  }

  settleUp() {
    const settleSplit: Partial<SplitExpense> = {
      title: 'Settlement',
      category: 'Settlement'
    };
    this.splitService.openAddSplitSheet(settleSplit as any);
  }

  settleIndividualSplit(event: Event, split: SplitExpense) {
    event.stopPropagation();
    const bal = this.getExpenseBalance(split);
    if (!bal) return;

    const settleSplit: Partial<SplitExpense> = {
      title: 'Settle: ' + split.title,
      category: 'Settlement',
      total_amount: bal.amount,
      group_id: split.group_id
    };

    if (bal.type === 'owe') {
      settleSplit.payer_id = this.currentUser().id;
      settleSplit.participant_ids = [split.payer_id];
      settleSplit.participants = [{ userId: split.payer_id, amountOwed: bal.amount }];
    } else {
      const myParticipant = split.participants.find(p => p.userId === this.currentUser().id);
      if (myParticipant) {
         // I am owed money, meaning the payer should be someone else. We leave it empty for the user to select.
         settleSplit.participant_ids = [this.currentUser().id];
         settleSplit.participants = [{ userId: this.currentUser().id, amountOwed: bal.amount }];
      }
    }

    this.splitService.openAddSplitSheet(settleSplit as any);
  }

  editSplit(split: SplitExpense) {
    if (split.payer_id !== this.currentUser().id) {
       this.toastService.showError("You can only edit expenses that you added.");
       return;
    }
    this.splitService.openAddSplitSheet(split);
  }

  getGroupBalance(groupId: string) {
    const groupSplits = this.splitService.splits().filter(s => s.group_id === groupId);
    let owed = 0;
    let owe = 0;
    const currentUserId = this.currentUser()?.id;

    groupSplits.forEach(split => {
      if (split.payer_id === currentUserId) {
        owed += split.participants
          .filter(p => p.userId !== currentUserId)
          .reduce((sum, p) => sum + p.amountOwed, 0);
      } else {
        owe += split.participants.find(p => p.userId === currentUserId)?.amountOwed || 0;
      }
    });
    
    return { owed, owe, net: owed - owe };
  }

  openGroup(groupId: string) {
    this.router.navigate(['/splits/group', groupId]);
  }
}
