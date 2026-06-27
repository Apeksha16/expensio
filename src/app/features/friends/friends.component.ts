import { Component, inject, OnInit, signal } from '@angular/core';
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
  template: `
    <div class="h-full bg-gray-50 p-4 flex flex-col gap-4">
      @if (isInitialLoading()) {
        <!-- Top Summary Box Shimmer -->
        <div
          class="bg-black text-white p-5 border border-black rounded-none flex flex-col gap-4 relative overflow-hidden h-[124px]"
        >
          <div class="flex flex-col gap-2 relative z-10 mt-2">
            <div class="h-3 bg-gray-800 w-24 animate-pulse"></div>
            <div class="h-10 bg-gray-800 w-16 animate-pulse mt-1"></div>
          </div>
        </div>
        <!-- Friends List Shimmer -->
        <div class="flex flex-col gap-1.5 pb-36 mt-2">
          @for (i of [1, 2, 3]; track i) {
            <div
              class="w-full bg-gray-200 rounded-none p-3 flex items-center gap-4 h-[76px] animate-pulse"
            >
              <div class="w-12 h-12 rounded-full bg-gray-300 shrink-0"></div>
              <div class="flex flex-col gap-2 flex-1">
                <div class="h-4 bg-gray-300 w-1/2"></div>
                <div class="h-3 bg-gray-300 w-1/4"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        @if (
          friendService.acceptedFriends().length > 0 ||
          friendService.incomingRequests().length > 0 ||
          friendService.outgoingRequests().length > 0
        ) {
          <!-- Top Summary Box -->
          <div
            class="bg-friends-primary text-white p-5 border-2 border-friends-dark rounded-none flex flex-col gap-4 relative overflow-hidden"
          >
            <!-- Abstract Decoration -->
            <div
              class="absolute -right-10 -top-10 w-32 h-32 bg-friends-dark rounded-full opacity-50 blur-2xl pointer-events-none"
            ></div>
            <div class="flex flex-col relative z-10">
              <span class="text-xs font-bold text-friends-surface uppercase tracking-widest mb-1 opacity-80"
                >Total Friends</span
              >
              <span class="text-4xl font-extrabold tracking-tight">
                {{ friendService.acceptedFriends().length | number: '2.0-0' }}
              </span>
            </div>
          </div>
          <!-- Lists Container -->
          <div class="flex-1 flex flex-col gap-6 pb-36 mt-4">
            <!-- Incoming Requests -->
            @if (friendService.incomingRequests().length > 0) {
              <div class="flex flex-col gap-2">
                <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">
                  Friend Requests
                </h3>
                <div class="flex flex-col gap-1.5">
                  @for (req of friendService.incomingRequests(); track req.id) {
                    <div
                      class="w-full bg-friends-surface border-2 border-friends-primary rounded-none p-3 flex items-center justify-between gap-4"
                    >
                      <div class="flex items-center gap-3">
                        <img
                          [src]="authService.getAvatarUrl(req.profile.avatarId)"
                          alt="Avatar"
                          class="w-10 h-10 rounded-full border-2 border-friends-primary object-cover shrink-0"
                        />
                        <div class="flex flex-col gap-0.5">
                          <span class="font-extrabold text-sm text-friends-dark">{{
                            req.profile.name
                          }}</span>
                          <span
                            class="text-[10px] font-bold text-friends-dark opacity-70 uppercase tracking-widest"
                            >{{ '@' + req.profile.username }}</span
                          >
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          (click)="removeFriend(req.id)"
                          [disabled]="processingIds().has('remove_' + req.id) || processingIds().has('accept_' + req.id)"
                          class="w-8 h-8 flex items-center justify-center border-2 border-gray-200 hover:border-gray-400 active:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          @if (processingIds().has('remove_' + req.id)) {
                            <svg class="animate-spin h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          } @else {
                            <svg
                              class="w-4 h-4 text-gray-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          }
                        </button>
                        <button
                          (click)="acceptRequest(req.id)"
                          [disabled]="processingIds().has('accept_' + req.id) || processingIds().has('remove_' + req.id)"
                          class="w-8 h-8 flex items-center justify-center bg-friends-primary border-2 border-friends-primary hover:bg-friends-dark active:bg-friends-dark transition-colors disabled:opacity-50"
                        >
                          @if (processingIds().has('accept_' + req.id)) {
                            <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          } @else {
                            <svg
                              class="w-4 h-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
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
              <div class="flex flex-col gap-2">
                <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">
                  Sent Requests
                </h3>
                <div class="flex flex-col gap-1.5">
                  @for (req of friendService.outgoingRequests(); track req.id) {
                    <div
                      class="w-full bg-white border-2 border-friends-light rounded-none p-3 flex items-center justify-between gap-4 opacity-80"
                    >
                      <div class="flex items-center gap-3">
                        <img
                          [src]="authService.getAvatarUrl(req.profile.avatarId)"
                          alt="Avatar"
                          class="w-10 h-10 rounded-full border-2 border-friends-light object-cover shrink-0"
                        />
                        <div class="flex flex-col gap-0.5">
                          <span class="font-extrabold text-sm text-friends-dark">{{
                            req.profile.name
                          }}</span>
                          <span
                            class="text-[10px] font-bold text-friends-dark opacity-60 uppercase tracking-widest"
                            >Pending</span
                          >
                        </div>
                      </div>
                      <button
                        (click)="removeFriend(req.id)"
                        [disabled]="processingIds().has('remove_' + req.id)"
                        class="text-[10px] font-bold text-red-500 uppercase tracking-widest px-2 py-1 border-2 border-transparent hover:border-red-200 active:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        @if (processingIds().has('remove_' + req.id)) {
                          <svg class="animate-spin h-3 w-3 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
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
              <div class="flex flex-col gap-2">
                <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">
                  Your Friends
                </h3>
                <div class="flex flex-col gap-1.5">
                  @for (friend of friendService.acceptedFriends(); track friend.id) {
                    <button
                      (click)="friendService.openRemoveSheet(friend)"
                      class="w-full bg-friends-light rounded-none p-3 flex items-center gap-4 text-left hover:bg-friends-surface transition-colors active:bg-friends-primary active:text-white"
                    >
                      <img
                        [src]="authService.getAvatarUrl(friend.profile.avatarId)"
                        alt="Avatar"
                        class="w-12 h-12 rounded-full border-2 border-friends-primary object-cover shrink-0"
                      />
                      <div class="flex flex-col gap-0.5 flex-1">
                        <span class="font-extrabold text-lg text-friends-dark">{{
                          friend.profile.name
                        }}</span>
                        <div
                          class="flex items-center gap-2 text-[10px] font-bold text-friends-dark opacity-70 uppercase tracking-widest"
                        >
                          <span>{{ '@' + friend.profile.username }}</span>
                        </div>
                      </div>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <p class="text-gray-500 font-extrabold text-xl">No friends yet</p>
            <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
              Tap the + button below to find and add friends.
            </p>
          </div>
        }
        <!-- Empty State -->
      }
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
