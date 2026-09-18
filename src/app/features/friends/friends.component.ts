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
                        (click)="openRemoveSheet($event, friend)"
                        class="w-full bg-white border border-slate-100 rounded-3xl p-4 flex items-center justify-between gap-4 text-left shadow-sm transition-all active:scale-[0.99]"
                      >
                        <div class="flex items-center gap-4">
                          <div class="relative shrink-0" 
                               (touchstart)="startPress($event, friend)" 
                               (touchend)="endPress($event)"
                               (mousedown)="startPress($event, friend)" 
                               (mouseup)="endPress($event)"
                               (mouseleave)="endPress($event)"
                               (contextmenu)="$event.preventDefault(); startPress($event, friend)"
                          >
                            <img
                              [src]="authService.getAvatarUrl(friend.profile.avatarId)"
                              alt="Avatar"
                              class="w-12 h-12 rounded-full bg-slate-50 object-cover shrink-0"
                              [class.ring-2]="friend.profile.isGuest"
                              [class.ring-indigo-100]="friend.profile.isGuest"
                            />
                            @if (friend.profile.isGuest) {
                              <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 text-white rounded-full border-2 border-white flex items-center justify-center shadow-sm pointer-events-none">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                              </div>
                            }
                          </div>
                          <div class="flex flex-col gap-1">
                            <div class="flex items-center gap-2">
                              <span class="font-extrabold text-[15px] text-gray-900">{{ friend.profile.name }}</span>
                              @if (friend.profile.isGuest) {
                                <span class="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Guest</span>
                              }
                            </div>
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

    <!-- Avatar Selection Bottom Sheet -->
    @if (isAvatarSheetOpen()) {
      <div class="active:scale-[0.98] transition-all duration-200 fixed inset-0 bg-[#0B0F19]/40 z-[100] backdrop-blur-sm transition-opacity" (click)="isAvatarSheetOpen.set(false)"></div>
      <div class="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[32px] overflow-hidden flex flex-col h-[75vh] animate-[slideUp_0.3s_ease-out]">
        <div class="flex flex-col items-center pt-3 pb-2 px-6 relative shrink-0">
          <div class="w-12 h-1 bg-gray-300 rounded-full mb-4"></div>
          <h2 class="text-base font-bold text-gray-900 mb-2">Choose Avatar</h2>
          <button (click)="isAvatarSheetOpen.set(false)" class="active:scale-[0.98] transition-all duration-200 absolute right-5 top-5 text-gray-500 bg-slate-50 rounded-full p-1.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar relative z-10">
          <div class="grid grid-cols-4 gap-4 mt-2">
            @for (avatar of authService.avatars; track avatar.id) {
              <button
                (click)="selectGuestAvatar(avatar.id)"
                class="active:scale-[0.98] transition-all duration-200 relative aspect-square rounded-[20px] flex items-center justify-center transition-all border-2"
                [ngClass]="
                  selectedGuestForAvatar()?.profile?.avatarId === avatar.id
                    ? 'border-indigo-500 bg-indigo-50 shadow-[0_0_0_2px_rgba(99,102,241,0.1)]'
                    : 'border-transparent bg-[#FAFAFA]'
                "
              >
                <img [src]="avatar.url" alt="Avatar" class="w-full h-full object-cover rounded-[18px]" />
                @if (selectedGuestForAvatar()?.profile?.avatarId === avatar.id) {
                  <div class="absolute -bottom-1 -right-1 w-[22px] h-[22px] bg-indigo-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  </div>
                }
              </button>
            }
          </div>
        </div>
      </div>
    }
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

  openRemoveSheet(event: Event, friend: any) {
    if (this.isAvatarSheetOpen()) return;
    this.friendService.openRemoveSheet(friend);
  }

  pressTimer: any;
  isAvatarSheetOpen = signal(false);
  selectedGuestForAvatar = signal<any>(null);

  startPress(event: Event, friend: any) {
    if (!friend.profile.isGuest) return;
    // Don't prevent default on touchstart as it breaks scrolling, just stop propagation so button doesn't trigger immediately
    event.stopPropagation();
    
    this.pressTimer = setTimeout(() => {
      this.selectedGuestForAvatar.set(friend);
      this.isAvatarSheetOpen.set(true);
    }, 500); // 500ms for long press
  }

  endPress(event: Event) {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
    }
  }

  async selectGuestAvatar(avatarId: number) {
    const guest = this.selectedGuestForAvatar();
    if (guest) {
      // Optimistically update the avatar in UI
      guest.profile.avatarId = avatarId;
      this.selectedGuestForAvatar.set({ ...guest });
      this.isAvatarSheetOpen.set(false); // Close sheet immediately on selection
      await this.friendService.updateGuestAvatar(guest.profile.id, avatarId);
    }
  }
}
