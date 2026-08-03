import {
  Component,
  inject,
  signal,
  effect,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
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
import { AutofocusDirective } from '../autofocus.directive';
import { SafeInputDirective } from '../safe-input.directive';

@Component({
  selector: 'app-friend-sheet',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SwipeToCloseDirective,
    AutofocusDirective,
    SafeInputDirective,
  ],
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
  changeDetection: ChangeDetectionStrategy.Default,
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
    <!-- Sheet Content -->
    @if (isVisible()) {
      <div
        @slideUp
        appSwipeToClose
        (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 z-[70] 
             max-h-[95vh] flex flex-col rounded-t-3xl shadow-2xl"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center py-4 px-6 bg-friends-primary text-white rounded-t-3xl sticky top-0 z-10 shrink-0 shadow-sm"
        >
          <h2 class="text-lg font-bold tracking-wide">
            {{ isAddMode ? 'Add Friend' : 'Remove Friend' }}
          </h2>
        </div>
        <div class="p-6 flex flex-col gap-6 overflow-y-auto overscroll-none bg-white flex-1">
          <!-- ADD MODE -->
          @if (isAddMode) {
            <form (submit)="$event.preventDefault(); sendRequest()" class="space-y-4">
              <div class="flex flex-col gap-1.5 shrink-0">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Search User</label
                >
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg
                      class="w-5 h-5 text-gray-400"
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
                    appAutofocus
                    appSafeInput
                    type="text"
                    name="query"
                    [(ngModel)]="searchQuery"
                    (ngModelChange)="onSearchChange($event)"
                    class="w-full bg-gray-50 border border-gray-200 text-gray-900 font-semibold text-sm rounded-xl focus:bg-white focus:border-friends-primary focus:ring-4 focus:ring-friends-primary/15 block p-3 outline-none transition-all placeholder-gray-400 min-h-[48px] touch-manipulation pl-10 shadow-sm"
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
                      class="animate-spin h-5 w-5 text-friends-primary"
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
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Searching...
                    </p>
                  </div>
                }
                @for (user of searchResults; track user) {
                  <button
                    type="button"
                    (click)="selectUser(user)"
                    class="flex items-center gap-4 p-3 border rounded-xl transition-all text-left shrink-0 active:scale-95 shadow-sm mb-2"
                    [ngClass]="
                      selectedUser?.username === user.username
                        ? 'border-friends-primary bg-friends-primary text-white shadow-md shadow-friends-primary/25'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    "
                  >
                    <div
                      class="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-lg shrink-0 border"
                      [ngClass]="
                        selectedUser?.username === user.username
                          ? 'bg-white text-friends-primary border-transparent'
                          : 'bg-gray-100 text-gray-800 border-gray-200'
                      "
                    >
                      {{ user.name.charAt(0) }}
                    </div>
                    <div class="flex flex-col flex-1">
                      <span class="font-bold text-sm" [ngClass]="selectedUser?.username === user.username ? 'text-white' : 'text-gray-900'">{{ user.name }}</span>
                      <span class="text-xs font-semibold" [ngClass]="selectedUser?.username === user.username ? 'text-white/80' : 'text-gray-500'">{{
                        '@' + user.username
                      }}</span>
                    </div>
                  </button>
                }
              </div>
              <!-- Actions for Add Mode -->
              <div class="mt-6 flex gap-3 shrink-0">
                <button
                  type="button"
                  (click)="close()"
                  class="flex-1 font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3.5 text-sm min-h-[48px] bg-gray-100 text-gray-700 hover:bg-gray-200 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!selectedUser || isSending"
                  class="flex-1 font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3.5 text-sm min-h-[48px] bg-friends-primary hover:bg-friends-dark text-white shadow-lg shadow-friends-primary/30 disabled:opacity-50 disabled:active:scale-100"
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
                class="w-20 h-20 rounded-full border-2 border-friends-primary bg-friends-surface flex items-center justify-center font-black text-4xl text-friends-primary shrink-0 shadow-md"
              >
                {{ targetFriend.profile.name.charAt(0) }}
              </div>
              <div class="text-center">
                <h3 class="font-bold text-xl text-gray-900">{{ targetFriend.profile.name }}</h3>
                <p class="text-xs font-semibold text-gray-500 mt-1">
                  {{ '@' + targetFriend.profile.username }}
                </p>
              </div>
              <p class="text-center text-sm font-medium text-gray-600 mt-2 max-w-[280px]">
                Are you sure you want to remove this friend? You will no longer be able to share
                expenses with them.
              </p>
            </div>
            <!-- Bottom Buttons -->
            <div class="pt-2 flex gap-3 shrink-0">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3.5 text-sm min-h-[48px] bg-gray-100 text-gray-700 hover:bg-gray-200 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                (click)="confirmRemove()"
                class="flex-1 font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-3.5 text-sm min-h-[48px] bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30"
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
        map((query) => query.trim()),
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
