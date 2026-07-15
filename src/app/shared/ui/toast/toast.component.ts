import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateY(-20px)' }),
        ),
      ]),
    ]),
  ],
  template: `
    <div
      class="fixed top-4 left-0 right-0 z-[9999] pointer-events-none flex flex-col items-center gap-2 px-4"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          @toastAnimation
          class="pointer-events-auto w-full max-w-sm border-2 border-black rounded-none p-4 flex items-start gap-3 transition-colors"
          [ngClass]="{
            'bg-white text-black': toast.type === 'info',
            'bg-[#4ade80] text-black': toast.type === 'success',
            'bg-[#f87171] text-black': toast.type === 'error',
          }"
        >
          <!-- Icon based on type -->
          <div class="mt-0.5 flex-shrink-0">
            @if (toast.type === 'success') {
              <svg
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            } @else if (toast.type === 'error') {
              <svg
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            } @else {
              <svg
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
          </div>

          <div class="flex-1 text-sm font-bold leading-snug">
            {{ toast.message }}
          </div>

          <!-- Close button -->
          <button
            (click)="toastService.remove(toast.id)"
            class="flex-shrink-0 text-black/60 hover:text-black transition-colors focus:outline-none"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: ``,
})
export class ToastComponent {
  toastService = inject(ToastService);
}
