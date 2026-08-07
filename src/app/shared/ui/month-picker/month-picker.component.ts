import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

export interface MonthOption {
  label: string;
  value: string; // 'YYYY-MM'
}

import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { MonthPickerService } from '../../../core/services/month-picker.service';

import { Router } from '@angular/router';

@Component({
  selector: 'app-month-picker',
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
    @if (monthPicker.isOpen()) {
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
               max-h-[80vh] flex flex-col rounded-t-[32px] shadow-2xl bg-white overflow-hidden"
      >
        <div class="flex flex-col items-center pt-3 pb-4 px-6 bg-white shrink-0 z-10 border-b border-gray-50">
          <div class="w-12 h-1.5 bg-gray-200 rounded-full mb-4"></div>
          <div class="w-full flex justify-center items-center">
            <h2 class="text-[22px] font-extrabold text-slate-900 tracking-tight text-center">Select Month</h2>
          </div>
        </div>
        <div class="p-6 bg-white overflow-y-auto overscroll-none flex-1 pb-10" style="scrollbar-width: none;">
          <div class="grid grid-cols-2 gap-2.5">
            @for (m of months; track m) {
              <button
                (click)="selectMonth(m.value)"
                class="w-full text-center p-4 border rounded-2xl font-bold tracking-wide text-sm transition-all active:scale-95 shadow-sm"
                [ngClass]="
                  m.value === monthPicker.activeMonth()
                    ? getThemeClasses().bg + ' border-transparent text-white shadow-md'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                "
              >
                {{ m.label }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class MonthPickerComponent {
  haptic = inject(HapticService);
  monthPicker = inject(MonthPickerService);
  router = inject(Router);

  getThemeClasses() {
    const route = this.router.url.split('/')[1] || 'dashboard';
    switch (route) {
      case 'expenses':
        return {
          bg: 'bg-expense-primary',
          border: 'border-expense-primary',
          text: 'text-expense-primary',
        };
      case 'budgets':
        return {
          bg: 'bg-budget-primary',
          border: 'border-budget-primary',
          text: 'text-budget-primary',
        };
      case 'friends':
        return {
          bg: 'bg-friends-primary',
          border: 'border-friends-primary',
          text: 'text-friends-primary',
        };
      case 'splits':
        return {
          bg: 'bg-splits-primary',
          border: 'border-splits-primary',
          text: 'text-splits-primary',
        };
      case 'subscriptions':
        return {
          bg: 'bg-subscriptions-primary',
          border: 'border-subscriptions-primary',
          text: 'text-subscriptions-primary',
        };
      case 'goals':
        return {
          bg: 'bg-goals-primary',
          border: 'border-goals-primary',
          text: 'text-goals-primary',
        };
      case 'ledger':
        return {
          bg: 'bg-ledger-primary',
          border: 'border-ledger-primary',
          text: 'text-ledger-primary',
        };
      case 'reports':
        return {
          bg: 'bg-reports-primary',
          border: 'border-reports-primary',
          text: 'text-reports-primary',
        };
      case 'profile':
        return { bg: 'bg-black', border: 'border-black', text: 'text-black' };
      case 'dashboard':
        return { bg: 'bg-black', border: 'border-black', text: 'text-black' };
      default:
        return { bg: 'bg-tracker-primary', border: 'border-tracker-primary', text: 'text-tracker-primary' };
    }
  }

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
    this.monthPicker.selectMonth(value);
  }

  close() {
    this.haptic.impactLight();
    this.monthPicker.close();
  }
}
