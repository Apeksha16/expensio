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
          <form [formGroup]="splitForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Description</label>
              <input type="text" formControlName="title" placeholder="e.g. Dinner, Taxi" 
                class="w-full bg-white border-2 border-black rounded-none p-4 font-bold text-lg focus:outline-none focus:bg-gray-50 transition-colors">
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Total Amount</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-extrabold text-black">₹</span>
                <input type="number" formControlName="totalAmount" placeholder="0" (keydown)="preventE($event)" 
                  class="w-full bg-white border-2 border-black rounded-none p-4 pl-12 text-3xl font-extrabold focus:outline-none focus:bg-gray-50 transition-colors">
              </div>
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Paid By</label>
              <div class="relative">
                <select formControlName="payerUsername" 
                  class="w-full bg-white border-2 border-black rounded-none p-4 font-bold text-lg focus:outline-none focus:bg-gray-50 transition-colors appearance-none cursor-pointer">
                  <option [value]="currentUser().username">Me ({{ currentUser().name }})</option>
                  <option *ngFor="let friend of friendService.friends()" [value]="friend.username">{{ friend.name }}</option>
                </select>
                <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg class="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Split With (Participants)</label>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-3 p-4 bg-white border-2 border-black cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" (change)="toggleParticipant(currentUser().username!)" [checked]="isParticipant(currentUser().username!)" class="w-6 h-6 accent-black border-2 border-black">
                  <span class="font-bold text-lg">Me</span>
                </label>
                
                <label *ngFor="let friend of friendService.friends()" class="flex items-center gap-3 p-4 bg-white border-2 border-black cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" (change)="toggleParticipant(friend.username)" [checked]="isParticipant(friend.username)" class="w-6 h-6 accent-black border-2 border-black">
                  <span class="font-bold text-lg">{{ friend.name }}</span>
                </label>
              </div>
            </div>

            <div class="space-y-1" *ngIf="selectedParticipants().length > 0">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Split Strategy</label>
              <div class="flex gap-2">
                <button type="button" (click)="setStrategy('EQUAL')" 
                  class="flex-1 py-4 font-bold text-lg border-2 border-black transition-colors rounded-none"
                  [ngClass]="splitStrategy() === 'EQUAL' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'">
                  Equally
                </button>
                <button type="button" (click)="setStrategy('CUSTOM')" 
                  class="flex-1 py-4 font-bold text-lg border-2 border-black transition-colors rounded-none"
                  [ngClass]="splitStrategy() === 'CUSTOM' ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'">
                  Custom
                </button>
              </div>
            </div>

            <div class="flex flex-col gap-2 bg-gray-50 p-4 border-2 border-black" *ngIf="selectedParticipants().length > 0">
              <div *ngFor="let p of selectedParticipants()" class="flex justify-between items-center gap-2">
                <span class="font-bold text-lg truncate max-w-[45%]">{{ p === currentUser().username ? 'Me' : getFriendName(p) }}</span>
                
                <span *ngIf="splitStrategy() === 'EQUAL'" class="font-extrabold text-xl">₹{{ getEqualAmount() | number:'1.0-2' }}</span>
                
                <div *ngIf="splitStrategy() === 'CUSTOM'" class="w-1/2 relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-500">₹</span>
                  <input type="number" [formControl]="getCustomControl(p)" placeholder="0" (keydown)="preventE($event)" 
                    class="w-full bg-white border-2 border-black focus:bg-gray-50 rounded-none pl-8 p-3 font-bold text-lg outline-none text-right transition-colors">
                </div>
              </div>
              
              <div *ngIf="splitStrategy() === 'CUSTOM'" class="flex justify-between items-center mt-4 pt-4 border-t-2 border-black">
                <span class="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Left to assign</span>
                <span class="font-extrabold text-xl" [class.text-red-600]="getLeftToAssign() !== 0" [class.text-green-600]="getLeftToAssign() === 0">₹{{ getLeftToAssign() | number:'1.0-2' }}</span>
              </div>
            </div>

            <div class="pt-2 flex gap-2">
              <button type="button" (click)="close()"
                class="flex-1 bg-white text-black border-2 border-black rounded-none p-4 font-bold text-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button type="submit" [disabled]="!isFormValid()"
                class="flex-1 bg-black text-white border-2 border-black rounded-none p-4 font-bold text-lg hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white">
                Save
              </button>
            </div>

          </form>
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

  ngOnInit() {
    this.initForms();
  }

  initForms() {
    this.splitForm = this.fb.group({
      title: ['', Validators.required],
      totalAmount: ['', [Validators.required, Validators.min(1)]],
      payerUsername: [this.currentUser()?.username, Validators.required]
    });
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  toggleParticipant(username: string) {
    const current = this.selectedParticipants();
    if (current.includes(username)) {
      this.selectedParticipants.set(current.filter(u => u !== username));
      delete this.customAmounts[username];
    } else {
      this.selectedParticipants.set([...current, username]);
      this.customAmounts[username] = new FormControl(0);
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

  getCustomControl(username: string): FormControl {
    if (!this.customAmounts[username]) {
      this.customAmounts[username] = new FormControl(0);
    }
    return this.customAmounts[username];
  }

  getLeftToAssign(): number {
    const total = this.splitForm.value.totalAmount || 0;
    let assigned = 0;
    this.selectedParticipants().forEach(p => {
      assigned += Number(this.customAmounts[p]?.value || 0);
    });
    return total - assigned;
  }

  getFriendName(username: string): string {
    const f = this.friendService.friends().find(x => x.username === username);
    return f ? f.name : username;
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
      return { username: p, amountOwed: amount };
    });

    const split: SplitExpense = {
      id: Date.now().toString(),
      title: v.title,
      totalAmount: v.totalAmount,
      payerUsername: v.payerUsername,
      participants: participants,
      date: new Date().toISOString()
    };

    this.splitService.addSplit(split);

    // Reset
    this.splitForm.reset({ payerUsername: this.currentUser().username });
    this.selectedParticipants.set([]);
    this.splitStrategy.set('EQUAL');
    this.close();
  }

  close() {
    this.splitService.closeSheet();
  }
}
