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
        class="fixed bottom-0 left-0 right-0 z-[90] 
               max-h-[95vh] flex flex-col rounded-t-[32px] shadow-2xl bg-white overflow-hidden"
      >
        <!-- Header -->
        <div class="flex flex-col items-center pt-3 pb-4 px-6 bg-white shrink-0 z-10 rounded-t-[32px]">
          <div class="w-12 h-1.5 bg-gray-200 rounded-full mb-6"></div>
          <h2 class="text-[22px] font-extrabold text-slate-900 tracking-tight text-center">
            {{ selectedDate | date: 'EEE, MMM d, yyyy' }}
          </h2>
        </div>
        <div class="p-6 bg-white flex-1">
          <div class="flex justify-between items-center mb-6">
            <button
              (click)="prevMonth()"
              class="p-2.5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all text-slate-500 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span class="font-bold text-sm text-slate-900 tracking-wide">{{ viewDate | date: 'MMMM yyyy' }}</span>
            <button
              (click)="nextMonth()"
              class="p-2.5 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all text-slate-500 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
          <!-- Calendar Grid -->
          <div class="grid grid-cols-7 gap-1 text-center mb-2">
            @for (d of ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']; track d) {
              <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">
                {{ d }}
              </div>
            }
          </div>
          <div class="grid grid-cols-7 gap-1">
            @for (day of calendarDays; track day.date.getTime()) {
              <button
                (click)="selectDate(day.date)"
                class="h-11 w-11 mx-auto flex items-center justify-center font-bold rounded-full transition-all text-[15px]"
                [ngClass]="[
                  day.isSelected ? theme.bg + ' text-white shadow-md' : '',
                  !day.isSelected && day.isCurrentMonth
                    ? 'text-slate-900 hover:bg-slate-100'
                    : '',
                  !day.isSelected && !day.isCurrentMonth ? 'text-slate-300' : '',
                  day.isToday && !day.isSelected ? 'border border-slate-300' : '',
                ]"
              >
                {{ day.date.getDate() }}
              </button>
            }
          </div>
          <div class="mt-8 mb-4 flex gap-3">
            <button
              (click)="close()"
              class="flex-1 bg-slate-50 text-slate-700 px-4 py-4 text-sm font-bold rounded-2xl transition-all active:scale-95 text-center hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              (click)="confirm()"
              class="flex-1 text-white px-4 py-4 text-sm font-bold rounded-2xl transition-all active:scale-95"
              [ngClass]="[theme.bg]"
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
          bg: 'bg-tracker-primary',
          border: 'border-tracker-primary',
          hoverBg: 'hover:bg-tracker-primary',
          hoverBorder: 'hover:border-tracker-primary',
          text: 'text-tracker-primary',
          hoverDarkBg: 'hover:bg-tracker-dark',
          darkBg: 'bg-tracker-dark',
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
