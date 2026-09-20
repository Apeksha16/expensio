import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplitService } from '../../../core/services/split.service';
import { FriendService } from '../../../core/services/friend.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-splits-summary-sheet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-[60]"
      [class.pointer-events-none]="!splitService.isSplitsSummarySheetOpen()"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/40 transition-opacity duration-300"
        [class.opacity-0]="!splitService.isSplitsSummarySheetOpen()"
        [class.opacity-100]="splitService.isSplitsSummarySheetOpen()"
        (click)="close()"
      ></div>

      <!-- Bottom Sheet -->
      <div
        class="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl transition-transform duration-300 ease-out flex flex-col max-h-[90vh]"
        [class.translate-y-full]="!splitService.isSplitsSummarySheetOpen()"
        [class.translate-y-0]="splitService.isSplitsSummarySheetOpen()"
      >
          <!-- Header -->
          <div class="px-6 pt-6 pb-4 flex justify-between items-center shrink-0 border-b border-gray-100">
            <div>
              <h2 class="text-xl font-extrabold text-gray-900 tracking-tight">
                {{ isGetMode() ? 'You\\'ll Get' : 'You Owe' }}
              </h2>
              <p class="text-[13px] font-bold text-gray-500 mt-0.5">
                Summary of your {{ isGetMode() ? 'receivables' : 'payables' }}
              </p>
            </div>
            
          </div>

          <!-- Content -->
          <div class="p-6 overflow-y-auto overscroll-contain flex-1 custom-scrollbar pb-safe">
            
            @if (balances().length === 0) {
              <div class="flex flex-col items-center justify-center py-10 text-center">
                <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg class="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="text-gray-500 font-medium">No balances to show</p>
              </div>
            } @else {
              <div class="space-y-4">
                @for (item of balances(); track item.userId) {
                  <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div class="flex items-center gap-3">
                      <!-- Avatar -->
                      <div class="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden shrink-0 border border-indigo-200 shadow-sm">
                        @if (item.avatar) {
                          <img [src]="item.avatar" class="w-full h-full object-cover" />
                        } @else {
                          {{ item.name.charAt(0).toUpperCase() }}
                        }
                      </div>
                      
                      <!-- Name -->
                      <div class="flex flex-col">
                        <span class="font-bold text-gray-900">{{ item.name }}</span>
                      </div>
                    </div>
                    
                    <!-- Amount -->
                    <div class="text-right">
                      <span class="text-lg font-extrabold" [ngClass]="isGetMode() ? 'text-splits-primary' : 'text-red-500'">
                        ₹{{ item.amount | number: '1.0-0' }}
                      </span>
                    </div>
                  </div>
                }
              </div>
            }

          </div>
          
          <!-- Sticky Footer -->
          <div class="px-6 py-4 bg-white shrink-0 pb-safe">
            <button
              (click)="close()"
              class="w-full font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-slate-100 text-slate-700 text-center"
            >
              Close
            </button>
          </div>
      </div>
    </div>
  `,
})
export class SplitsSummarySheetComponent {
  splitService = inject(SplitService);
  friendService = inject(FriendService);
  authService = inject(AuthService);

  isGetMode = computed(() => this.splitService.splitsSummaryMode() === 'get');

  balances = computed(() => {
    const rawBalances = this.splitService.simplifiedBalances();
    const result: Array<{ userId: string, name: string, avatar: string, amount: number }> = [];

    for (const [userId, amount] of Object.entries(rawBalances)) {
      if (this.isGetMode() && amount > 0.01) {
        result.push({
          userId,
          name: this.getMemberName(userId),
          avatar: this.getMemberAvatar(userId),
          amount: amount
        });
      } else if (!this.isGetMode() && amount < -0.01) {
        result.push({
          userId,
          name: this.getMemberName(userId),
          avatar: this.getMemberAvatar(userId),
          amount: Math.abs(amount)
        });
      }
    }

    return result.sort((a, b) => b.amount - a.amount);
  });

  getMemberName(memberId: string): string {
    const friend = this.friendService.acceptedFriends().find((f: any) => f.profile.id === memberId);
    return friend ? friend.profile.name : memberId;
  }
  
  getMemberAvatar(memberId: string): string {
    const friend = this.friendService.acceptedFriends().find((f: any) => f.profile.id === memberId);
    return friend ? this.authService.getAvatarUrl(friend.profile.avatarId) : '';
  }

  close() {
    this.splitService.isSplitsSummarySheetOpen.set(false);
  }
}
