import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-confirm-sheet',
  standalone: true,
  imports: [CommonModule],
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
    <ng-container *ngIf="confirmService.isOpen()">
      <!-- Backdrop -->
      <div 
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
      ></div>

      <!-- Sheet Content -->
      <div 
        @slideUp
        class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-l-2 border-r-2 border-black z-[110] p-6 pb-8 flex flex-col gap-6"
      >
        <div class="flex flex-col gap-2">
          <h2 class="text-2xl font-extrabold tracking-tight text-black">{{ confirmService.config()?.title }}</h2>
          <p class="text-gray-500 font-bold leading-relaxed">{{ confirmService.config()?.message }}</p>
        </div>
        
        <div class="flex gap-2 mt-2">
          <button (click)="close()" class="flex-1 bg-white text-black border-2 border-black rounded-none p-4 font-bold text-lg hover:bg-gray-100 transition-colors">
            {{ confirmService.config()?.cancelText }}
          </button>
          <button (click)="confirm()" class="flex-1 bg-red-500 text-white border-2 border-transparent rounded-none p-4 font-bold text-lg hover:border-black transition-colors">
            {{ confirmService.config()?.confirmText }}
          </button>
        </div>
      </div>
    </ng-container>
  `
})
export class ConfirmSheetComponent {
  confirmService = inject(ConfirmService);

  close() {
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
