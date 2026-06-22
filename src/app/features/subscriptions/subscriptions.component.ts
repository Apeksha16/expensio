import { Component, inject, signal } from '@angular/core';
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
  template: `
    <div class="h-full bg-gray-50 p-4 flex flex-col gap-4">
      @if (subscriptionService.isLoading()) {
        <!-- Shimmer -->
        <div class="flex flex-col gap-1.5 pb-36 mt-2">
          @for (i of [1, 2, 3]; track i) {
            <div class="w-full bg-gray-200 rounded-none p-4 flex items-center gap-4 h-[76px] animate-pulse">
              <div class="flex flex-col gap-2 flex-1">
                <div class="h-4 bg-gray-300 w-1/3"></div>
                <div class="h-3 bg-gray-300 w-1/4"></div>
              </div>
              <div class="h-6 bg-gray-300 w-16"></div>
            </div>
          }
        </div>
      } @else {
        <!-- Tabs -->
        <div class="shrink-0 flex border-b-2 border-black mt-2">
          <button
            (click)="activeTab.set('upcoming')"
            [class.bg-black]="activeTab() === 'upcoming'"
            [class.text-white]="activeTab() === 'upcoming'"
            class="flex-1 py-3 font-extrabold tracking-widest uppercase transition-colors"
          >
            Upcoming
          </button>
          <button
            (click)="activeTab.set('paid')"
            [class.bg-black]="activeTab() === 'paid'"
            [class.text-white]="activeTab() === 'paid'"
            class="flex-1 py-3 font-extrabold tracking-widest uppercase transition-colors"
          >
            Paid
          </button>
        </div>
        
        <!-- Upcoming Tab -->
        @if (activeTab() === 'upcoming') {
          <div class="flex-1 flex flex-col gap-1.5 pb-36 mt-2">
            @if (subscriptionService.upcomingSubscriptions().length > 0) {
              @for (sub of subscriptionService.upcomingSubscriptions(); track sub.id) {
                <button
                  (click)="subscriptionService.openBottomSheet(sub)"
                  class="w-full bg-white border-2 border-black rounded-none p-4 flex flex-col gap-2 text-left hover:bg-gray-50 transition-colors active:bg-gray-100"
                >
                  <div class="flex justify-between items-start gap-4">
                    <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                      <span class="font-extrabold text-lg text-black truncate">{{ sub.title }}</span>
                      <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{ sub.category }}</span>
                    </div>
                    <span class="font-extrabold text-lg text-black flex-shrink-0">₹{{ sub.amount | number: '1.0-2' }}</span>
                  </div>
                  <div class="flex justify-between items-center mt-1 w-full gap-2">
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-0">
                      <span [ngClass]="getDueMessageClass(sub.billing_day)">
                        {{ getDueMessage(sub.billing_day) }}
                      </span>
                    </span>
                    <button
                      (click)="markAsPaid($event, sub)"
                      class="bg-black text-white px-3 py-1.5 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                      Mark Paid
                    </button>
                  </div>
                </button>
              }
            } @else {
              <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6">
                  <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
                <p class="text-gray-500 font-extrabold text-xl">No upcoming subscriptions</p>
                <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                  Tap the + button to add a new monthly subscription.
                </p>
              </div>
            }
          </div>
        }

        <!-- Paid Tab -->
        @if (activeTab() === 'paid') {
          <div class="flex-1 flex flex-col gap-1.5 pb-36 mt-2">
            @if (subscriptionService.paidSubscriptions().length > 0) {
              @for (sub of subscriptionService.paidSubscriptions(); track sub.id) {
                <button
                  (click)="subscriptionService.openBottomSheet(sub)"
                  class="w-full bg-gray-200 rounded-none p-4 flex flex-col gap-1 text-left hover:bg-gray-300 transition-colors active:bg-gray-400"
                >
                  <div class="flex justify-between items-start gap-4">
                    <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                      <span class="font-extrabold text-lg text-black truncate">{{ sub.title }}</span>
                      <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{{ sub.category }}</span>
                    </div>
                    <span class="font-extrabold text-lg text-black flex-shrink-0 opacity-50 line-through">₹{{ sub.amount | number: '1.0-2' }}</span>
                  </div>
                  <div class="flex justify-between items-center mt-1 w-full gap-2">
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-0">
                      <span class="text-green-600">Paid for this month</span>
                    </span>
                  </div>
                </button>
              }
            } @else {
              <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6">
                  <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p class="text-gray-500 font-extrabold text-xl">Nothing paid yet</p>
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
      }
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
      return 'text-orange-600';
    } else if (billingDay === today) {
      return 'text-red-500';
    } else {
      return 'text-red-600 font-extrabold';
    }
  }
}
