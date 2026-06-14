import {
  Component,
  inject,
  signal,
  effect,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { FriendService, FriendData } from '../../../core/services/friend.service';
import { UserProfile } from '../../../core/services/auth.service';
import { Subject, Subscription, of, timer, from } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  filter,
  tap,
  catchError,
  map,
} from 'rxjs/operators';

import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { HapticService } from '../../../core/services/haptic.service';

@Component({
  selector: 'app-friend-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, SwipeToCloseDirective],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.7, 0, 0.84, 0)', style({ transform: 'translateY(100%)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  template: `
    <!-- Backdrop -->
    @if (isVisible()) {
      <div
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>
    }

    <!-- Sheet Content -->
    @if (isVisible()) {
      <div
        @slideUp
        appSwipeToClose (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 bg-white z-[70] 
             max-h-[95vh] flex flex-col shadow-2xl"
      >

        <!-- Header -->
        <div
          class="flex justify-between items-center py-4 px-6 bg-black text-white sticky top-0 z-10 shrink-0"
        >
          <h2 class="text-xl font-extrabold tracking-tight">
            {{ isAddMode ? 'Add Friend' : 'Remove Friend' }}
          </h2>
        </div>
        <div class="p-6 flex flex-col gap-6 overflow-y-auto overscroll-contain">
          <!-- ADD MODE -->
          @if (isAddMode) {
            <form (submit)="$event.preventDefault(); sendRequest()" class="space-y-4">
              <div class="flex flex-col gap-1 shrink-0">
                <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                  >Search User</label
                >
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      class="w-5 h-5 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="query"
                    [(ngModel)]="searchQuery"
                    (ngModelChange)="onSearchChange($event)"
                    class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-10"
                    placeholder="Username or email..."
                  />
                </div>
              </div>
              <!-- Search Results -->
              <div
                class="flex flex-col gap-2 min-h-[150px] max-h-[40vh] overflow-y-auto pr-2 relative"
              >
                @if (isSearching) {
                  <div class="text-center p-4 flex justify-center items-center gap-2">
                    <svg
                      class="animate-spin h-5 w-5 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Searching...
                    </p>
                  </div>
                }
                @for (user of searchResults; track user) {
                  <button
                    type="button"
                    (click)="selectUser(user)"
                    class="flex items-center gap-4 p-3 border-2 transition-colors rounded-none text-left shrink-0"
                    [ngClass]="
                      selectedUser?.username === user.username
                        ? 'border-black bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-black'
                    "
                  >
                    <div
                      class="w-10 h-10 rounded-full border-2 border-black bg-gray-200 flex items-center justify-center font-extrabold text-lg text-black shrink-0"
                    >
                      {{ user.name.charAt(0) }}
                    </div>
                    <div class="flex flex-col flex-1">
                      <span class="font-extrabold text-black">{{ user.name }}</span>
                      <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{
                        '@' + user.username
                      }}</span>
                    </div>
                  </button>
                }
              </div>
              <!-- Actions for Add Mode -->
              <div class="mt-4 flex gap-4 shrink-0">
                <button
                  type="button"
                  (click)="close()"
                  class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-300 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!selectedUser || isSending"
                  class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-[#1a2e22] hover:bg-[#2f4d3b] text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  @if (isSending) {
                    <svg
                      class="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  }
                  <span>{{ isSending ? 'Sending...' : 'Send Request' }}</span>
                </button>
              </div>
            </form>
          }
          <!-- REMOVE MODE -->
          @if (!isAddMode && targetFriend) {
            <div class="flex flex-col items-center py-6 gap-4">
              <div
                class="w-24 h-24 rounded-full border-4 border-black bg-gray-200 flex items-center justify-center font-extrabold text-5xl text-black shrink-0"
              >
                {{ targetFriend.profile.name.charAt(0) }}
              </div>
              <div class="text-center">
                <h3 class="font-extrabold text-2xl text-black">{{ targetFriend.profile.name }}</h3>
                <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  {{ '@' + targetFriend.profile.username }}
                </p>
              </div>
              <p class="text-center text-sm font-bold text-black mt-4 max-w-[250px]">
                Are you sure you want to remove this friend? You will no longer be able to share
                expenses with them.
              </p>
            </div>
            <!-- Bottom Buttons -->
            <div class="pt-2 flex gap-3 shrink-0">
              <button
                type="button"
                (click)="close()"
                class="flex-1 bg-white text-gray-900 p-3.5 font-bold text-sm tracking-wide transition-all border-2 border-gray-200 active:scale-[0.98] rounded-none hover:border-gray-300 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmRemove()"
                class="flex-1 bg-red-600 text-white p-3.5 font-bold text-sm tracking-wide transition-all border-2 border-transparent active:scale-[0.98] rounded-none flex items-center justify-center gap-2"
              >
                Remove
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class FriendSheetComponent implements OnInit, OnDestroy {
  friendService = inject(FriendService);
  cdr = inject(ChangeDetectorRef);
  haptic = inject(HapticService);

  isVisible = signal(false);

  searchQuery = '';
  searchResults: UserProfile[] = [];
  selectedUser: UserProfile | null = null;
  isSearching = false;
  isSending = false;

  private searchSubject = new Subject<string>();
  private searchSubscription!: Subscription;

  constructor() {
    effect(() => {
      const open = this.friendService.isSheetOpen();
      this.isVisible.set(open);
      if (open) {
        // Reset state on open
        this.searchQuery = '';
        this.searchResults = [];
        this.selectedUser = null;
        this.isSearching = false;
        this.isSending = false;
      }
    });
  }

  ngOnInit() {
    this.searchSubscription = this.searchSubject
      .pipe(
        map(query => query.trim()),
        tap((query) => {
          if (query.length < 1) {
            this.searchResults = [];
            this.isSearching = false;
            this.cdr.detectChanges();
          }
        }),
        filter((query) => query.length >= 1),
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => {
          this.isSearching = true;
          this.cdr.detectChanges();
        }),
        switchMap((query) => {
          return from(this.friendService.searchUsers(query)).pipe(catchError(() => of([])));
        }),
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.isSearching = false;
        this.cdr.detectChanges();
      });
  }

  get isAddMode(): boolean {
    return this.friendService.sheetMode() === 'add';
  }

  get targetFriend(): FriendData | null {
    return this.friendService.selectedFriend();
  }

  onSearchChange(query: string) {
    this.selectedUser = null;
    this.searchSubject.next(query);
  }

  selectUser(user: UserProfile) {
    this.selectedUser = user;
  }

  async sendRequest() {
    if (this.selectedUser) {
      this.isSending = true;
      await this.friendService.sendRequest(this.selectedUser);
      this.isSending = false;
      this.close();
    }
  }

  confirmRemove() {
    if (this.targetFriend) {
      this.friendService.removeFriend(this.targetFriend.id);
      this.close();
    }
  }

  close() {
    this.haptic.impactLight();
    this.friendService.closeSheet();
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}
