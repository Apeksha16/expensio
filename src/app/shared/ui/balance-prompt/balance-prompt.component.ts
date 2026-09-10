import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';

import { BalancePromptService } from '../../../core/services/balance-prompt.service';
import { AccountTrackerService, AccountType, UserAccount } from '../../../core/services/account-tracker.service';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';

@Component({
  selector: 'app-balance-prompt',
  standalone: true,
  imports: [CommonModule, AutofocusDirective],
  animations: [
    trigger('zoomIn', [
      transition(':enter', [
        style({ transform: 'scale(0.95)', opacity: 0 }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'scale(0.95)', opacity: 0 })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (balancePromptService.isOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="snooze()"
        class="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
      ></div>

      <!-- Modal Content -->
      <div class="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
        <div
          @zoomIn
          class="bg-white rounded-3xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden flex flex-col"
        >
          <!-- Header -->
          <div class="px-6 pt-8 pb-4 text-center">
            <div class="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 class="text-xl font-extrabold text-gray-900 mb-2">Verify Balances</h2>
            <p class="text-[13.5px] text-gray-500 leading-relaxed font-medium">
              Are your account balances up to date? Please verify them to keep your tracking accurate.
            </p>
          </div>

          <!-- Accounts List -->
          <div class="px-6 py-2 flex flex-col gap-3">
            @for (account of accountTracker.accounts(); track account.id) {
              <div 
                class="flex items-center justify-between p-3.5 rounded-2xl border-2 transition-colors duration-200"
                [ngClass]="confirmedAccounts().has(account.id) ? 'border-green-100 bg-green-50/30' : 'border-gray-100 bg-white'"
              >
                <div 
                  class="flex flex-col flex-1" 
                  (click)="startEdit(account)"
                  [class.cursor-pointer]="editingAccountId() !== account.id"
                >
                  <span class="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{{ account.account_type }}</span>
                  
                  <div class="h-8 flex items-center -ml-1">
                    @if (editingAccountId() === account.id) {
                      <div 
                        class="flex items-center bg-sky-100 rounded-lg pl-2 pr-1 h-8 ml-1 w-[130px] border border-sky-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all"
                        (click)="$event.stopPropagation()"
                      >
                        <span class="text-base font-bold text-sky-600">₹</span>
                        <input 
                          type="number" 
                          [value]="account.balance" 
                          #balInput
                          (blur)="saveEdit(account, balInput.value)"
                          (keydown.enter)="saveEdit(account, balInput.value); balInput.blur()"
                          appAutofocus
                          class="w-full bg-transparent text-sky-900 font-bold text-base outline-none pl-1 placeholder-sky-300"
                        />
                        <button 
                          (mousedown)="saveEdit(account, balInput.value); $event.preventDefault()"
                          class="w-6 h-6 flex items-center justify-center bg-sky-500 text-white rounded shrink-0 hover:bg-sky-600 active:scale-95 transition-all shadow-sm"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    } @else {
                      <span class="text-lg font-bold text-gray-900 ml-1">₹{{ (account.balance || 0).toLocaleString('en-IN') }}</span>
                    }
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <!-- Confirm Button -->
                  <button
                    (click)="toggleConfirm(account.id)"
                    class="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0"
                    [ngClass]="confirmedAccounts().has(account.id) ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="p-6 flex flex-col gap-3 mt-2">
            @if (allConfirmed()) {
              <button
                (click)="markCompleted()"
                class="w-full font-bold rounded-2xl transition-all active:scale-95 px-4 py-4 text-sm bg-green-500 text-white shadow-md shadow-green-500/30"
              >
                All Looks Good
              </button>
            }
            <button
              (click)="snooze()"
              class="w-full font-bold rounded-2xl transition-all active:scale-95 px-4 py-4 text-sm bg-slate-100 text-slate-700"
            >
              Snooze
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class BalancePromptComponent {
  balancePromptService = inject(BalancePromptService);
  accountTracker = inject(AccountTrackerService);
  haptic = inject(HapticService);
  router = inject(Router);

  confirmedAccounts = signal(new Set<string>());

  allConfirmed = signal(false);

  constructor() {
    effect(() => {
      // Re-evaluate if all are confirmed when set changes
      const currentConfirmed = this.confirmedAccounts();
      const accounts = this.accountTracker.accounts();
      
      if (accounts.length > 0 && currentConfirmed.size === accounts.length) {
        this.allConfirmed.set(true);
      } else {
        this.allConfirmed.set(false);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.balancePromptService.isOpen()) {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
        const saved = localStorage.getItem(`confirmedBalances_${currentMonth}`);
        if (saved) {
          try {
            this.confirmedAccounts.set(new Set(JSON.parse(saved)));
          } catch(e) {
            this.confirmedAccounts.set(new Set<string>());
          }
        } else {
          this.confirmedAccounts.set(new Set<string>());
        }
      }
    }, { allowSignalWrites: true });
  }

  toggleConfirm(id: string) {
    this.haptic.impactLight();
    const current = new Set(this.confirmedAccounts());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.confirmedAccounts.set(current);
    
    // Save to local storage
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    localStorage.setItem(`confirmedBalances_${currentMonth}`, JSON.stringify(Array.from(current)));
  }

  markCompleted() {
    this.haptic.success();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
    localStorage.setItem('lastBalancePromptMonth', currentMonth);
    this.balancePromptService.close();
  }

  editingAccountId = signal<string | null>(null);

  startEdit(account: UserAccount) {
    if (this.editingAccountId() === account.id) return;
    this.haptic.selection();
    this.editingAccountId.set(account.id);
  }

  saveEdit(account: UserAccount, valueStr: string) {
    const val = parseFloat(valueStr);
    if (!isNaN(val) && val >= 0) {
      if (val !== account.balance) {
        this.accountTracker.adjustBalanceAbsolute(account.account_type, val);
      }
    }
    this.editingAccountId.set(null);
  }

  snooze() {
    this.haptic.impactLight();
    this.balancePromptService.close();
  }
}
