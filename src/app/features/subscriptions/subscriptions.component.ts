import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService, Subscription } from '../../core/services/subscription.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="h-full bg-white p-4 flex flex-col gap-4">
      @if (subscriptionService.isLoading()) {
        <!-- Shimmer -->
        <div class="flex flex-col gap-3 pb-36 mt-2">
          @for (i of [1, 2, 3]; track i) {
            <div class="w-full bg-gray-100 border-2 border-gray-200 rounded-2xl p-4 flex items-center gap-4 h-[76px] animate-pulse">
              <div class="flex flex-col gap-2 flex-1">
                <div class="h-4 bg-gray-200 w-1/3"></div>
                <div class="h-3 bg-gray-200 w-1/4"></div>
              </div>
              <div class="h-6 bg-gray-200 w-16"></div>
            </div>
          }
        </div>
      } @else {
        <!-- Top Summary Box -->
        <div class="bg-black text-white p-5 rounded-2xl flex flex-col gap-1 relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(139,92,246,1)] mt-2">
          <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Total Monthly Subscriptions
          </span>
          <span class="text-4xl font-extrabold tracking-tight">
            ₹{{ subscriptionService.totalMonthlyAmount() | number: '1.0-0' }}
          </span>
        </div>

        <!-- Tabs -->
        <div class="shrink-0 flex gap-2 mt-2">
          <button
            (click)="activeTab.set('upcoming')"
            [class.bg-black]="activeTab() === 'upcoming'"
            [class.text-white]="activeTab() === 'upcoming'"
            [class.bg-white]="activeTab() !== 'upcoming'"
            [class.text-black]="activeTab() !== 'upcoming'"
            class="flex-1 py-3 font-black tracking-widest uppercase transition-all rounded-xl border-2 border-black"
            [class.shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]]="activeTab() !== 'upcoming'"
          >
            Upcoming
          </button>
          <button
            (click)="activeTab.set('paid')"
            [class.bg-black]="activeTab() === 'paid'"
            [class.text-white]="activeTab() === 'paid'"
            [class.bg-white]="activeTab() !== 'paid'"
            [class.text-black]="activeTab() !== 'paid'"
            class="flex-1 py-3 font-black tracking-widest uppercase transition-all rounded-xl border-2 border-black"
            [class.shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]]="activeTab() !== 'paid'"
          >
            Paid
          </button>
        </div>

        <!-- Upcoming Tab -->
        @if (activeTab() === 'upcoming') {
          <div class="flex-1 flex flex-col gap-6 pb-36 mt-2">
            <!-- This Month Section -->
            <div class="flex flex-col gap-3">
              <h3 class="font-black text-xs text-black uppercase tracking-widest px-1">
                This Month
              </h3>
              @if (subscriptionService.upcomingSubscriptions().length > 0) {
                @for (sub of subscriptionService.upcomingSubscriptions(); track sub.id) {
                  <button
                    (click)="subscriptionService.openBottomSheet(sub)"
                    class="w-full bg-subscriptions-surface border-2 border-black rounded-2xl p-4 flex flex-col gap-3 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-[0.99]"
                  >
                    <div class="flex justify-between items-start gap-4">
                      <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                        <span class="font-black text-lg text-black truncate">{{ sub.title }}</span>
                        <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">{{ sub.category }}</span>
                      </div>
                      <span class="font-black text-lg text-black flex-shrink-0">
                        ₹{{ sub.amount | number: '1.0-2' }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center mt-2 pt-3 border-t-2 border-black border-dashed w-full gap-2">
                      <span class="text-[10px] font-extrabold uppercase tracking-wider min-w-0">
                        <span [ngClass]="getDueMessageClass(sub.billing_day)" class="px-2.5 py-1 rounded-lg border">
                          {{ getDueMessage(sub.billing_day) }}
                        </span>
                      </span>
                      <button
                        (click)="markAsPaid($event, sub)"
                        class="bg-black text-white border-2 border-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(59,130,246,1)] hover:shadow-[3px_3px_0px_0px_rgba(59,130,246,1)] active:scale-[0.95] transition-all flex items-center gap-2"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </button>
                }
              } @else {
                <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center">
                  <p class="text-black font-extrabold text-sm uppercase tracking-widest">
                    No pending for this month
                  </p>
                </div>
              }
            </div>

            <!-- Next Month Section -->
            <div class="flex flex-col gap-3">
              <h3 class="font-black text-xs text-black uppercase tracking-widest px-1">
                Next Month
              </h3>
              @if (subscriptionService.nextMonthSubscriptions().length > 0) {
                @for (sub of subscriptionService.nextMonthSubscriptions(); track sub.id) {
                  <button
                    (click)="subscriptionService.openBottomSheet(sub)"
                    class="w-full bg-white border-2 border-black rounded-2xl p-4 flex flex-col gap-3 text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-[0.99] opacity-80"
                  >
                    <div class="flex justify-between items-start gap-4">
                      <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                        <span class="font-black text-lg text-black truncate">{{ sub.title }}</span>
                        <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">{{ sub.category }}</span>
                      </div>
                      <span class="font-black text-lg text-black flex-shrink-0">
                        ₹{{ sub.amount | number: '1.0-2' }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center mt-2 pt-3 border-t-2 border-black border-dashed w-full gap-2">
                      <span class="text-[10px] font-extrabold uppercase tracking-wider min-w-0">
                        <span class="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg">
                          {{ getNextMonthDueMessage(sub.billing_day) }}
                        </span>
                      </span>
                    </div>
                  </button>
                }
              } @else {
                <div class="bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center">
                  <p class="text-black font-extrabold text-sm uppercase tracking-widest">
                    No subscriptions added yet
                  </p>
                </div>
              }
            </div>
          </div>
        }

        <!-- Paid Tab -->
        @if (activeTab() === 'paid') {
          <div class="flex-1 flex flex-col gap-3 pb-36 mt-2">
            @if (subscriptionService.paidSubscriptions().length > 0) {
              @for (sub of subscriptionService.paidSubscriptions(); track sub.id) {
                <button
                  (click)="subscriptionService.openBottomSheet(sub)"
                  class="w-full bg-subscriptions-light border-2 border-black rounded-2xl p-4 flex flex-col gap-3 text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:scale-[0.99]"
                >
                  <div class="flex justify-between items-start gap-4">
                    <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                      <span class="font-black text-lg text-black truncate">{{ sub.title }}</span>
                      <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">{{ sub.category }}</span>
                    </div>
                    <span class="font-black text-lg text-black flex-shrink-0 opacity-50 line-through">
                      ₹{{ sub.amount | number: '1.0-2' }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center mt-2 pt-3 border-t-2 border-black border-dashed w-full gap-2">
                    <span class="text-[10px] font-black text-emerald-600 uppercase tracking-widest min-w-0 flex items-center gap-1">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                      Paid for this month
                    </span>
                  </div>
                </button>
              }
            } @else {
              <div class="flex-1 flex flex-col items-center justify-center p-8 text-center h-[300px]">
                <div class="w-24 h-24 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-6">
                  <svg class="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="text-black font-extrabold text-xl">Nothing paid yet</p>
                <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
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
