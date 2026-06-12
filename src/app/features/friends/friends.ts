import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendService } from '../../core/services/friend.service';
import { UserProfile } from '../../core/services/auth';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full'
  },
  template: `
    <div class="h-full bg-gray-50 p-4 flex flex-col gap-4">
      
      <ng-container *ngIf="isInitialLoading(); else contentArea">
        <!-- Top Summary Box Shimmer -->
        <div class="bg-black text-white p-5 border border-black rounded-none flex flex-col gap-4 relative overflow-hidden h-[124px]">
          <div class="flex flex-col gap-2 relative z-10 mt-2">
            <div class="h-3 bg-gray-800 w-24 animate-pulse"></div>
            <div class="h-10 bg-gray-800 w-16 animate-pulse mt-1"></div>
          </div>
        </div>

        <!-- Friends List Shimmer -->
        <div class="flex flex-col gap-1.5 pb-16 mt-2">
           <div *ngFor="let i of [1,2,3]" class="w-full bg-gray-200 rounded-none p-3 flex items-center gap-4 h-[76px] animate-pulse">
             <div class="w-12 h-12 rounded-full bg-gray-300 shrink-0"></div>
             <div class="flex flex-col gap-2 flex-1">
               <div class="h-4 bg-gray-300 w-1/2"></div>
               <div class="h-3 bg-gray-300 w-1/4"></div>
             </div>
           </div>
        </div>
      </ng-container>

      <ng-template #contentArea>
        <ng-container *ngIf="friendService.acceptedFriends().length > 0 || friendService.incomingRequests().length > 0 || friendService.outgoingRequests().length > 0; else emptyState">
          <!-- Top Summary Box -->
          <div class="bg-black text-white p-5 border border-black rounded-none flex flex-col gap-4 relative overflow-hidden">
            <!-- Abstract Decoration -->
            <div class="absolute -right-10 -top-10 w-32 h-32 bg-gray-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>

            <div class="flex flex-col relative z-10">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Friends</span>
              <span class="text-4xl font-extrabold tracking-tight">
                {{ friendService.acceptedFriends().length | number:'2.0-0' }}
              </span>
            </div>
          </div>

          <!-- Lists Container -->
          <div class="flex-1 flex flex-col gap-6 pb-16 mt-4">
            
            <!-- Incoming Requests -->
            <div *ngIf="friendService.incomingRequests().length > 0" class="flex flex-col gap-2">
              <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Friend Requests</h3>
              <div class="flex flex-col gap-1.5">
                <div 
                  *ngFor="let req of friendService.incomingRequests()"
                  class="w-full bg-white border-2 border-black rounded-none p-3 flex items-center justify-between gap-4"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full border-2 border-black bg-gray-200 flex items-center justify-center font-extrabold text-lg text-black shrink-0">
                      {{ req.profile.name.charAt(0) }}
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="font-extrabold text-sm text-black">{{ req.profile.name }}</span>
                      <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{ '@' + req.profile.username }}</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="friendService.removeFriend(req.id)" class="w-8 h-8 flex items-center justify-center border-2 border-gray-200 hover:border-gray-400 active:bg-gray-100 transition-colors">
                      <svg class="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                    <button (click)="friendService.acceptRequest(req.id)" class="w-8 h-8 flex items-center justify-center bg-black border-2 border-black hover:bg-gray-800 active:bg-gray-700 transition-colors">
                      <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Outgoing Requests -->
            <div *ngIf="friendService.outgoingRequests().length > 0" class="flex flex-col gap-2">
              <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Sent Requests</h3>
              <div class="flex flex-col gap-1.5">
                <div 
                  *ngFor="let req of friendService.outgoingRequests()"
                  class="w-full bg-gray-100 rounded-none p-3 flex items-center justify-between gap-4"
                >
                  <div class="flex items-center gap-3 opacity-60">
                    <div class="w-10 h-10 rounded-full border-2 border-gray-400 bg-gray-200 flex items-center justify-center font-extrabold text-lg text-gray-500 shrink-0">
                      {{ req.profile.name.charAt(0) }}
                    </div>
                    <div class="flex flex-col gap-0.5">
                      <span class="font-extrabold text-sm text-gray-600">{{ req.profile.name }}</span>
                      <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending</span>
                    </div>
                  </div>
                  <button (click)="friendService.removeFriend(req.id)" class="text-[10px] font-bold text-red-500 uppercase tracking-widest px-2 py-1 border-2 border-transparent hover:border-red-200 active:bg-red-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            <!-- Accepted Friends -->
            <div *ngIf="friendService.acceptedFriends().length > 0" class="flex flex-col gap-2">
              <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-widest ml-1">Your Friends</h3>
              <div class="flex flex-col gap-1.5">
                <button 
                  *ngFor="let friend of friendService.acceptedFriends()"
                  (click)="friendService.openRemoveSheet(friend)"
                  class="w-full bg-gray-200 rounded-none p-3 flex items-center gap-4 text-left hover:bg-gray-300 transition-colors active:bg-gray-400"
                >
                  <div class="w-12 h-12 rounded-full border-2 border-black bg-white flex items-center justify-center font-extrabold text-xl text-black shrink-0">
                    {{ friend.profile.name.charAt(0) }}
                  </div>
                  
                  <div class="flex flex-col gap-0.5 flex-1">
                    <span class="font-extrabold text-lg text-black">{{ friend.profile.name }}</span>
                    <div class="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      <span>{{ '@' + friend.profile.username }}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </ng-container>

        <!-- Empty State -->
        <ng-template #emptyState>
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6">
              <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <p class="text-gray-500 font-extrabold text-xl">No friends yet</p>
            <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">Tap the + button below to find and add friends.</p>
          </div>
        </ng-template>
      </ng-template>

    </div>
  `
})
export class Friends implements OnInit {
  friendService = inject(FriendService);
  
  isInitialLoading = signal(true);

  ngOnInit() {
    setTimeout(() => {
      this.isInitialLoading.set(false);
    }, 2000);
  }
}
