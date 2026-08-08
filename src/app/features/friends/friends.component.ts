import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { FriendService } from '../../core/services/friend.service';
import { UserProfile } from '../../core/services/auth.service';

@Component({
  selector: 'app-friends',
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
        @if (isInitialLoading()) {
          <!-- Top Summary Box Shimmer -->
          <div class="bg-slate-50 border border-slate-100 rounded-2xl h-[100px] animate-pulse"></div>
        } @else {
          @if (
            friendService.acceptedFriends().length > 0 ||
            friendService.incomingRequests().length > 0 ||
            friendService.outgoingRequests().length > 0
          ) {
            <!-- Summary Card -->
            <div class="flex gap-4 w-full">
              <div class="flex-1 bg-[#F4F2FF] rounded-3xl p-5 flex flex-col items-start relative overflow-hidden shadow-sm">
                <div class="w-10 h-10 rounded-full bg-[#E8E4FF] flex items-center justify-center mb-4">
                  <svg class="w-5 h-5 text-friends-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span class="text-xs font-bold text-gray-500 mb-1">Total Friends</span>
                <span class="text-2xl font-extrabold text-gray-900 tracking-tight">
                  {{ friendService.acceptedFriends().length }}
                </span>
                <span class="text-xs font-bold text-gray-500 mt-1">connected to your account</span>
              </div>
            </div>
          }
        }
      </div>

      <!-- Scrollable Area -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 pb-28 mt-4">
        @if (isInitialLoading()) {
          <!-- Friends List Shimmer -->
          <div class="flex flex-col gap-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="w-full bg-slate-50 border border-slate-100 rounded-2xl h-[76px] animate-pulse"></div>
            }
          </div>
        } @else {
          @if (
            friendService.acceptedFriends().length > 0 ||
            friendService.incomingRequests().length > 0 ||
            friendService.outgoingRequests().length > 0
          ) {
            <div class="flex flex-col gap-6">
              <!-- Incoming Requests -->
              @if (friendService.incomingRequests().length > 0) {
                <div class="flex flex-col gap-3 mt-4">
                  <h3 class="text-[13px] font-extrabold text-gray-800 tracking-wide pl-2">
                    Friend Requests
                  </h3>
                  <div class="flex flex-col gap-3">
                    @for (req of friendService.incomingRequests(); track req.id) {
                      <div class="w-full bg-white border border-slate-100 rounded-3xl p-4 flex items-center justify-between gap-4 shadow-sm">
                        <div class="flex items-center gap-4">
                          <img
                            [src]="authService.getAvatarUrl(req.profile.avatarId)"
                            alt="Avatar"
                            class="w-12 h-12 rounded-full bg-slate-50 object-cover shrink-0"
                          />
                          <div class="flex flex-col gap-1">
                            <span class="font-extrabold text-[15px] text-gray-900">{{ req.profile.name }}</span>
                            <span class="text-xs font-semibold text-gray-500 truncate">
                              {{ '@' + req.profile.username }}
                            </span>
                          </div>
                        </div>
                        <div class="flex items-center gap-2">
                          <button
                            (click)="removeFriend(req.id)"
                            [disabled]="processingIds().has('remove_' + req.id) || processingIds().has('accept_' + req.id)"
                            class="w-10 h-10 flex items-center justify-center bg-slate-50 transition-colors rounded-full active:scale-[0.98] disabled:opacity-50 text-gray-600"
                          >
                            @if (processingIds().has('remove_' + req.id)) {
                              <svg class="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            } @else {
                              <svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            }
                          </button>
                          <button
                            (click)="acceptRequest(req.id)"
                            [disabled]="processingIds().has('accept_' + req.id) || processingIds().has('remove_' + req.id)"
                            class="w-10 h-10 flex items-center justify-center bg-friends-primary transition-colors rounded-full active:scale-[0.98] disabled:opacity-50 shadow-md shadow-friends-primary/30 text-white"
                          >
                            @if (processingIds().has('accept_' + req.id)) {
                              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            } @else {
                              <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
                            }
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Outgoing Requests -->
              @if (friendService.outgoingRequests().length > 0) {
                <div class="flex flex-col gap-3 mt-4">
                  <h3 class="text-[13px] font-extrabold text-gray-800 tracking-wide pl-2">
                    Sent Requests
                  </h3>
                  <div class="flex flex-col gap-3">
                    @for (req of friendService.outgoingRequests(); track req.id) {
                      <div class="w-full bg-white border border-slate-100 rounded-3xl p-4 flex items-center justify-between gap-4 opacity-70 shadow-sm">
                        <div class="flex items-center gap-4">
                          <img
                            [src]="authService.getAvatarUrl(req.profile.avatarId)"
                            alt="Avatar"
                            class="w-12 h-12 rounded-full bg-slate-50 object-cover shrink-0"
                          />
                          <div class="flex flex-col gap-1">
                            <span class="font-extrabold text-[15px] text-gray-500">{{ req.profile.name }}</span>
                            <span class="text-xs font-semibold text-gray-500">
                              Pending
                            </span>
                          </div>
                        </div>
                        <button
                          (click)="removeFriend(req.id)"
                          [disabled]="processingIds().has('remove_' + req.id)"
                          class="active:scale-[0.98] transition-all duration-200 bg-slate-50 text-gray-500 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          @if (processingIds().has('remove_' + req.id)) {
                            <svg class="animate-spin h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          }
                          Cancel
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Accepted Friends -->
              @if (friendService.acceptedFriends().length > 0) {
                <div class="flex flex-col gap-3 mt-4">
                  <h3 class="text-[13px] font-extrabold text-gray-800 tracking-wide pl-2">
                    Your Friends
                  </h3>
                  <div class="flex flex-col gap-3">
                    @for (friend of friendService.acceptedFriends(); track friend.id) {
                      <button
                        (click)="friendService.openRemoveSheet(friend)"
                        class="w-full bg-white border border-slate-100 rounded-3xl p-4 flex items-center justify-between gap-4 text-left shadow-sm transition-all active:scale-[0.99]"
                      >
                        <div class="flex items-center gap-4">
                          <img
                            [src]="authService.getAvatarUrl(friend.profile.avatarId)"
                            alt="Avatar"
                            class="w-12 h-12 rounded-full bg-slate-50 object-cover shrink-0"
                          />
                          <div class="flex flex-col gap-1">
                            <span class="font-extrabold text-[15px] text-gray-900">{{ friend.profile.name }}</span>
                            <span class="text-xs font-semibold text-gray-500 truncate">
                              {{ '@' + friend.profile.username }}
                            </span>
                          </div>
                        </div>
                        <svg class="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="mt-8 flex flex-col items-center justify-center text-center px-4">
              <!-- Custom illustration placeholder for empty state -->
              <div class="w-40 h-40 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-8 border-white shadow-sm overflow-hidden">
                <svg class="w-16 h-16 text-friends-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 class="text-[17px] font-extrabold text-slate-800 mb-2">No friends yet</h4>
              <p class="text-[13px] font-medium text-slate-500 max-w-[240px] mb-8 leading-relaxed">
                Connect with friends to easily split expenses and settle up.
              </p>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class Friends implements OnInit {
  friendService = inject(FriendService);
  authService = inject(AuthService);

  isInitialLoading = signal(true);
  processingIds = signal<Set<string>>(new Set());

  async acceptRequest(id: string) {
    const key = 'accept_' + id;
    const current = new Set(this.processingIds());
    current.add(key);
    this.processingIds.set(current);
    await this.friendService.acceptRequest(id);
    const after = new Set(this.processingIds());
    after.delete(key);
    this.processingIds.set(after);
  }

  async removeFriend(id: string) {
    const key = 'remove_' + id;
    const current = new Set(this.processingIds());
    current.add(key);
    this.processingIds.set(current);
    await this.friendService.removeFriend(id);
    const after = new Set(this.processingIds());
    after.delete(key);
    this.processingIds.set(after);
  }

  ngOnInit() {
    setTimeout(() => {
      this.isInitialLoading.set(false);
    }, 2000);
  }
}
