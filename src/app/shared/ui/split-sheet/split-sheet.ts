import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { SplitService, SplitExpense, SplitParticipant } from '../../../core/services/split.service';
import { FriendService } from '../../../core/services/friend.service';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-split-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(100%)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ],
  template: `
    <ng-container *ngIf="splitService.isSheetOpen()">
      <!-- Backdrop -->
      <div 
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>

      <!-- Sheet Content -->
      <div 
        @slideUp
        class="fixed bottom-0 left-0 right-0 bg-white z-[70] 
               rounded-t-none max-h-[95vh] overflow-y-auto overscroll-contain flex flex-col"
      >
        <!-- Header -->
        <div class="flex justify-between items-center py-3 px-6 bg-black text-white sticky top-0 z-10">
          <h2 class="text-xl font-extrabold tracking-tight">Add Split Expense</h2>
        </div>

        <div class="p-6">
          <ng-container *ngIf="friendService.acceptedFriends().length > 0; else noFriends">
            <form [formGroup]="splitForm" (ngSubmit)="onSubmit()" class="space-y-4">
            
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">Description</label>
              <input type="text" formControlName="title" placeholder="e.g. Dinner, Taxi" 
                class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans">
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">Total Amount</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 font-medium">₹</span>
                </div>
                <input type="number" formControlName="totalAmount" placeholder="0" (keydown)="preventE($event)" 
                  class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8">
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">Paid By</label>
              <div class="relative">
                <button type="button" (click)="isDropdownOpen.set(!isDropdownOpen())" 
                  class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 p-2.5 outline-none transition-all min-h-[44px] touch-manipulation font-sans flex justify-between items-center text-left">
                  <span class="truncate font-semibold">{{ getPayerName() }}</span>
                  <svg class="w-4 h-4 text-gray-500 shrink-0 transition-transform" [class.rotate-180]="isDropdownOpen()" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                </button>

                <div *ngIf="isDropdownOpen()" 
                     class="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 shadow-xl z-50 max-h-60 overflow-y-auto">
                  <button type="button" (click)="selectPayer(currentUser().id)"
                    class="w-full text-left p-3 hover:bg-gray-50 text-sm font-semibold transition-colors flex items-center justify-between"
                    [class.bg-gray-50]="splitForm.get('payerId')?.value === currentUser().id">
                    <span>Me ({{ currentUser().name }})</span>
                    <svg *ngIf="splitForm.get('payerId')?.value === currentUser().id" class="w-4 h-4 text-[#1a2e22]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  </button>
                  <button type="button" *ngFor="let friend of friendService.acceptedFriends()" (click)="selectPayer(friend.profile.id)"
                    class="w-full text-left p-3 hover:bg-gray-50 text-sm font-semibold transition-colors flex items-center justify-between"
                    [class.bg-gray-50]="splitForm.get('payerId')?.value === friend.profile.id">
                    <span>{{ friend.profile.name }}</span>
                    <svg *ngIf="splitForm.get('payerId')?.value === friend.profile.id" class="w-4 h-4 text-[#1a2e22]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  </button>
                </div>
              </div>
              <div *ngIf="isDropdownOpen()" (click)="isDropdownOpen.set(false)" class="fixed inset-0 z-40"></div>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">Split With (Participants)</label>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 cursor-pointer hover:border-[#1a2e22] transition-colors">
                  <input type="checkbox" (change)="toggleParticipant(currentUser().id)" [checked]="isParticipant(currentUser().id)" class="w-5 h-5 accent-[#1a2e22] border-2 border-gray-300 rounded-none focus:ring-0">
                  <span class="font-bold text-sm text-gray-900">Me</span>
                </label>
                
                <label *ngFor="let friend of friendService.acceptedFriends()" class="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 cursor-pointer hover:border-[#1a2e22] transition-colors">
                  <input type="checkbox" (change)="toggleParticipant(friend.profile.id)" [checked]="isParticipant(friend.profile.id)" class="w-5 h-5 accent-[#1a2e22] border-2 border-gray-300 rounded-none focus:ring-0">
                  <span class="font-bold text-sm text-gray-900">{{ friend.profile.name }}</span>
                </label>
              </div>
            </div>

            <div class="flex flex-col gap-1" *ngIf="selectedParticipants().length > 0">
              <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">Split Strategy</label>
              <div class="flex gap-2">
                <button type="button" (click)="setStrategy('EQUAL')" 
                  class="flex-1 font-medium rounded-none transition-all duration-200 flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] border-2 border-gray-200"
                  [ngClass]="splitStrategy() === 'EQUAL' ? 'bg-[#1a2e22] border-[#1a2e22] text-white' : 'bg-white text-gray-900 hover:border-gray-300'">
                  Equally
                </button>
                <button type="button" (click)="setStrategy('CUSTOM')" 
                  class="flex-1 font-medium rounded-none transition-all duration-200 flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] border-2 border-gray-200"
                  [ngClass]="splitStrategy() === 'CUSTOM' ? 'bg-[#1a2e22] border-[#1a2e22] text-white' : 'bg-white text-gray-900 hover:border-gray-300'">
                  Custom
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-2 bg-gray-50 p-4 border-2 border-gray-200" *ngIf="selectedParticipants().length > 0">
              <div *ngFor="let p of selectedParticipants()" class="flex justify-between items-center gap-2">
                <span class="font-bold text-sm text-gray-900 truncate max-w-[45%]">{{ p === currentUser().id ? 'Me' : getFriendName(p) }}</span>
                
                <span *ngIf="splitStrategy() === 'EQUAL'" class="font-extrabold text-sm text-gray-900">₹{{ getEqualAmount() | number:'1.0-2' }}</span>
                
                <div *ngIf="splitStrategy() === 'CUSTOM'" class="w-1/2 relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 font-medium text-xs">₹</span>
                  </div>
                  <input type="number" [formControl]="getCustomControl(p)" placeholder="0" (keydown)="preventE($event)" 
                    class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2 outline-none transition-all placeholder-gray-300 pl-7 text-right">
                </div>
              </div>
              
              <div *ngIf="splitStrategy() === 'CUSTOM'" class="flex justify-between items-center mt-3 pt-3 border-t-2 border-gray-200">
                <span class="text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Left to assign</span>
                <span class="font-extrabold text-sm" [class.text-red-600]="getLeftToAssign() !== 0" [class.text-green-600]="getLeftToAssign() === 0">₹{{ getLeftToAssign() | number:'1.0-2' }}</span>
              </div>
            </div>

            <div class="mt-4 flex gap-4">
              <button type="button" (click)="close()"
                class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-300 text-center">
                Cancel
              </button>
              <button type="submit" [disabled]="!isFormValid()"
                class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-[#1a2e22] hover:bg-[#2f4d3b] text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100">
                Save
              </button>
            </div>

          </form>
          </ng-container>

          <ng-template #noFriends>
            <div class="flex flex-col items-center justify-center py-8 text-center gap-4">
              <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-1">No friends yet</h3>
                <p class="text-sm text-gray-500">You need to add friends before you can split expenses with them.</p>
              </div>
              <button type="button" (click)="close()"
                class="mt-4 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-6 py-2 text-sm min-h-[44px] bg-[#1a2e22] hover:bg-[#2f4d3b] text-white">
                Okay
              </button>
            </div>
          </ng-template>
        </div>
      </div>
    </ng-container>
  `
})
export class SplitSheetComponent implements OnInit {
  splitService = inject(SplitService);
  friendService = inject(FriendService);
  authService = inject(AuthService);
  fb = inject(FormBuilder);

