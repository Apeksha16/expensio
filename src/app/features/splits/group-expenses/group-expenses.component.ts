import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SplitService, SplitExpense } from '../../../core/services/split.service';
import { FriendService } from '../../../core/services/friend.service';
import { AuthService } from '../../../core/services/auth.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { ToastService } from '../../../core/services/toast.service';

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
        <div class="bg-black p-6 mb-4 flex justify-between items-center rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
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
                    <span class="flex-shrink-0">•</span>
                    <span class="whitespace-nowrap flex-shrink-0">Paid by {{ split.payer_id === currentUser().id ? 'Me' : getFriendName(split.payer_id) }}</span>
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
    const f = this.friendService.acceptedFriends().find((x: any) => x.profile.id === id);
    return f ? f.profile.name.split(' ')[0] : id;
  }

  addExpenseToGroup() {
    this.keyboardService.openKeyboardSync();
    // Use the partial object to prepopulate group context
    this.splitService.openAddSplitSheet({ group_id: this.groupId() } as any);
  }

  editSplit(split: SplitExpense) {
    if (split.payer_id !== this.currentUser()?.id) {
       this.toastService.showError("You can only edit expenses that you added.");
       return;
    }
    this.keyboardService.openKeyboardSync();
    this.splitService.openAddSplitSheet(split);
  }
}
