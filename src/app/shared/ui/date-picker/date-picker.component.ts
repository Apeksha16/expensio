import { Component, input, output, effect, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { HapticService } from '../../../core/services/haptic.service';

@Component({
  selector: 'app-date-picker',
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
  changeDetection: ChangeDetectionStrategy.Eager,
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
               max-h-[95vh] flex flex-col shadow-2xl"
      >
        <div
          class="p-6 pt-8 pb-6 border-b-2 text-white sticky top-[-2px] z-10"
          [ngClass]="[theme.bg, theme.border]"
        >
          <div class="text-3xl font-extrabold tracking-tight">
            {{ selectedDate | date: 'EEE, MMM d, yyyy' }}
          </div>
        </div>
        <div class="p-6 bg-white flex-1">
          <div class="flex justify-between items-center mb-4">
            <button
              (click)="prevMonth()"
              class="p-2 border-2 hover:text-white transition-colors rounded-none"
              [ngClass]="[theme.border, theme.text, theme.hoverBg]"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span class="font-extrabold text-lg">{{ viewDate | date: 'MMMM yyyy' }}</span>
            <button
              (click)="nextMonth()"
              class="p-2 border-2 hover:text-white transition-colors rounded-none"
              [ngClass]="[theme.border, theme.text, theme.hoverBg]"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
          <!-- Calendar Grid -->
          <div class="grid grid-cols-7 gap-1 text-center mb-2">
            @for (d of ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']; track d) {
              <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-2">
                {{ d }}
              </div>
            }
          </div>
          <div class="grid grid-cols-7 gap-1">
            @for (day of calendarDays; track day.date.getTime()) {
              <button
                (click)="selectDate(day.date)"
                class="h-10 w-full flex items-center justify-center font-bold border-2 rounded-none transition-colors text-sm"
                [ngClass]="[
                  day.isSelected ? theme.border + ' ' + theme.bg + ' text-white' : '',
                  !day.isSelected && day.isCurrentMonth
                    ? 'border-transparent text-gray-900 bg-gray-50 ' + theme.hoverBorder
                    : '',
                  !day.isSelected && !day.isCurrentMonth ? 'border-transparent text-gray-300' : '',
                  day.isToday && !day.isSelected ? 'border-dashed border-gray-400' : '',
                ]"
              >
                {{ day.date.getDate() }}
              </button>
            }
          </div>
          <div class="mt-4 mb-2 flex gap-3">
            <button
              (click)="close()"
              class="flex-1 bg-gray-100 text-gray-700 px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest min-h-[44px] border-2 border-transparent rounded-none hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              (click)="confirm()"
              class="flex-1 text-white px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest min-h-[44px] border-2 rounded-none transition-colors"
              [ngClass]="[theme.bg, theme.border, theme.hoverDarkBg]"
            >
              Confirm Date
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class DatePickerComponent {
  haptic = inject(HapticService);
  router = inject(Router);

  get theme() {
    const route = this.router.url.split('/')[1] || 'dashboard';
    switch (route) {
      case 'expenses':
        return {
          bg: 'bg-expense-primary',
          border: 'border-expense-primary',
          hoverBg: 'hover:bg-expense-primary',
          hoverBorder: 'hover:border-expense-primary',
          text: 'text-expense-primary',
          hoverDarkBg: 'hover:bg-expense-dark',
          darkBg: 'bg-expense-dark',
        };
      case 'budgets':
        return {
          bg: 'bg-budget-primary',
          border: 'border-budget-primary',
          hoverBg: 'hover:bg-budget-primary',
          hoverBorder: 'hover:border-budget-primary',
          text: 'text-budget-primary',
          hoverDarkBg: 'hover:bg-budget-dark',
          darkBg: 'bg-budget-dark',
        };
      case 'friends':
        return {
          bg: 'bg-friends-primary',
          border: 'border-friends-primary',
          hoverBg: 'hover:bg-friends-primary',
          hoverBorder: 'hover:border-friends-primary',
          text: 'text-friends-primary',
          hoverDarkBg: 'hover:bg-friends-dark',
          darkBg: 'bg-friends-dark',
        };
      case 'splits':
        return {
          bg: 'bg-splits-primary',
          border: 'border-splits-primary',
          hoverBg: 'hover:bg-splits-primary',
          hoverBorder: 'hover:border-splits-primary',
          text: 'text-splits-primary',
          hoverDarkBg: 'hover:bg-splits-dark',
          darkBg: 'bg-splits-dark',
        };
      case 'subscriptions':
        return {
          bg: 'bg-subscriptions-primary',
          border: 'border-subscriptions-primary',
          hoverBg: 'hover:bg-subscriptions-primary',
          hoverBorder: 'hover:border-subscriptions-primary',
          text: 'text-subscriptions-primary',
          hoverDarkBg: 'hover:bg-subscriptions-dark',
          darkBg: 'bg-subscriptions-dark',
        };
      case 'goals':
        return {
          bg: 'bg-goals-primary',
          border: 'border-goals-primary',
          hoverBg: 'hover:bg-goals-primary',
          hoverBorder: 'hover:border-goals-primary',
          text: 'text-goals-primary',
          hoverDarkBg: 'hover:bg-goals-dark',
          darkBg: 'bg-goals-dark',
        };
      case 'ledger':
        return {
          bg: 'bg-ledger-primary',
          border: 'border-ledger-primary',
          hoverBg: 'hover:bg-ledger-primary',
          hoverBorder: 'hover:border-ledger-primary',
          text: 'text-ledger-primary',
          hoverDarkBg: 'hover:bg-ledger-dark',
          darkBg: 'bg-ledger-dark',
        };
      default:
        return {
          bg: 'bg-black',
          border: 'border-black',
          hoverBg: 'hover:bg-black',
          hoverBorder: 'hover:border-black',
          text: 'text-black',
          hoverDarkBg: 'hover:bg-gray-900',
          darkBg: 'bg-gray-900',
        };
    }
  }
  isOpen = input<boolean>(false);
  initialDate = input<string | null>(null);
  dateSelected = output<string>();
  closed = output<void>();

  selectedDate: Date = new Date();
  viewDate: Date = new Date();
  calendarDays: CalendarDay[] = [];

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const initDate = this.initialDate();

      if (open) {
        if (initDate) {
          this.selectedDate = new Date(initDate);
          this.viewDate = new Date(initDate);
        } else {
          this.selectedDate = new Date();
          this.viewDate = new Date();
        }
        this.generateCalendar();
      }
    });
  }

  prevMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    this.generateCalendar();
  }

  confirm() {
    const tzoffset = this.selectedDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(this.selectedDate.getTime() - tzoffset)
      .toISOString()
      .slice(0, 10);
    this.dateSelected.emit(localISOTime);
    this.close();
  }

  close() {
    this.haptic.impactLight();
    this.closed.emit();
  }

  private generateCalendar() {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayOfWeek = firstDayOfMonth.getDay();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selDate = new Date(this.selectedDate);
    selDate.setHours(0, 0, 0, 0);

    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        isSelected: d.getTime() === selDate.getTime(),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime(),
        isSelected: d.getTime() === selDate.getTime(),
      });
    }

    // Next month padding to complete 42 cells (6 rows)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime(),
        isSelected: d.getTime() === selDate.getTime(),
      });
    }

    this.calendarDays = days;
  }
}
