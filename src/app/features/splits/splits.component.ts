import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplitService } from '../../core/services/split.service';
import { FriendService } from '../../core/services/friend.service';
import { AuthService } from '../../core/services/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { KeyboardService } from '../../core/services/keyboard.service';

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
          class="bg-black text-white p-5 border border-black rounded-none flex flex-col gap-4 relative overflow-hidden"
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
        <div class="flex border-b-2 border-black mt-2">
          <button
            (click)="splitService.activeTab.set('expenses')"
            [class.bg-black]="splitService.activeTab() === 'expenses'"
            [class.text-white]="splitService.activeTab() === 'expenses'"
            class="flex-1 py-3 font-extrabold tracking-widest uppercase transition-colors"
          >
            Expenses
          </button>
          <button
            (click)="splitService.activeTab.set('friends')"
            [class.bg-black]="splitService.activeTab() === 'friends'"
            [class.text-white]="splitService.activeTab() === 'friends'"
            class="flex-1 py-3 font-extrabold tracking-widest uppercase transition-colors"
          >
            Friends
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
        <!-- Expenses List -->
        @if (splitService.activeTab() === 'expenses') {
          <div class="flex-1 flex flex-col gap-1.5 pb-36 mt-2">
            @if (splitService.splits().length > 0) {
              @for (split of splitService.splits(); track split.id) {
                <button
                  (click)="editSplit(split)"
                  class="w-full bg-gray-200 rounded-none p-4 flex flex-col gap-1 text-left hover:bg-gray-300 transition-colors active:bg-gray-400"
                >
                  <div class="flex justify-between items-start">
                    <span class="font-extrabold text-lg text-black">{{ split.title }}</span>
                    <span class="font-extrabold text-lg text-black">₹{{ split.total_amount | number: '1.0-2' }}</span>
                  </div>
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest"
                    >{{ split.date | date: 'mediumDate' }} • Paid by {{ split.payer_id === currentUser().id ? 'Me' : getFriendName(split.payer_id) }}</span
                  >
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
        <!-- Friends List -->
        @if (splitService.activeTab() === 'friends') {
          <div class="flex-1 flex flex-col gap-1.5 pb-36 mt-2">
            @if (friendService.acceptedFriends().length > 0) {
              @for (friend of friendService.acceptedFriends(); track friend.id) {
                <button
                  (click)="onFriendClick(friend.profile.id, friend.profile.name)"
                  class="w-full bg-gray-200 rounded-none p-4 flex items-center justify-between text-left hover:bg-gray-300 transition-colors active:bg-gray-400"
                >
                  <div class="flex flex-col gap-0.5">
                    <span class="font-extrabold text-lg text-black">{{ friend.profile.name }}</span>
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{
                      '@' + friend.profile.username
                    }}</span>
                  </div>
                  <div class="flex flex-col items-end">
                    @if (getBalance(friend.profile.id) === 0) {
                      <span class="text-gray-500 font-extrabold tracking-tight">Settled up</span>
                    }
                    @if (getBalance(friend.profile.id) > 0) {
                      <span class="text-green-600 font-extrabold tracking-tight text-xl"
                        >Owes you ₹{{ getBalance(friend.profile.id) | number: '1.0-0' }}</span
                      >
                    }
                    @if (getBalance(friend.profile.id) < 0) {
                      <span class="text-red-600 font-extrabold tracking-tight text-xl"
                        >You owe ₹{{
                          Math.abs(getBalance(friend.profile.id)) | number: '1.0-0'
                        }}</span
                      >
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
                <p class="text-gray-500 font-extrabold text-xl">No friends</p>
                <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                  Add friends to see balances here.
                </p>
              </div>
            }
          </div>
        }
        <!-- Groups List -->
        @if (splitService.activeTab() === 'groups') {
          <div class="flex-1 flex flex-col gap-1.5 pb-36 mt-2">
            @if (splitService.groups().length > 0) {
              @for (group of splitService.groups(); track group) {
                <button
                  (click)="editGroup(group)"
                  class="w-full bg-gray-200 rounded-none p-4 flex flex-col gap-1 text-left hover:bg-gray-300 transition-colors active:bg-gray-400"
                >
                  <span class="font-extrabold text-lg text-black">{{ group.name }}</span>
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest"
                    >{{ group.members.length }} members</span
                  >
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
  keyboardService = inject(KeyboardService);
  currentUser = this.authService.userProfile;

  isInitialLoading = signal(true);
  Math = Math; // for template

  ngOnInit() {
    setTimeout(() => {
      this.isInitialLoading.set(false);
    }, 2000);
  }

  getBalance(id: string): number {
    return this.splitService.balances()[id] || 0;
  }

  getFriendName(id: string): string {
    const f = this.friendService.acceptedFriends().find((x: any) => x.profile.id === id);
    return f ? f.profile.name : id;
  }

  onFriendClick(friendId: string, friendName: string) {
    const balance = this.getBalance(friendId);
    if (balance === 0) return; // already settled

    const amount = Math.abs(balance);
    const actionText = balance > 0 
      ? `${friendName} paid you ₹${amount}?` 
      : `You paid ${friendName} ₹${amount}?`;

    this.confirmService.open({
      title: 'Mark as Paid',
      message: `Are you sure you want to mark this balance as paid? (${actionText})`,
      confirmText: 'Mark as Paid',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.splitService.settleUp(friendId, balance);
      }
    });
  }

  editSplit(split: any) {
    this.keyboardService.openKeyboardSync();
    this.splitService.openAddSplitSheet(split);
  }

  editGroup(group: any) {
    this.keyboardService.openKeyboardSync();
    this.splitService.openGroupSheet(group);
  }
}
