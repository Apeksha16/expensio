import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService, Subscription } from '../../core/services/subscription.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { BudgetService } from '../../core/services/budget.service';
import { IconService } from '../../core/services/icon.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="h-full bg-white p-4 flex flex-col gap-4">
      @if (subscriptionService.isLoading()) {
        <!-- Shimmer -->
        <div class="flex flex-col gap-3 pb-28 mt-2">
          @for (i of [1, 2, 3]; track i) {
            <div class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 h-[76px] animate-pulse">
              <div class="flex flex-col gap-2 flex-1">
                <div class="h-4 bg-slate-200 w-1/3"></div>
                <div class="h-3 bg-slate-200 w-1/4"></div>
              </div>
              <div class="h-6 bg-slate-200 w-16"></div>
            </div>
          }
        </div>
      } @else {
        <!-- Top Summary Box -->
        <div class="bg-white text-gray-900 border border-slate-100 p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden shadow-sm mt-2">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Total Monthly Subscriptions
          </span>
          <span class="text-4xl font-extrabold tracking-tight text-gray-900">
            ₹{{ subscriptionService.totalMonthlyAmount() | number: '1.0-0' }}
          </span>
        </div>

        <!-- Tabs -->
        <div class="shrink-0 flex gap-2 mt-2">
          <button
            (click)="activeTab.set('upcoming')"
            [class.bg-subscriptions-primary]="activeTab() === 'upcoming'"
            [class.text-white]="activeTab() === 'upcoming'"
            [class.shadow-md]="activeTab() === 'upcoming'"
            [class.shadow-subscriptions-primary/30]="activeTab() === 'upcoming'"
            [class.bg-slate-50]="activeTab() !== 'upcoming'"
            [class.text-gray-500]="activeTab() !== 'upcoming'"
            class="active:scale-[0.98] transition-all duration-200 flex-1 py-3 font-bold tracking-widest uppercase transition-all rounded-xl text-xs"
          >
            Upcoming
          </button>
          <button
            (click)="activeTab.set('paid')"
            [class.bg-subscriptions-primary]="activeTab() === 'paid'"
            [class.text-white]="activeTab() === 'paid'"
            [class.shadow-md]="activeTab() === 'paid'"
            [class.shadow-subscriptions-primary/30]="activeTab() === 'paid'"
            [class.bg-slate-50]="activeTab() !== 'paid'"
            [class.text-gray-500]="activeTab() !== 'paid'"
            class="active:scale-[0.98] transition-all duration-200 flex-1 py-3 font-bold tracking-widest uppercase transition-all rounded-xl text-xs"
          >
            Paid
          </button>
        </div>

        <!-- Upcoming Tab -->
        @if (activeTab() === 'upcoming') {
          <div class="flex-1 flex flex-col gap-6 pb-28 mt-2">
            <!-- This Month Section -->
            <div class="flex flex-col gap-3">
              <h3 class="font-bold text-xs text-gray-700 uppercase tracking-widest px-1">
                This Month
              </h3>
              @if (subscriptionService.upcomingSubscriptions().length > 0) {
                @for (sub of subscriptionService.upcomingSubscriptions(); track sub.id) {
                  <button
                    (click)="subscriptionService.openBottomSheet(sub)"
                    class="w-full bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-4 text-left shadow-sm transition-transform active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-subscriptions-primary"
                  >
                    <!-- Icon -->
                    <div class="flex items-center justify-center w-12 h-12 rounded-xl shrink-0" [ngClass]="budgetService.getCategoryTheme(sub.category).bg + ' ' + budgetService.getCategoryTheme(sub.category).text">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path [attr.d]="sub.icon ? iconService.getIconById(sub.icon).svg : budgetService.getCategoryIconPath(sub.category)"></path>
                      </svg>
                    </div>
                    
                    <!-- Details & Due Pill -->
                    <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span class="font-extrabold text-base text-slate-900 truncate">{{ sub.title }}</span>
                      </div>
                      <div class="flex items-center">
                        <span class="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md min-w-0 truncate" [ngClass]="getDueMessageClass(sub.billing_day).replace('border', '')">
                          {{ getDueMessage(sub.billing_day) }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Amount & Action -->
                    <div class="flex flex-col items-end gap-1.5 shrink-0">
                      <span class="font-extrabold text-base text-slate-900">
                        ₹{{ sub.amount | number: '1.0-0' }}
                      </span>
                      <div
                        (click)="markAsPaid($event, sub)"
                        class="bg-subscriptions-primary/10 text-subscriptions-primary px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest active:scale-[0.95] transition-transform flex items-center gap-1"
                      >
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Paid
                      </div>
                    </div>
                  </button>
                }
              } @else {
                <div class="bg-transparent border border-solid border-slate-100 shadow-sm rounded-2xl p-6 text-center">
                  <p class="text-gray-500 font-bold text-sm uppercase tracking-widest">
                    No pending for this month
                  </p>
                </div>
              }
            </div>

            <!-- Next Month Section -->
            <div class="flex flex-col gap-3">
              <h3 class="font-bold text-xs text-gray-700 uppercase tracking-widest px-1">
                Next Month
              </h3>
              @if (subscriptionService.nextMonthSubscriptions().length > 0) {
                @for (sub of subscriptionService.nextMonthSubscriptions(); track sub.id) {
                  <button
                    (click)="subscriptionService.openBottomSheet(sub)"
                    class="w-full bg-white border border-slate-100 rounded-2xl p-3 flex items-center gap-4 text-left shadow-sm transition-transform active:scale-[0.99] opacity-80"
                  >
                    <!-- Icon -->
                    <div class="flex items-center justify-center w-12 h-12 rounded-xl shrink-0" [ngClass]="budgetService.getCategoryTheme(sub.category).bg + ' ' + budgetService.getCategoryTheme(sub.category).text">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path [attr.d]="sub.icon ? iconService.getIconById(sub.icon).svg : budgetService.getCategoryIconPath(sub.category)"></path>
                      </svg>
                    </div>
                    
                    <!-- Details & Due Pill -->
                    <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                      <span class="font-extrabold text-base text-slate-900 truncate">{{ sub.title }}</span>
                      <div class="flex items-center">
                        <span class="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase min-w-0 truncate">
                          {{ getNextMonthDueMessage(sub.billing_day) }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Amount -->
                    <div class="flex flex-col items-end shrink-0">
                      <span class="font-extrabold text-base text-slate-900">
                        ₹{{ sub.amount | number: '1.0-0' }}
                      </span>
                    </div>
                  </button>
                }
              } @else {
                <div class="bg-transparent border border-solid border-slate-100 shadow-sm rounded-2xl p-6 text-center">
                  <p class="text-gray-500 font-bold text-sm uppercase tracking-widest">
                    No subscriptions added yet
                  </p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Paid Tab -->
        @if (activeTab() === 'paid') {
          <div class="flex-1 flex flex-col gap-3 pb-28 mt-2">
            @if (subscriptionService.paidSubscriptions().length > 0) {
              @for (sub of subscriptionService.paidSubscriptions(); track sub.id) {
                <button
                  (click)="subscriptionService.openBottomSheet(sub)"
                  class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-4 text-left transition-transform active:scale-[0.99] opacity-70"
                >
                  <!-- Icon -->
                  <div class="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 bg-slate-200 text-slate-500">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path [attr.d]="sub.icon ? iconService.getIconById(sub.icon).svg : budgetService.getCategoryIconPath(sub.category)"></path>
                    </svg>
                  </div>
                  
                  <!-- Details & Paid Pill -->
                  <div class="flex flex-col gap-1.5 flex-1 min-w-0">
                    <span class="font-extrabold text-base text-slate-900 truncate line-through">{{ sub.title }}</span>
                    <div class="flex items-center">
                      <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest min-w-0 flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                        Paid
                      </span>
                    </div>
                  </div>

                  <!-- Amount -->
                  <div class="flex flex-col items-end shrink-0">
                    <span class="font-extrabold text-base text-slate-900 line-through">
                      ₹{{ sub.amount | number: '1.0-0' }}
                    </span>
                  </div>
                </button>
              }
            } @else {
              <div class="mt-4 w-full bg-[#FCFCFD] border border-solid border-slate-100 shadow-sm rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
                <div class="w-12 h-12 bg-subscriptions-primary/10 rounded-[14px] flex items-center justify-center mb-3">
                  <svg class="w-6 h-6 text-subscriptions-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 class="text-sm font-bold text-slate-800 mb-1">Nothing paid yet</h4>
                <p class="text-xs text-slate-500 max-w-[250px]">
                  When you mark a subscription as paid, it will appear here.
                </p>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class SubscriptionsComponent {
  subscriptionService = inject(SubscriptionService);
  confirmService = inject(ConfirmService);
  budgetService = inject(BudgetService);
  iconService = inject(IconService);
  activeTab = signal<'upcoming' | 'paid'>('upcoming');

  markAsPaid(event: Event, sub: Subscription) {
    event.stopPropagation();
    this.confirmService.open({
      title: 'Mark as Paid',
      message: `Are you sure you want to mark ${sub.title} as paid? This will log an expense for ₹${sub.amount}.`,
      confirmText: 'Mark Paid',
      cancelText: 'Cancel',
      onConfirm: async () => {
        await this.subscriptionService.markAsPaid(sub);
      },
    });
  }

  getDueMessage(billingDay: number): string {
    const today = new Date().getDate();
    if (billingDay > today) {
      return `Due in ${billingDay - today} day(s)`;
    } else if (billingDay === today) {
      return 'Due Today';
    } else {
      return `Overdue by ${today - billingDay} day(s)`;
    }
  }

  getDueMessageClass(billingDay: number): string {
    const today = new Date().getDate();
    if (billingDay > today) {
      return 'bg-purple-50 text-purple-700 border-purple-200 font-extrabold';
    } else if (billingDay === today) {
      return 'bg-amber-50 text-amber-700 border-amber-300 font-extrabold animate-pulse';
    } else {
      return 'bg-rose-50 text-rose-700 border-rose-200 font-black';
    }
  }

  getNextMonthDueMessage(billingDay: number): string {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, billingDay);
    const monthName = nextMonth.toLocaleString('default', { month: 'short' });
    return `Due on ${billingDay} ${monthName}`;
  }
}
