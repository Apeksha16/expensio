import { Component, inject, signal, effect, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  imports: [
    SwipeToCloseDirective,
    FormsModule,
    AmountInputDirective,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirmService.isOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="active:scale-[0.98] transition-all duration-200 fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        @slideUp
        appSwipeToClose
        (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 z-[110] bg-white p-6  flex flex-col gap-6 rounded-t-[32px] shadow-2xl" style="padding-bottom: calc(env(safe-area-inset-bottom) + 2rem);"
      >
        <div class="flex flex-col gap-2">
          <h2 class="text-xl font-bold tracking-tight text-gray-900">
            {{ confirmService.config()?.title }}
          </h2>
          <p class="text-gray-600 font-medium text-sm leading-relaxed">
            {{ confirmService.config()?.message }}
          </p>
          @if (confirmService.config()?.showInput) {
            <div class="mt-2 flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wider"
                >Amount</label
              >
              <input
                [(ngModel)]="currentAmount"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                appAmountInput
                appAutofocus
                appSafeInput
                [max]="confirmService.config()?.inputMax ?? null"
                class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl px-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
              />
            </div>
          }
        </div>
        <div class="flex flex-col gap-3 mt-2">
          @if (confirmService.config()?.thirdText) {
            <button
              (click)="thirdAction()"
              [disabled]="isProcessing()"
              class="w-full font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-indigo-600 text-white shadow-md shadow-indigo-600/30 disabled:opacity-50 disabled:active:scale-100"
            >
              {{ confirmService.config()?.thirdText }}
            </button>
          }
          <div class="flex gap-3">
            <button
              (click)="cancelAction()"
              class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-slate-100 text-slate-700 text-center"
            >
              {{ confirmService.config()?.cancelText }}
            </button>
            <button
              (click)="confirm()"
            [disabled]="isProcessing()"
            class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-red-600 text-white shadow-md shadow-red-600/30 disabled:opacity-50 disabled:active:scale-100"
          >
            @if (isProcessing()) {
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
            {{ confirmService.config()?.confirmText }}
          </button>
          </div>
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
  cdr = inject(ChangeDetectorRef);

  constructor() {
    effect(() => {
      const config = this.confirmService.config();
      // Only set currentAmount when config changes to a new config (opening the modal)
      if (config) {
        if (config.showInput) {
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.currentAmount = config.inputValue;
            this.cdr.markForCheck();
          });
        } else {
          this.currentAmount = undefined;
        }
      }
    });
  }

  close() {
    this.haptic.impactLight();
    this.currentAmount = undefined;
    this.confirmService.close();
  }

  async cancelAction() {
    const config = this.confirmService.config();
    if (config && config.onCancel) {
      this.isProcessing.set(true);
      await config.onCancel();
      this.isProcessing.set(false);
    }
    this.close();
  }

  async thirdAction() {
    const config = this.confirmService.config();
    if (config && config.onThird) {
      this.isProcessing.set(true);
      await config.onThird();
      this.isProcessing.set(false);
    }
    this.close();
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
