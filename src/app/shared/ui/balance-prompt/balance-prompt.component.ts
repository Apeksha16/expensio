import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router } from '@angular/router';

import { BalancePromptService } from '../../../core/services/balance-prompt.service';
import { AccountTrackerService, AccountType, UserAccount } from '../../../core/services/account-tracker.service';
import { HapticService } from '../../../core/services/haptic.service';
import { ToastService } from '../../../core/services/toast.service';
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
              <div class="flex items-center justify-between p-3.5 rounded-2xl border-2 border-gray-100 bg-white transition-colors duration-200">
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
                          [value]="editedBalances()[account.id] ?? account.balance" 
                          #balInput
                          (blur)="saveEdit(account, balInput.value)"
                          (keydown.enter)="saveEdit(account, balInput.value); balInput.blur()"
                          appAutofocus
                          class="w-full bg-transparent text-sky-900 font-bold text-base outline-none pl-1 placeholder-sky-300"
                        />
                      </div>
                    } @else {
                      <span class="text-lg font-bold text-gray-900 ml-1">₹{{ (editedBalances()[account.id] ?? account.balance || 0).toLocaleString('en-IN') }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="p-6 flex flex-col gap-3 mt-2">
            <button
              (click)="markCompleted()"
              [disabled]="isUpdating()"
              class="w-full font-bold rounded-2xl transition-all active:scale-95 px-4 py-4 text-sm bg-blue-600 text-white shadow-md shadow-blue-600/30 flex items-center justify-center disabled:opacity-70 disabled:active:scale-100"
            >
              @if (isUpdating()) {
                <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              } @else {
                Update
              }
            </button>
            <button
              (click)="snooze()"
              [disabled]="isUpdating()"
              class="w-full font-bold rounded-2xl transition-all active:scale-95 px-4 py-4 text-sm bg-slate-100 text-slate-700 flex items-center justify-center disabled:opacity-70 disabled:active:scale-100"
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
  toastService = inject(ToastService);

  editedBalances = signal<Record<string, number>>({});
  isUpdating = signal(false);

  async markCompleted() {
    this.isUpdating.set(true);
    const edits = this.editedBalances();
    const accounts = this.accountTracker.accounts();
    let hasError = false;
    let anyUpdated = false;

    // Apply all edits
    for (const acc of accounts) {
      if (edits[acc.id] !== undefined && edits[acc.id] !== acc.balance) {
        try {
          await this.accountTracker.adjustBalanceAbsolute(acc.account_type, edits[acc.id]);
          anyUpdated = true;
        } catch (e: any) {
          hasError = true;
          this.toastService.show(e.message?.includes('security policy') ? 'Permission denied to adjust this account.' : 'Failed to update some balances.', 'error');
        }
      }
    }

    if (!hasError) {
      this.haptic.success();
      if (anyUpdated) {
        this.toastService.show('Balances updated successfully', 'success');
      }
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
      localStorage.setItem('lastBalancePromptMonth', currentMonth);
      this.balancePromptService.close();
    }
    this.isUpdating.set(false);
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
        this.editedBalances.update(v => ({ ...v, [account.id]: val }));
      } else {
        this.editedBalances.update(v => {
          const newV = { ...v };
          delete newV[account.id];
          return newV;
        });
      }
    }
    this.editingAccountId.set(null);
  }

  async snooze() {
    this.isUpdating.set(true);
    this.haptic.impactLight();
    // Simulate brief network delay for snooze to show spinner
    await new Promise(resolve => setTimeout(resolve, 300));
    this.balancePromptService.close();
    this.isUpdating.set(false);
  }
}
