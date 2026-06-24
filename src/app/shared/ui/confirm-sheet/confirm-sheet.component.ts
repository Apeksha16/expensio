import { Component, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { animate, style, transition, trigger } from '@angular/animations';
import { ConfirmService } from '../../../core/services/confirm.service';

import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AmountInputDirective } from '../amount-input.directive';
import { AutofocusDirective } from '../autofocus.directive';
import { SafeInputDirective } from '../safe-input.directive';

@Component({
  selector: 'app-confirm-sheet',
  standalone: true,
  imports: [SwipeToCloseDirective, FormsModule, AmountInputDirective, AutofocusDirective, SafeInputDirective],
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
    @if (confirmService.isOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        @slideUp
        appSwipeToClose (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 bg-white z-[110] p-6 pb-8 flex flex-col gap-6 shadow-2xl"
      >
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-extrabold tracking-tight text-black">
            {{ confirmService.config()?.title }}
          </h2>
          <p class="text-gray-500 font-bold leading-relaxed">
            {{ confirmService.config()?.message }}
          </p>
          @if (confirmService.config()?.showInput) {
            <div class="mt-2 flex flex-col gap-1">
               <label class="text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</label>
               <input [(ngModel)]="currentAmount" type="text" inputmode="numeric" pattern="[0-9]*"
                 appAmountInput appAutofocus appSafeInput
                 [max]="confirmService.config()?.inputMax ?? null"
                 class="w-full bg-gray-50 border-2 border-gray-200 p-3 font-extrabold text-black outline-none focus:border-black transition-colors rounded-none" />
            </div>
          }
        </div>
        <div class="flex gap-3 mt-2">
          <button
            (click)="close()"
            class="flex-1 bg-white text-gray-900 p-3.5 font-bold text-sm tracking-wide transition-all border-2 border-gray-200 active:scale-[0.98] rounded-none hover:border-gray-300 text-center"
          >
            {{ confirmService.config()?.cancelText }}
          </button>
          <button
            (click)="confirm()"
            [disabled]="isProcessing()"
            class="flex-1 bg-red-600 text-white p-3.5 font-bold text-sm tracking-wide transition-all border-2 border-transparent active:scale-[0.98] rounded-none flex items-center justify-center gap-2 disabled:opacity-70"
          >
            @if (isProcessing()) {
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            }
            {{ confirmService.config()?.confirmText }}
          </button>
        </div>
      </div>
    }
  `,
})
export class ConfirmSheetComponent { 
  haptic = inject(HapticService);
  confirmService = inject(ConfirmService);
  isProcessing = signal(false);
  currentAmount?: number;

  constructor() {
    effect(() => {
      const config = this.confirmService.config();
      // Only set currentAmount when config changes to a new config (opening the modal)
      if (config) {
        if (config.showInput) {
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
             this.currentAmount = config.inputValue;
          });
        } else {
          this.currentAmount = undefined;
        }
      }
    });
  }

  close() {
    this.haptic.impactLight();
    this.confirmService.close();
  }

  async confirm() {
    const config = this.confirmService.config();
    if (config && config.onConfirm) {
      this.isProcessing.set(true);
      await config.onConfirm(this.currentAmount);
      this.isProcessing.set(false);
    }
    this.close();
  }
}
