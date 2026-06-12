import { Component, inject, signal, effect, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { FriendService } from '../../../core/services/friend.service';
import { UserProfile } from '../../../core/services/auth';
import { Subject, Subscription, of, timer } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter, tap } from 'rxjs/operators';

@Component({
  selector: 'app-friend-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.7, 0, 0.84, 0)', style({ transform: 'translateY(100%)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ],
  template: `
    <!-- Backdrop -->
    <div 
      *ngIf="isVisible()"
      @fadeIn
      (click)="close()"
      class="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
    ></div>

    <!-- Sheet Content -->
    <div 
      *ngIf="isVisible()"
      @slideUp
      class="fixed bottom-0 left-0 right-0 bg-white z-[70] 
             rounded-t-none max-h-[95vh] flex flex-col"
    >
      <!-- Header -->
      <div class="flex justify-between items-center py-3 px-6 bg-black text-white sticky top-0 z-10 shrink-0">
        <h2 class="text-xl font-extrabold tracking-tight">
          {{ isAddMode ? 'Add Friend' : 'Remove Friend' }}
        </h2>
      </div>

      <div class="p-6 flex flex-col gap-6 overflow-y-auto overscroll-contain">
        
        <!-- ADD MODE -->
        <ng-container *ngIf="isAddMode">
          
          <div class="space-y-1 shrink-0">
            <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Search User</label>
            <div class="relative">
              <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text" 
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchChange($event)"
                class="w-full bg-white border-2 border-black rounded-none p-4 pl-12 font-bold text-lg focus:outline-none focus:bg-gray-50 transition-colors"
                placeholder="Username or email..."
              >
            </div>
          </div>

          <!-- Search Results -->
          <div class="flex flex-col gap-2 min-h-[150px] max-h-[40vh] overflow-y-auto pr-2 relative">
             <div *ngIf="isSearching" class="text-center p-4 flex justify-center items-center gap-2">
                <svg class="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-xs font-bold text-gray-500 uppercase tracking-widest">Searching...</p>
             </div>

             <div *ngIf="searchQuery && searchQuery.trim().length > 0 && searchQuery.trim().length < 3" class="text-center p-4">
               <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Type at least 3 characters</p>
             </div>

             <div *ngIf="!isSearching && searchQuery.trim().length >= 3 && searchResults.length === 0" class="text-center p-4">
               <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">No users found</p>
             </div>
             
             <div *ngIf="!searchQuery" class="text-center p-4">
               <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Type to search</p>
             </div>

             <button 
               *ngFor="let user of searchResults"
               (click)="selectUser(user)"
               class="flex items-center gap-4 p-3 border-2 transition-colors rounded-none text-left shrink-0"
               [ngClass]="selectedUser?.username === user.username ? 'border-black bg-gray-50' : 'border-gray-200 bg-white hover:border-black'"
             >
                <div class="w-10 h-10 rounded-full border-2 border-black bg-gray-200 flex items-center justify-center font-extrabold text-lg text-black shrink-0">
                  {{ user.name.charAt(0) }}
                </div>
                <div class="flex flex-col flex-1">
                  <span class="font-extrabold text-black">{{ user.name }}</span>
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{ '@' + user.username }}</span>
                </div>
             </button>
          </div>

          <!-- Bottom Buttons -->
          <div class="pt-2 flex gap-2 shrink-0">
            <button type="button" (click)="close()"
              class="flex-1 bg-white text-black border-2 border-black rounded-none p-4 font-bold text-lg hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="button" [disabled]="!selectedUser" (click)="sendRequest()"
              class="flex-1 bg-black text-white border-2 border-black rounded-none p-4 font-bold text-lg 
                     hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white">
              Send Request
            </button>
          </div>
        </ng-container>


        <!-- REMOVE MODE -->
        <ng-container *ngIf="!isAddMode && targetFriend">
          <div class="flex flex-col items-center py-6 gap-4">
             <div class="w-24 h-24 rounded-full border-4 border-black bg-gray-200 flex items-center justify-center font-extrabold text-5xl text-black shrink-0">
               {{ targetFriend.name.charAt(0) }}
             </div>
             <div class="text-center">
               <h3 class="font-extrabold text-2xl text-black">{{ targetFriend.name }}</h3>
               <p class="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">{{ '@' + targetFriend.username }}</p>
             </div>
             
             <p class="text-center text-sm font-bold text-black mt-4 max-w-[250px]">
               Are you sure you want to remove this friend? You will no longer be able to share expenses with them.
             </p>
          </div>

          <!-- Bottom Buttons -->
          <div class="pt-2 flex gap-2 shrink-0">
            <button type="button" (click)="close()"
              class="flex-1 bg-white text-black border-2 border-black rounded-none p-4 font-bold text-lg hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button type="button" (click)="confirmRemove()"
              class="flex-1 bg-red-600 text-white border-2 border-red-600 rounded-none p-4 font-bold text-lg hover:bg-white hover:text-red-600 transition-colors">
              Remove
            </button>
          </div>
        </ng-container>

      </div>
    </div>
  `
})
export class FriendSheetComponent implements OnInit, OnDestroy {
  friendService = inject(FriendService);

  isVisible = signal(false);
  
  searchQuery = '';
  searchResults: UserProfile[] = [];
  selectedUser: UserProfile | null = null;
  isSearching = false;

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
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.searchSubscription = this.searchSubject.pipe(
      tap(query => {
        if (query.trim().length < 3) {
          this.searchResults = [];
          this.isSearching = false;
        } else {
          this.isSearching = true;
        }
      }),
      filter(query => query.trim().length >= 3),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        // Simulate network delay and automatic cancellation of stale requests
        return timer(200).pipe(
          switchMap(() => of(this.friendService.searchUsers(query)))
        );
      })
    ).subscribe(results => {
      this.searchResults = results;
      this.isSearching = false;
    });
  }

  get isAddMode(): boolean {
    return this.friendService.sheetMode() === 'add';
  }

  get targetFriend(): UserProfile | null {
    return this.friendService.selectedFriend();
  }

  onSearchChange(query: string) {
    this.selectedUser = null;
    this.searchSubject.next(query);
  }

  selectUser(user: UserProfile) {
    this.selectedUser = user;
  }

  sendRequest() {
    if (this.selectedUser) {
      this.friendService.addFriend(this.selectedUser);
      this.close();
    }
  }

  confirmRemove() {
    if (this.targetFriend) {
      this.friendService.removeFriend(this.targetFriend.username);
      this.close();
    }
  }

  close() {
    this.friendService.closeSheet();
  }

  ngOnDestroy() {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
}
