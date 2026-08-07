import { Component, inject, ChangeDetectionStrategy, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast, ToastType } from '../../../core/services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('toastAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 0, transform: 'translateY(-20px)' })),
      ]),
    ]),
  ],
  styles: [`
    @keyframes shrink-x {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
  `],
  template: `
    <div class="fixed top-4 left-0 right-0 z-[9999] pointer-events-none flex flex-col items-center gap-3 px-4">
      @for (toast of topToasts(); track toast.id) {
        <ng-container *ngTemplateOutlet="toastTemplate; context: { $implicit: toast }"></ng-container>
      }
    </div>

    <div class="fixed bottom-safe left-0 right-0 z-[9999] pointer-events-none flex flex-col items-center gap-3 px-4 mb-4">
      @for (toast of bottomToasts(); track toast.id) {
        <ng-container *ngTemplateOutlet="toastTemplate; context: { $implicit: toast }"></ng-container>
      }
    </div>

    <ng-template #toastTemplate let-toast>
      <div
        @toastAnimation
        class="pointer-events-auto w-full max-w-[400px] bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 overflow-hidden relative"
      >
        <!-- Icon based on type -->
        <div class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full" [ngClass]="getIconBgClass(toast.type)">
          <!-- Success / Banner -->
          @if (toast.type === 'success' || toast.type === 'banner') {
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          } 
          <!-- Error -->
          @else if (toast.type === 'error') {
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
          <!-- Warning -->
          @else if (toast.type === 'warning') {
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
          }
          <!-- Info -->
          @else if (toast.type === 'info') {
            <span class="text-white font-bold text-lg font-serif">i</span>
          }
          <!-- Offline -->
          @else if (toast.type === 'offline') {
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 5.636a9 9 0 00-12.728 0m12.728 0l-12.728 12.728m12.728-12.728L5.636 18.364M15.536 8.464a5 5 0 00-7.072 0m7.072 0l-7.072 7.072" />
            </svg>
          }
          <!-- Sync Success -->
          @else if (toast.type === 'sync_success') {
            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 13l3 3 3-3m-3 3V10" />
            </svg>
          }
          <!-- Loading -->
          @else if (toast.type === 'loading') {
            <svg class="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        </div>

        <!-- Content -->
        <div class="flex-1 flex flex-col justify-center min-w-0">
          <div class="text-[15px] font-bold text-gray-900 line-clamp-3 text-ellipsis">
            {{ toast.title }}
          </div>
          @if (toast.subtitle) {
            <div class="text-[13px] font-medium text-gray-500 line-clamp-3 text-ellipsis mt-0.5">
              {{ toast.subtitle }}
            </div>
          }
        </div>

        <!-- Right Action -->
        @if (toast.action) {
          <div class="flex-shrink-0 pl-2">
            <button
              (click)="handleAction(toast)"
              class="text-sm font-bold active:opacity-70 transition-opacity"
              [ngClass]="getActionColorClass(toast.type)"
            >
              {{ toast.action.label }}
            </button>
          </div>
        }

      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ToastComponent {
  toastService = inject(ToastService);

  topToasts = computed(() => this.toastService.toasts().filter(t => t.type !== 'banner'));

  bottomToasts = computed(() => this.toastService.toasts().filter(t => t.type === 'banner'));

  getIconBgClass(type: ToastType): string {
    switch (type) {
      case 'success':
      case 'banner':
      case 'sync_success':
        return 'bg-toast-success';
      case 'error':
        return 'bg-toast-error';
      case 'warning':
        return 'bg-toast-warning';
      case 'info':
        return 'bg-toast-info';
      case 'offline':
        return 'bg-toast-offline';
      case 'loading':
        return 'bg-toast-loading';
      default:
        return 'bg-gray-500';
    }
  }

  getActionColorClass(type: ToastType): string {
    if (type === 'banner' || type === 'success') return 'text-toast-success';
    return 'text-[#4f46e5]'; // Indigo 600 default
  }

  handleAction(toast: Toast) {
    if (toast.action) {
      toast.action.action();
    }
    this.toastService.remove(toast.id);
  }
}
