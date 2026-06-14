import { Component, inject } from '@angular/core';

import { animate, style, transition, trigger } from '@angular/animations';
import { ConfirmService } from '../../../core/services/confirm.service';

import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { HapticService } from '../../../core/services/haptic.service';

@Component({
  selector: 'app-confirm-sheet',
  standalone: true,
  imports: [SwipeToCloseDirective],
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
            class="flex-1 bg-red-600 text-white p-3.5 font-bold text-sm tracking-wide transition-all border-2 border-transparent active:scale-[0.98] rounded-none flex items-center justify-center gap-2"
          >
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

  close() {
    this.haptic.impactLight();
    this.confirmService.close();
  }

  confirm() {
    const config = this.confirmService.config();
    if (config && config.onConfirm) {
      config.onConfirm();
    }
    this.close();
  }
}