  currentUser = computed(() => this.authService.userProfile());

  splitForm!: FormGroup;

  splitStrategy = signal<'EQUAL' | 'CUSTOM'>('EQUAL');
  selectedParticipants = signal<string[]>([]);
  customAmounts: Record<string, FormControl> = {};
  
  isDropdownOpen = signal(false);

  ngOnInit() {
    this.initForms();
  }

  initForms() {
    this.splitForm = this.fb.group({
      title: ['', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(1)]],
      payerId: [this.currentUser()?.id, Validators.required]
    });
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  getPayerName(): string {
    const val = this.splitForm?.get('payerId')?.value;
    if (val === this.currentUser().id) {
      return `Me (${this.currentUser().name})`;
    }
    return this.getFriendName(val);
  }

  selectPayer(id: string) {
    this.splitForm.patchValue({ payerId: id });
    this.isDropdownOpen.set(false);
  }

  toggleParticipant(id: string) {
    const current = this.selectedParticipants();
    if (current.includes(id)) {
      this.selectedParticipants.set(current.filter(u => u !== id));
      delete this.customAmounts[id];
    } else {
      this.selectedParticipants.set([...current, id]);
      this.customAmounts[id] = new FormControl(0);
    }
  }

  isParticipant(username: string) {
    return this.selectedParticipants().includes(username);
  }

  setStrategy(strategy: 'EQUAL' | 'CUSTOM') {
    this.splitStrategy.set(strategy);
  }

  getEqualAmount(): number {
    const total = this.splitForm.value.totalAmount || 0;
    const count = this.selectedParticipants().length;
    if (count === 0) return 0;
    return total / count;
  }

  getCustomControl(id: string): FormControl {
    if (!this.customAmounts[id]) {
      this.customAmounts[id] = new FormControl(0);
    }
    return this.customAmounts[id];
  }

  getLeftToAssign(): number {
    const total = this.splitForm.value.totalAmount || 0;
    let assigned = 0;
    this.selectedParticipants().forEach(p => {
      assigned += Number(this.customAmounts[p]?.value || 0);
    });
    return total - assigned;
  }

  getFriendName(id: string): string {
    const f = this.friendService.acceptedFriends().find((x: any) => x.profile.id === id);
    return f ? f.profile.name : id;
  }

  isFormValid(): boolean {
    if (this.splitForm.invalid) return false;
    if (this.selectedParticipants().length === 0) return false;
    if (this.splitStrategy() === 'CUSTOM' && this.getLeftToAssign() !== 0) return false;
    return true;
  }

  onSubmit() {
    if (!this.isFormValid()) return;

    const v = this.splitForm.value;
    
    const participants: SplitParticipant[] = this.selectedParticipants().map(p => {
      let amount = 0;
      if (this.splitStrategy() === 'EQUAL') {
        amount = this.getEqualAmount();
      } else {
        amount = Number(this.customAmounts[p].value);
      }
      return { userId: p, amountOwed: amount };
    });

    const split: Omit<SplitExpense, 'id' | 'created_at'> = {
      title: v.title,
      total_amount: v.totalAmount,
      payer_id: v.payerId,
      participants: participants,
      participant_ids: participants.map(p => p.userId),
      date: new Date().toISOString()
    };

    this.splitService.addSplit(split);

    // Reset
    this.splitForm.reset({ payerId: this.currentUser().id });
    this.selectedParticipants.set([]);
    this.splitStrategy.set('EQUAL');
    this.close();
  }

  close() {
    this.splitService.closeSheet();
  }
}
