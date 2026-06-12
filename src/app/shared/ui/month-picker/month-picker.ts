import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

export interface MonthOption {
  label: string;
  value: string; // 'YYYY-MM'
}

@Component({
  selector: 'app-month-picker',
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
    <ng-container *ngIf="isOpen">
      <!-- Backdrop -->
      <div 
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
      ></div>

      <!-- Sheet Content -->
      <div 
        @slideUp
        class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-l-2 border-r-2 border-black z-[90] 
               rounded-t-none max-h-[80vh] overflow-y-auto overscroll-contain flex flex-col"
      >
        <!-- Header -->
        <div class="flex justify-between items-center py-3 px-6 bg-black text-white border-b-2 border-black sticky top-0 z-10">
          <h2 class="text-xl font-extrabold tracking-tight">Select Month</h2>
          <button (click)="close()" class="w-8 h-8 flex items-center justify-center border-2 border-transparent hover:border-white transition-colors rounded-none text-white hover:bg-white hover:text-black">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-2 gap-2">
            <button *ngFor="let m of months" 
                    (click)="selectMonth(m.value)"
                    class="w-full text-center p-4 border-2 rounded-none font-bold transition-colors"
                    [ngClass]="m.value === activeMonth ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black'">
              {{ m.label }}
            </button>
          </div>
        </div>
      </div>
    </ng-container>
  `
})
export class MonthPickerComponent {
  @Input() isOpen = false;
  @Input() activeMonth = '';
  @Output() monthSelected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  months: MonthOption[] = [];

  constructor() {
    this.generateMonths();
  }

  private generateMonths() {
    const monthsArray: MonthOption[] = [];
    const date = new Date();
    
    // Generate last 12 months including current
    for (let i = 0; i < 12; i++) {
      const m = new Date(date.getFullYear(), date.getMonth() - i, 1);
      const val = `${m.getFullYear()}-${(m.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthsArray.push({ label, value: val });
    }
    
    this.months = monthsArray;
  }

  selectMonth(value: string) {
    this.monthSelected.emit(value);
  }

  close() {
    this.closed.emit();
  }
}
