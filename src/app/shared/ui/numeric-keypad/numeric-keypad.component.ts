import { Component, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { HapticService } from '../../../core/services/haptic.service';

@Component({
  selector: 'app-numeric-keypad',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm mx-auto mt-auto pt-6 pb-2">
      <div class="grid grid-cols-3 gap-x-6 gap-y-4">
        @for (key of keys; track key) {
          @if (key === 'empty') {
            <div class="h-16 w-full"></div>
          } @else if (key === 'backspace') {
            <button 
              type="button"
              (click)="onKeyPress('backspace')"
              class="w-[72px] h-[72px] mx-auto flex items-center justify-center rounded-full active:bg-gray-200 active:scale-90 transition-all duration-150"
            >
              <svg class="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.375-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.211-.211.498-.33.796-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.796-.33z" />
              </svg>
            </button>
          } @else {
            <button 
              type="button"
              (click)="onKeyPress(key)"
              class="w-[72px] h-[72px] mx-auto flex items-center justify-center rounded-full text-[32px] font-medium text-black bg-gray-50 active:bg-gray-200 active:scale-90 transition-all duration-150"
            >
              {{ key }}
            </button>
          }
        }
      </div>
    </div>
  `
})
export class NumericKeypadComponent {
  keyPress = output<string>();
  private haptic = inject(HapticService);

  keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'empty', '0', 'backspace'];

  onKeyPress(key: string) {
    this.haptic.impactLight();
    this.keyPress.emit(key);
  }
}
