import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { HapticService } from '../../../core/services/haptic.service';

@Component({
  selector: 'app-day-picker',
  standalone: true,
  imports: [CommonModule, SwipeToCloseDirective],
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
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        @slideUp
        appSwipeToClose
        (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 bg-white z-[90] 
               max-h-[95vh] flex flex-col rounded-t-[32px] shadow-2xl overflow-hidden"
      >
        <div
          class="p-6 pt-4 pb-4 bg-white text-gray-900 sticky top-[-2px] z-10 shrink-0"
        >
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
              Select Day
            </h2>
            <button
              (click)="close()"
              class="p-2 hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors rounded-full"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div class="text-3xl font-extrabold tracking-tight">Day {{ selectedDay }}</div>
        </div>
        <div class="p-6 bg-white flex-1 overflow-y-auto">
          <!-- Calendar Grid 1-31 -->
          <div class="grid grid-cols-7 gap-1">
            @for (day of days; track day) {
              <button
                (click)="selectDay(day)"
                class="h-10 w-full flex items-center justify-center font-bold rounded-xl transition-all text-sm"
                [ngClass]="{
                  'bg-black text-white shadow-md': day === selectedDay,
                  'text-gray-700 bg-gray-50 hover:bg-gray-200': day !== selectedDay,
                }"
              >
                {{ day }}
              </button>
            }
          </div>
          <div class="mt-4 mb-2">
            <button
              (click)="confirm()"
              class="w-full bg-black text-white px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest min-h-[44px] rounded-xl hover:bg-gray-900 transition-all shadow-md active:scale-95"
            >
              Confirm Day
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DayPickerComponent {
  haptic = inject(HapticService);
  isOpen = input<boolean>(false);
  initialDay = input<number>(1);
  daySelected = output<number>();
  closed = output<void>();

  selectedDay: number = 1;
  days: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        this.selectedDay = this.initialDay() || 1;
      }
    });
  }

  selectDay(day: number) {
    this.selectedDay = day;
    this.haptic.impactLight();
  }

  confirm() {
    this.daySelected.emit(this.selectedDay);
    this.close();
  }

  close() {
    this.haptic.impactLight();
    this.closed.emit();
  }
}
