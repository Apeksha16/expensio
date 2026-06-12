import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FriendService } from '../../core/services/friend.service';
import { UserProfile } from '../../core/services/auth';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule],
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
        <ng-container *ngIf="friendService.friends().length > 0; else emptyState">
          <!-- Top Summary Box -->
          <div class="bg-black text-white p-5 border border-black rounded-none flex flex-col gap-4 relative overflow-hidden">
            <!-- Abstract Decoration -->
            <div class="absolute -right-10 -top-10 w-32 h-32 bg-gray-800 rounded-full opacity-50 blur-2xl pointer-events-none"></div>

            <div class="flex flex-col relative z-10">
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Friends</span>
              <span class="text-4xl font-extrabold tracking-tight">
                {{ friendService.friends().length | number:'2.0-0' }}
              </span>
            </div>
          </div>

          <!-- Friends List -->
          <div class="flex-1 flex flex-col gap-1.5 pb-16 mt-2">
            <button 
              *ngFor="let friend of friendService.friends()"
              (click)="friendService.openRemoveSheet(friend)"
              class="w-full bg-gray-200 rounded-none p-3 flex items-center gap-4 text-left hover:bg-gray-300 transition-colors active:bg-gray-400"
            >
              <div class="w-12 h-12 rounded-full border-2 border-black bg-white flex items-center justify-center font-extrabold text-xl text-black shrink-0">
                {{ friend.name.charAt(0) }}
              </div>
              
              <div class="flex flex-col gap-0.5 flex-1">
                <span class="font-extrabold text-lg text-black">{{ friend.name }}</span>
                <div class="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span>{{ '@' + friend.username }}</span>
                </div>
              </div>
            </button>
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
