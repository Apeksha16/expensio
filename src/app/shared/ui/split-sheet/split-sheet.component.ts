import { Component, inject, computed, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { SplitService, SplitExpense, SplitParticipant } from '../../../core/services/split.service';
import { FriendService } from '../../../core/services/friend.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';

import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';
import { SafeInputDirective } from '../safe-input.directive';

@Component({
  selector: 'app-split-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SwipeToCloseDirective, AmountInputDirective, AutofocusDirective, SafeInputDirective],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(100%)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('300ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  template: `
    @if (splitService.isSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        @slideUp
        appSwipeToClose (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 bg-black z-[70] max-h-[95vh] overflow-y-auto overscroll-none flex flex-col shadow-2xl"
      >

        <!-- Header -->
        <div
          class="flex justify-between items-center py-4 px-6 bg-black border-b border-black text-white sticky top-[-2px] z-10"
        >
          <h2 class="text-xl font-extrabold tracking-tight">{{ splitService.editingSplit()?.id ? 'Edit Split Expense' : 'Add Split Expense' }}</h2>
          @if (splitService.editingSplit()?.id) {
              <button
                type="button"
                (click)="onDelete()"
                [disabled]="isDeleting()"
                class="w-8 h-8 bg-red-500 flex items-center justify-center border-2 border-transparent hover:border-white transition-colors rounded-none text-white disabled:opacity-70"
              >
                @if (isDeleting()) {
                  <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                } @else {
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                }
              </button>
          }
        </div>
        <div class="p-6 bg-white flex-1">
          @if (splitService.editingSplit()?.id) {
            <div class="flex justify-center mb-5">
              <span class="text-[9px] font-extrabold tracking-widest uppercase text-gray-400 bg-gray-100 px-3 py-1 rounded-none">
                @if (isUpdated()) {
                  Updated {{ splitService.editingSplit()?.date | date: 'medium' }}
                } @else {
                  Added {{ splitService.editingSplit()?.created_at | date: 'medium' }}
                }
              </span>
            </div>
          }
          @if (friendService.acceptedFriends().length > 0) {
            <form [formGroup]="splitForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                  >Description</label
                >
                <input
                  appAutofocus
                  appSafeInput
                  type="text"
                  formControlName="title"
                  placeholder="e.g. Dinner, Taxi"
                  class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans"
                />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                  >Total Amount</label
                >
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 font-medium">₹</span>
                  </div>
                  <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    appAmountInput
                    formControlName="totalAmount"
                    placeholder="0"
                    (keydown)="preventE($event)"
                    class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8"
                  />
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                  >Category</label
                >
                <div class="grid grid-cols-4 gap-2">
                  @for (cat of budgetCategories(); track cat.name) {
                    <button
                      type="button"
                      (click)="selectCategory(cat.name)"
                      class="flex flex-col items-center justify-center gap-1 p-2 border-2 rounded-none transition-all min-h-[60px]"
                      [ngClass]="
                        splitForm.get('category')?.value === cat.name
                          ? 'border-[#1a2e22] bg-[#1a2e22] text-white'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      "
                    >
                      <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path [attr.d]="cat.path"></path>
                      </svg>
                      <span
                        class="text-[9px] font-semibold uppercase tracking-wider text-center line-clamp-1 w-full overflow-hidden text-ellipsis"
                        >{{ cat.name }}</span
                      >
                    </button>
                  }
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                  >Paid By</label
                >
                <div class="relative">
                  <button
                    type="button"
                    (click)="isDropdownOpen.set(!isDropdownOpen())"
                    class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 p-2.5 outline-none transition-all min-h-[44px] touch-manipulation font-sans flex justify-between items-center text-left"
                  >
                    <span class="truncate font-semibold">{{ getPayerName() }}</span>
                    <svg
                      class="w-4 h-4 text-gray-500 shrink-0 transition-transform"
                      [class.rotate-180]="isDropdownOpen()"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  @if (isDropdownOpen()) {
                    <div
                      class="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 shadow-xl z-50 max-h-60 overflow-y-auto"
                    >
                      <button
                        type="button"
                        (click)="selectPayer(currentUser().id)"
                        class="w-full text-left p-3 hover:bg-gray-50 text-sm font-semibold transition-colors flex items-center justify-between"
                        [class.bg-gray-50]="splitForm.get('payerId')?.value === currentUser().id"
                      >
                        <span>Me ({{ currentUser().name }})</span>
                        @if (splitForm.get('payerId')?.value === currentUser().id) {
                          <svg
                            class="w-4 h-4 text-[#1a2e22]"
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
                      @for (friend of friendService.acceptedFriends(); track friend.id) {
                        <button
                          type="button"
                          (click)="selectPayer(friend.profile.id)"
                          class="w-full text-left p-3 hover:bg-gray-50 text-sm font-semibold transition-colors flex items-center justify-between"
                          [class.bg-gray-50]="splitForm.get('payerId')?.value === friend.profile.id"
                        >
                          <span>{{ friend.profile.name }}</span>
                          @if (splitForm.get('payerId')?.value === friend.profile.id) {
                            <svg
                              class="w-4 h-4 text-[#1a2e22]"
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
                      }
                    </div>
                  }
                </div>
                @if (isDropdownOpen()) {
                  <div (click)="isDropdownOpen.set(false)" class="fixed inset-0 z-40"></div>
                }
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                  >Split With (Participants)</label
                >
                <div class="flex flex-col gap-2">

                  @for (friend of friendService.acceptedFriends(); track friend.id) {
                    <label
                      class="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 cursor-pointer hover:border-[#1a2e22] transition-colors"
                    >
                      <input
                        type="checkbox"
                        (change)="toggleParticipant(friend.profile.id)"
                        [checked]="isParticipant(friend.profile.id)"
                        class="w-5 h-5 accent-[#1a2e22] border-2 border-gray-300 rounded-none focus:ring-0"
                      />
                      <span class="font-bold text-sm text-gray-900 truncate">{{ friend.profile.name.split(' ')[0] }}</span>
                    </label>
                  }
                </div>
              </div>
              @if (selectedParticipants().length > 0) {
                <div class="flex flex-col gap-1">
                  <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                    >Split Strategy</label
                  >
                  <div class="flex gap-2">
                    <button
                      type="button"
                      (click)="setStrategy('EQUAL')"
                      class="flex-1 font-medium rounded-none transition-all duration-200 flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] border-2 border-gray-200"
                      [ngClass]="
                        splitStrategy() === 'EQUAL'
                          ? 'bg-[#1a2e22] border-[#1a2e22] text-white'
                          : 'bg-white text-gray-900 hover:border-gray-300'
                      "
                    >
                      Equally
                    </button>
                    <button
                      type="button"
                      (click)="setStrategy('CUSTOM')"
                      class="flex-1 font-medium rounded-none transition-all duration-200 flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] border-2 border-gray-200"
                      [ngClass]="
                        splitStrategy() === 'CUSTOM'
                          ? 'bg-[#1a2e22] border-[#1a2e22] text-white'
                          : 'bg-white text-gray-900 hover:border-gray-300'
                      "
                    >
                      Custom
                    </button>
                  </div>
                </div>
              }
              @if (selectedParticipants().length > 0) {
                <div class="flex flex-col gap-2 bg-gray-50 p-4 border-2 border-gray-200">
                  @for (p of selectedParticipants(); track p) {
                    <div class="flex justify-between items-center gap-2">
                      <span class="font-bold text-sm text-gray-900 truncate max-w-[45%]">{{
                        getFriendName(p)
                      }}</span>
                      @if (splitStrategy() === 'EQUAL') {
                        <span class="font-extrabold text-sm text-gray-900"
                          >₹{{ getEqualAmount() | number: '1.0-2' }}</span
                        >
                      }
                      @if (splitStrategy() === 'CUSTOM') {
                        <div class="w-1/2 relative group">
                          <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                          >
                            <span class="text-gray-500 font-medium text-xs">₹</span>
                          </div>
                          <input
                            type="text"
                            inputmode="numeric"
                            pattern="[0-9]*"
                            appAmountInput
                            [formControl]="getCustomControl(p)"
                            placeholder="0"
                            (keydown)="preventE($event)"
                            class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2 outline-none transition-all placeholder-gray-300 pl-7 text-right"
                          />
                        </div>
                      }
                    </div>
                  }
                  @if (splitStrategy() === 'CUSTOM') {
                    <div
                      class="flex justify-between items-center mt-3 pt-3 border-t-2 border-gray-200"
                    >
                      <span
                        class="text-[10px] font-semibold text-gray-500 tracking-widest uppercase"
                        >My Share</span
                      >
                      <span
                        class="font-extrabold text-sm"
                        [class.text-red-600]="getLeftToAssign() < 0"
                        [class.text-gray-900]="getLeftToAssign() >= 0"
                        >₹{{ getLeftToAssign() | number: '1.0-2' }}</span
                      >
                    </div>
                  }
                </div>
              }
              <div class="mt-4 flex gap-4">
                <button
                  type="button"
                  (click)="close()"
                  class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-300 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!isFormValid() || isSaving()"
                  class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-[#1a2e22] hover:bg-[#2f4d3b] text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  @if (isSaving()) {
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  }
                  {{ isUpdated() ? 'Update' : 'Save' }}
                </button>
              </div>
            </form>
          } @else {
            <div class="flex flex-col items-center justify-center py-8 text-center gap-4">
              <div class="w-16 h-16 rounded-none bg-gray-100 flex items-center justify-center">
                <svg
                  class="w-8 h-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 mb-1">No friends yet</h3>
                <p class="text-sm text-gray-500">
                  You need to add friends before you can split expenses with them.
                </p>
              </div>
              <button
                type="button"
                (click)="close()"
                class="mt-4 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-6 py-2 text-sm min-h-[44px] bg-[#1a2e22] hover:bg-[#2f4d3b] text-white"
              >
                Okay
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class SplitSheetComponent implements OnInit { 
  haptic = inject(HapticService);
  splitService = inject(SplitService);
  friendService = inject(FriendService);
  authService = inject(AuthService);
  confirmService = inject(ConfirmService);
  fb = inject(FormBuilder);

  currentUser = computed(() => this.authService.userProfile());

  splitForm!: FormGroup;

  isSaving = signal(false);
  isDeleting = signal(false);

  splitStrategy = signal<'EQUAL' | 'CUSTOM'>('EQUAL');
  selectedParticipants = signal<string[]>([]);
  customAmounts: Record<string, FormControl> = {};

  isDropdownOpen = signal(false);

  localBudgets = signal<any[]>([]);

  budgetCategories = computed(() => {
    const defaultCats = [
      { name: 'Food', path: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7' },
      { name: 'Transport', path: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2 M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z' },
      { name: 'Shopping', path: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0' },
      { name: 'Utilities', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
      { name: 'Entertain', path: 'M2 10h20 M8 2v4 M16 2v4 M2 14h20 M2 18h20 M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z' },
      { name: 'Health', path: 'M22 12h-4l-3 9L9 3l-3 9H2' },
      { name: 'Travel', path: 'M22 2 11 13 M22 2l-7 20-4-9-9-4Z' },
      { name: 'Other', path: 'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0' },
    ];
    if (this.localBudgets().length === 0) return defaultCats;
    return this.localBudgets()
      .filter(b => b.id !== 'virtual-others')
      .map((b) => ({
        name: b.name,
        path:
          b.icon_path ||
          'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
      }));
  });

  supabaseService = inject(SupabaseService);

  constructor() {
    this.initForms();
    
    effect(() => {
      const isOpen = this.splitService.isSheetOpen();
      const split = this.splitService.editingSplit();
      
      if (isOpen) {
        if (split && split.id) {
          this.splitForm.patchValue({
            title: split.title,
            totalAmount: split.total_amount,
            payerId: split.payer_id,
            category: split.category || ''
          });

          const currentUserProfile = this.currentUser();
          const friendsInvolved = split.participants.filter(p => p.userId !== currentUserProfile?.id);
          this.selectedParticipants.set(friendsInvolved.map(p => p.userId));
          
          const equalAmt = split.total_amount / split.participants.length;
          const isEqual = split.participants.every(p => Math.abs(p.amountOwed - equalAmt) <= 1);
          
          friendsInvolved.forEach(p => {
            this.customAmounts[p.userId] = new FormControl(Math.round(p.amountOwed));
          });
          
          if (isEqual) {
            this.splitStrategy.set('EQUAL');
          } else {
            this.splitStrategy.set('CUSTOM');
          }
        } else {
          const currentUserProfile = this.currentUser();
          this.splitForm.patchValue({
            title: '',
            totalAmount: null,
            payerId: currentUserProfile?.id,
            category: ''
          });
          this.selectedParticipants.set([]);
          this.customAmounts = {};
          this.splitStrategy.set('EQUAL');
        }
      }
    });

    this.loadCategories();
  }

  async loadCategories() {
    const month = new Date().toISOString().substring(0, 7);
    try {
      const { data } = await this.supabaseService.client
        .from('budgets')
        .select('*')
        .eq('month', month)
        .order('created_at', { ascending: true });
      if (data) {
        this.localBudgets.set(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  ngOnInit() {
  }

  initForms() {
    this.splitForm = this.fb.group({
      title: ['', Validators.required],
      totalAmount: [null, [Validators.required, Validators.min(1)]],
      payerId: [this.currentUser()?.id, Validators.required],
      category: [''],
    });
  }

  selectCategory(name: string) {
    this.splitForm.patchValue({ category: name });
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  getPayerName(): string {
    const val = this.splitForm?.get('payerId')?.value;
    if (val === this.currentUser().id) {
      return `Me (${this.currentUser().name.split(' ')[0]})`;
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
      this.selectedParticipants.set(current.filter((u) => u !== id));
      delete this.customAmounts[id];
    } else {
      this.selectedParticipants.set([...current, id]);
      this.customAmounts[id] = new FormControl(null);
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
    return Math.round((total / (count + 1)) * 100) / 100;
  }

  getCustomControl(id: string): FormControl {
    if (!this.customAmounts[id]) {
      this.customAmounts[id] = new FormControl(null);
    }
    return this.customAmounts[id];
  }

  getLeftToAssign(): number {
    const total = this.splitForm.value.totalAmount || 0;
    let assigned = 0;
    this.selectedParticipants().forEach((p) => {
      assigned += Number(this.customAmounts[p]?.value || 0);
    });
    // For EQUAL strategy, calculate exact remainder
    if (this.splitStrategy() === 'EQUAL') {
      const equalAmount = this.getEqualAmount();
      assigned = equalAmount * this.selectedParticipants().length;
    }
    return Math.round((total - assigned) * 100) / 100;
  }

  getFriendName(id: string): string {
    const f = this.friendService.acceptedFriends().find((x: any) => x.profile.id === id);
    return f ? f.profile.name.split(' ')[0] : id;
  }

  isFormValid(): boolean {
    if (this.splitForm.invalid) return false;
    if (this.selectedParticipants().length === 0) return false;
    if (this.splitStrategy() === 'CUSTOM' && this.getLeftToAssign() < 0) return false;
    return true;
  }

  isUpdated(): boolean {
    const split = this.splitService.editingSplit();
    if (!split || !split.created_at || !split.date) return false;
    const diff = Math.abs(new Date(split.date).getTime() - new Date(split.created_at).getTime());
    return diff > 5000;
  }

  async onSubmit() {
    if (!this.isFormValid()) return;
    this.isSaving.set(true);

    const v = this.splitForm.value;

    const participants: SplitParticipant[] = this.selectedParticipants().map((p) => {
      let amount = 0;
      if (this.splitStrategy() === 'EQUAL') {
        amount = this.getEqualAmount();
      } else {
        amount = Number(this.customAmounts[p].value);
      }
      return { userId: p, amountOwed: amount };
    });

    let myAmount = this.getLeftToAssign();
    participants.push({ userId: this.currentUser().id, amountOwed: myAmount });

    const splitContext = this.splitService.editingSplit();
    const isEditing = splitContext && !!splitContext.id;

    if (isEditing) {
      const updatedSplit: SplitExpense = {
        ...splitContext,
        title: v.title,
        total_amount: v.totalAmount,
        payer_id: v.payerId,
        participants: participants,
        participant_ids: participants.map((p) => p.userId),
        category: v.category || 'Others',
        date: new Date().toISOString(),
      };
      await this.splitService.updateSplit(updatedSplit);
    } else {
      let groupId = null;
      if (splitContext && !splitContext.id && splitContext.group_id) {
         groupId = splitContext.group_id;
      }
      
      const split: Omit<SplitExpense, 'id' | 'created_at'> = {
        title: v.title,
        total_amount: v.totalAmount,
        payer_id: v.payerId,
        participants: participants,
        participant_ids: participants.map((p) => p.userId),
        group_id: groupId,
        category: v.category || 'Others',
        date: new Date().toISOString(),
      };
      await this.splitService.addSplit(split);
    }

    // Reset
    this.splitForm.reset({ payerId: this.currentUser().id });
    this.selectedParticipants.set([]);
    this.customAmounts = {};
    this.splitStrategy.set('EQUAL');
    this.isSaving.set(false);
    this.close();
  }

  onDelete() {
    const split = this.splitService.editingSplit();
    if (!split) return;
    
    this.confirmService.open({
      title: 'Delete Split',
      message: 'Are you sure you want to delete this split expense? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        this.isDeleting.set(true);
        await this.splitService.deleteSplit(split.id);
        this.isDeleting.set(false);
        this.close();
      }
    });
  }

  close() {
    this.haptic.impactLight();
    this.splitService.closeSheet();
  }
}
