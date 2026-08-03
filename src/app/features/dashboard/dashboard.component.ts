import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  signal,
  inject,
  OnInit,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ExpenseService, Expense } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { GoalService } from '../../core/services/goal.service';
import { ToastService } from '../../core/services/toast.service';
import { SplitService } from '../../core/services/split.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { FriendService } from '../../core/services/friend.service';
import { BudgetService } from '../../core/services/budget.service';
import { KeyboardService } from '../../core/services/keyboard.service';
import { AccountTrackerService } from '../../core/services/account-tracker.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  host: {
    class: 'flex flex-col h-full',
  },
  template: `
    <div
      class="h-full bg-[#FAFAFA] flex flex-col overflow-y-auto pb-28 select-none font-sans"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd($event)"
    >
      <!-- Pull to Refresh Indicator -->
      <div
        class="w-full flex justify-center items-center overflow-hidden transition-all duration-200 ease-out"
        [style.height.px]="refreshing() ? 60 : pullDistance()"
      >
        @if (refreshing()) {
          <svg
            class="animate-spin h-6 w-6 text-slate-800"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        } @else if (pullDistance() > 0) {
          <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex flex-col items-center gap-1">
            <svg
              class="w-5 h-5 transition-transform"
              [class.rotate-180]="pullDistance() > 60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
            {{ pullDistance() > 60 ? 'Release to refresh' : 'Pull to refresh' }}
          </div>
        }
      </div>

      <div class="p-5 flex flex-col gap-6">
        @if (isInitialLoading()) {
          <!-- Total Expenses Shimmer -->
          <div class="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden">
            <div class="flex flex-col items-center justify-center relative mt-2">
              <div class="w-full max-w-[220px] aspect-[100/55] bg-slate-50 rounded-t-full animate-pulse"></div>
              <div class="absolute bottom-0 flex flex-col items-center translate-y-1">
                <div class="h-2.5 bg-slate-100 w-16 mb-2 animate-pulse rounded-full"></div>
                <div class="h-8 bg-slate-100 w-32 animate-pulse rounded-lg"></div>
              </div>
            </div>
            <div class="flex justify-between items-end mt-6 pt-4 border-t border-slate-100">
              <div class="flex flex-col gap-1.5">
                <div class="h-2.5 bg-slate-100 w-10 animate-pulse rounded-full"></div>
                <div class="h-4 bg-slate-100 w-16 animate-pulse rounded-full"></div>
              </div>
              <div class="flex flex-col items-end gap-1.5">
                <div class="h-2.5 bg-slate-100 w-10 animate-pulse rounded-full"></div>
                <div class="h-4 bg-slate-100 w-16 animate-pulse rounded-full"></div>
              </div>
            </div>
          </div>
        } @else {
          <!-- Top Section: Header & Carousel -->
          <div class="relative w-full flex flex-col gap-3">
            <div class="flex items-center justify-end px-4 mb-2">
              <!-- Sleek Segmented Switcher -->
              <div class="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-full p-1">
                <button
                  (click)="scrollToCard(0)"
                  [class.bg-[#5421E6]]="activeGaugeIndex() === 0"
                  [class.text-white]="activeGaugeIndex() === 0"
                  [class.text-slate-700]="activeGaugeIndex() !== 0"
                  [class.bg-transparent]="activeGaugeIndex() !== 0"
                  class="px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer"
                >
                  Salary
                </button>
                <button
                  (click)="scrollToCard(1)"
                  [class.bg-[#5421E6]]="activeGaugeIndex() === 1"
                  [class.text-white]="activeGaugeIndex() === 1"
                  [class.text-slate-700]="activeGaugeIndex() !== 1"
                  [class.bg-transparent]="activeGaugeIndex() !== 1"
                  class="px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer"
                >
                  Cash
                </button>
                <button
                  (click)="scrollToCard(2)"
                  [class.bg-[#5421E6]]="activeGaugeIndex() === 2"
                  [class.text-white]="activeGaugeIndex() === 2"
                  [class.text-slate-700]="activeGaugeIndex() !== 2"
                  [class.bg-transparent]="activeGaugeIndex() !== 2"
                  class="px-3 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer"
                >
                  Savings
                </button>
              </div>
            </div>

            <!-- Horizontal Scroll Snap Carousel Track -->
            <div
              #carouselTrack
              (scroll)="onCarouselScroll($event)"
              class="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar py-2 scroll-smooth"
              style="padding-left: calc(50% - min(42.5vw, 170px)); padding-right: calc(50% - min(42.5vw, 170px));"
            >
              <!-- CARD 1: SALARY ACCOUNT GAUGE -->
              <div
                (click)="scrollToCard(0)"
                class="snap-center shrink-0 w-[85vw] max-w-[340px] bg-white text-slate-800 p-6 rounded-[24px] transition-all duration-300 transform relative cursor-pointer shadow-sm border border-gray-100"
                [class.scale-100]="activeGaugeIndex() === 0"
                [class.scale-95]="activeGaugeIndex() !== 0"
                [class.opacity-50]="activeGaugeIndex() !== 0"
              >
                <div class="flex items-center justify-between mb-4">
                  <span class="font-bold text-base text-slate-800">Salary Account</span>
                  <span class="text-[10px] font-bold uppercase px-3 py-1 bg-blue-50 text-blue-600 rounded-full">Primary</span>
                </div>

                <div class="flex flex-col items-center justify-center relative mt-3">
                  <svg viewBox="0 0 100 55" class="w-full max-w-[250px]">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#F1F5F9" stroke-width="10" stroke-linecap="round" />
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="#3B82F6"
                      stroke-width="10"
                      stroke-linecap="round"
                      stroke-dasharray="125.66"
                      [attr.stroke-dashoffset]="salaryGaugeOffset()"
                      class="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-end pb-2" (click)="toggleMask(); $event.stopPropagation()">
                    <span class="text-[10px] font-bold tracking-widest uppercase mb-1" [class.text-red-500]="isOverBudget()" [class.text-indigo-600]="!isOverBudget()">
                      {{ isOverBudget() ? 'OVER BUDGET' : 'REMAINING' }}
                    </span>
                    <div class="w-[65%] flex justify-center overflow-hidden">
                      <p class="font-bold tracking-tight leading-none text-center truncate" [class.text-red-500]="isOverBudget()" [class.text-slate-900]="!isOverBudget()"
                         [style.font-size]="getFontSizeForAmount(isMasked() ? '••••' : (isOverBudget() ? '+' + (overAmount() | currency:'INR':'symbol':'1.0-0') : (remainingAmount() | currency:'INR':'symbol':'1.0-0')))">
                        {{ isMasked() ? '••••' : (isOverBudget() ? '+' + (overAmount() | currency:'INR':'symbol':'1.0-0') : (remainingAmount() | currency:'INR':'symbol':'1.0-0')) }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex justify-between items-end mt-8" (click)="toggleMask(); $event.stopPropagation()">
                  <div class="flex flex-col gap-1">
                    <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Spent This Month</p>
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-bold text-slate-800">{{ isMasked() ? '••••' : (thisMonthTotal() | currency:'INR':'symbol':'1.0-0') }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Salary Limit</p>
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-bold text-slate-800">{{ isMasked() ? '••••' : (salary() | currency:'INR':'symbol':'1.0-0') }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CARD 2: CASH ACCOUNT GAUGE -->
              <div
                (click)="scrollToCard(1)"
                class="snap-center shrink-0 w-[85vw] max-w-[340px] bg-white text-slate-800 p-6 rounded-[24px] transition-all duration-300 transform relative cursor-pointer shadow-sm border border-gray-100"
                [class.scale-100]="activeGaugeIndex() === 1"
                [class.scale-95]="activeGaugeIndex() !== 1"
                [class.opacity-50]="activeGaugeIndex() !== 1"
              >
                <div class="flex items-center justify-between mb-4">
                  <span class="font-bold text-base text-slate-800">Cash Account</span>
                  <span class="text-[10px] font-bold uppercase px-3 py-1 bg-amber-50 text-amber-600 rounded-full">Wallet</span>
                </div>

                <div class="flex flex-col items-center justify-center relative mt-3">
                  <svg viewBox="0 0 100 55" class="w-full max-w-[250px]">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#F1F5F9" stroke-width="10" stroke-linecap="round" />
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="#F59E0B"
                      stroke-width="10"
                      stroke-linecap="round"
                      stroke-dasharray="125.66"
                      [attr.stroke-dashoffset]="cashGaugeOffset()"
                      class="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-end pb-2" (click)="toggleMask(); $event.stopPropagation()">
                    <span class="text-[10px] font-bold tracking-widest text-amber-600 uppercase mb-1">Balance</span>
                    <div class="w-[65%] flex justify-center overflow-hidden">
                      <p class="font-bold tracking-tight text-slate-900 leading-none text-center truncate"
                         [style.font-size]="getFontSizeForAmount(isMasked() ? '••••' : (cashBalance() | currency:'INR':'symbol':'1.0-0'))">
                        {{ isMasked() ? '••••' : (cashBalance() | currency:'INR':'symbol':'1.0-0') }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex justify-between items-end mt-8" (click)="toggleMask(); $event.stopPropagation()">
                  <div class="flex flex-col gap-1">
                    <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cash Spent</p>
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-bold text-slate-800">{{ isMasked() ? '••••' : (cashSpent() | currency:'INR':'symbol':'1.0-0') }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cash Balance</p>
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-bold text-slate-800">{{ isMasked() ? '••••' : (cashBalance() | currency:'INR':'symbol':'1.0-0') }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CARD 3: SAVINGS ACCOUNT GAUGE -->
              <div
                (click)="scrollToCard(2)"
                class="snap-center shrink-0 w-[85vw] max-w-[340px] bg-white text-slate-800 p-6 rounded-[24px] transition-all duration-300 transform relative cursor-pointer shadow-sm border border-gray-100"
                [class.scale-100]="activeGaugeIndex() === 2"
                [class.scale-95]="activeGaugeIndex() !== 2"
                [class.opacity-50]="activeGaugeIndex() !== 2"
              >
                <div class="flex items-center justify-between mb-4">
                  <span class="font-bold text-base text-slate-800">Savings Account</span>
                  <span class="text-[10px] font-bold uppercase px-3 py-1 bg-indigo-50 text-[#5421E6] rounded-full">Savings</span>
                </div>

                <div class="flex flex-col items-center justify-center relative mt-3">
                  <svg viewBox="0 0 100 55" class="w-full max-w-[250px]">
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="#5833E2"
                      stroke-width="10"
                      stroke-linecap="round"
                      stroke-dasharray="125.66"
                      stroke-dashoffset="0"
                      class="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-end pb-2" (click)="toggleMask(); $event.stopPropagation()">
                    <span class="text-[10px] font-bold tracking-widest text-[#5421E6] uppercase mb-1">Total Savings</span>
                    <div class="w-[65%] flex justify-center overflow-hidden">
                      <p class="font-extrabold tracking-tight text-[#111111] leading-none text-center truncate"
                         [style.font-size]="getFontSizeForAmount(isMasked() ? '••••' : (savingsBalance() | currency:'INR':'symbol':'1.0-0'))">
                        {{ isMasked() ? '••••' : (savingsBalance() | currency:'INR':'symbol':'1.0-0') }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex justify-between items-end mt-8" (click)="toggleMask(); $event.stopPropagation()">
                  <div class="flex flex-col gap-1">
                    <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Growth Status</p>
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-bold text-emerald-500">Active</span>
                      <svg class="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-1">
                    <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Accumulated</p>
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-bold text-slate-800">{{ isMasked() ? '••••' : (savingsBalance() | currency:'INR':'symbol':'1.0-0') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Carousel Dot Indicators -->
            <div class="flex justify-center items-center gap-2 mt-3">
              @for (idx of [0, 1, 2]; track idx) {
                <button
                  (click)="scrollToCard(idx)"
                  [class.w-5]="activeGaugeIndex() === idx"
                  [class.bg-[#5421E6]]="activeGaugeIndex() === idx"
                  [class.w-2]="activeGaugeIndex() !== idx"
                  [class.bg-[#D1D5DB]]="activeGaugeIndex() !== idx"
                  class="h-2 rounded-full transition-all duration-300"
                ></button>
              }
            </div>
          </div>

          <!-- Upcoming Payments Section -->
          <div class="flex flex-col gap-3 mt-4">
            <div class="flex justify-between items-end px-1">
              <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-700">Upcoming Payments</h3>
              <button class="text-[11px] font-semibold text-[#5421E6] hover:underline cursor-pointer flex items-center">
                View All
                <svg class="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            @if (combinedUpcomingPayments().length > 0) {
              <div class="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 snap-x snap-mandatory no-scrollbar">
                @for (payment of combinedUpcomingPayments(); track payment.id; let i = $index) {
                  <div
                    class="snap-start shrink-0 w-[240px] bg-white border border-gray-100 rounded-[20px] p-3 flex items-center gap-3 transition-transform active:scale-95 cursor-pointer shadow-sm hover:shadow-md"
                    (click)="payUpcoming(payment)"
                  >
                    <!-- Icon -->
                    <div class="bg-indigo-50 text-[#5421E6] flex items-center justify-center w-10 h-10 rounded-[14px] shrink-0">
                      @if (payment.type === 'sub') {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                      } @else {
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                          <path [attr.d]="getGoalIconPath(payment.original.icon)"></path>
                        </svg>
                      }
                    </div>

                    <!-- Details -->
                    <div class="flex flex-col flex-1 min-w-0">
                      <div class="flex justify-between items-start gap-1">
                        <span class="font-semibold text-sm text-slate-800 truncate">{{ payment.title }}</span>
                        <span class="font-bold text-sm text-slate-800 shrink-0">₹{{ payment.amount | number: '1.0-0' }}</span>
                      </div>
                      <div class="flex items-center gap-1.5 mt-1">
                        <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                          {{ payment.type === 'sub' ? 'Sub' : 'Goal' }}
                        </span>
                        <span class="text-[10px] font-semibold text-slate-400">
                          Due {{ payment.dueDay }}{{ getOrdinalSuffix(payment.dueDay) }}
                        </span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="w-full bg-[#FCFCFD] border border-dashed border-gray-200 rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
                <div class="w-12 h-12 bg-indigo-50 rounded-[14px] flex items-center justify-center mb-3">
                  <svg class="w-6 h-6 text-[#5421E6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h4 class="text-sm font-bold text-slate-800 mb-1">No upcoming payments</h4>
                <p class="text-xs text-slate-500">You're all caught up! Enjoy your stress-free month.</p>
              </div>
            }
          </div>

          <!-- Split Summary Section -->
          <div class="flex flex-col gap-3 mt-4">
            <div class="flex justify-between items-end px-1">
              <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-700">Split Summary</h3>
              <button class="text-[11px] font-semibold text-[#5421E6] hover:underline cursor-pointer flex items-center">
                View Details
                <svg class="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div class="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-6 relative">
              <!-- Totals Header -->
              <div class="flex justify-between items-center relative">
                <!-- Left Column -->
                <div class="flex flex-col flex-1 pr-4 relative">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">You Are Owed</span>
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-[28px] leading-none font-bold text-slate-900 block mb-1">
                        {{ totalOwedToYou() | currency: 'INR' : 'symbol' : '1.0-0' }}
                      </span>
                      <span class="text-[10px] font-semibold text-slate-400">
                        From {{ friendsWhoOweYou().length }} people
                      </span>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                  </div>
                  <!-- Vertical Divider Line -->
                  <div class="absolute right-0 top-0 bottom-0 w-px bg-gray-100"></div>
                </div>

                <!-- Right Column -->
                <div class="flex flex-col flex-1 pl-4">
                  <span class="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-2">You Owe</span>
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-[28px] leading-none font-bold text-slate-900 block mb-1">
                        {{ totalYouOwe() | currency: 'INR' : 'symbol' : '1.0-0' }}
                      </span>
                      <span class="text-[10px] font-semibold text-slate-400">
                        To {{ friendsYouOwe().length }} people
                      </span>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Top Balances List or Settle Button -->
              @if (topSplitFriends().length === 0) {
                <div class="pt-4 border-t border-gray-100 flex justify-center">
                  <button class="text-xs font-bold text-[#5421E6] uppercase tracking-widest flex items-center gap-1 hover:underline">
                    ALL SETTLED UP
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              } @else {
                <div class="flex flex-col gap-2 pt-4 border-t border-gray-100">
                  @for (fb of topSplitFriends(); track fb.friend.id) {
                    <div class="bg-[#FAFAFA] p-3 rounded-xl flex items-center justify-between border border-gray-100">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                          <img [src]="getAvatarUrl(fb.friend.profile.avatarId)" class="w-full h-full object-cover" />
                        </div>
                        <span class="font-semibold text-sm text-slate-800 truncate max-w-[120px]">{{ fb.friend.profile.name }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {{ fb.balance > 0 ? 'owes you' : 'you owe' }}
                        </span>
                        <span class="font-bold text-sm" [ngClass]="fb.balance > 0 ? 'text-emerald-500' : 'text-red-500'">
                          {{ (fb.balance > 0 ? fb.balance : -fb.balance) | currency: 'INR' : 'symbol' : '1.0-0' }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Recent Transactions Section -->
          <div class="flex flex-col gap-3 mt-4">
            <div class="flex justify-between items-end px-1">
              <h3 class="text-[11px] font-bold uppercase tracking-widest text-slate-700">Recent Transactions</h3>
              <button routerLink="/expenses" class="text-[11px] font-semibold text-[#5421E6] hover:underline cursor-pointer flex items-center">
                View All
                <svg class="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div class="flex flex-col gap-3">
              @for (expense of recentExpenses(); track expense.id) {
                <button
                  (click)="editExpense(expense)"
                  class="w-full bg-white border border-gray-100 rounded-[20px] p-4 flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-md"
                >
                  <!-- Left side: Icon -->
                  <div class="flex items-center gap-3 shrink-0">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center" [ngClass]="getCategoryTheme(expense.category).bg + ' ' + getCategoryTheme(expense.category).text">
                      @switch(expense.category?.toUpperCase()) {
                        @case ('SHOPPING') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                        }
                        @case ('FOOD & DINING') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l-2-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2-2z"/><path d="M16 2v20l2-2-2-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2-2 2-2-2-2z"/><path d="M10 8h4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>
                        }
                        @case ('TRAVEL') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                        }
                        @case ('BILLS') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        }
                        @case ('ENTERTAINMENT') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
                        }
                        @default {
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></svg>
                        }
                      }
                    </div>
                  </div>

                  <!-- Details -->
                  <div class="flex flex-col gap-2 min-w-0 flex-1 ml-1">
                    <span class="font-bold text-[17px] text-slate-900 truncate leading-none mt-1">{{ expense.title }}</span>
                    <div class="flex flex-col gap-1.5">
                      <div class="flex items-center gap-1.5 text-slate-400">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <line x1="16" y1="2" x2="16" y2="6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <line x1="8" y1="2" x2="8" y2="6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <line x1="3" y1="10" x2="21" y2="10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span class="text-[11px] font-medium">{{ expense.date | date: 'MMM d, yyyy • hh:mm a' }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Amount & Payment Tag -->
                  <div class="flex flex-col items-end gap-2 shrink-0">
                    <span class="font-extrabold text-[20px] text-slate-900 leading-none mt-1">
                      ₹{{ expense.amount % 1 === 0 ? (expense.amount | number: '1.0-0') : (expense.amount | number: '1.2-2') }}
                    </span>
                    <span class="text-[10.5px] font-bold uppercase text-slate-500 tracking-wide">
                      {{ formatPaymentMode(expense.paid_via) }}
                    </span>
                  </div>
                </button>
              }
              @if (recentExpenses().length === 0) {
                <div class="w-full bg-[#FCFCFD] border border-dashed border-gray-200 rounded-[24px] p-8 flex flex-col items-center justify-center text-center">
                  <div class="w-12 h-12 bg-indigo-50 rounded-[14px] flex items-center justify-center mb-3">
                    <svg class="w-6 h-6 text-[#5421E6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h4 class="text-sm font-bold text-slate-800 mb-1">No transactions yet</h4>
                  <p class="text-xs text-slate-500">Your transactions will appear here.</p>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
`,
  changeDetection: ChangeDetectionStrategy.Default,
  styles: ``,
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  expenseService = inject(ExpenseService);
  private authService = inject(AuthService);
  goalService = inject(GoalService);
  private toastService = inject(ToastService);
  splitService = inject(SplitService);
  private supabaseService = inject(SupabaseService);
  private subscriptionService = inject(SubscriptionService);
  private confirmService = inject(ConfirmService);
  private friendService = inject(FriendService);
  budgetService = inject(BudgetService);
  keyboardService = inject(KeyboardService);

  isInitialLoading = computed(
    () => !this.expenseService.hasInitiallyLoaded() || this.expenseService.isLoading(),
  );
  isMasked = signal(false);

  pullStartY = 0;
  pullMoveY = 0;
  isPulling = signal(false);
  refreshing = signal(false);

  pullDistance = computed(() => {
    if (!this.isPulling()) return 0;
    const dist = this.pullMoveY - this.pullStartY;
    return dist > 0 ? Math.min(dist * 0.4, 100) : 0;
  });

  onTouchStart(event: TouchEvent) {
    const mainEl = document.querySelector('main');
    if (mainEl && mainEl.scrollTop <= 0) {
      this.pullStartY = event.touches[0].clientY;
      this.isPulling.set(true);
    }
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isPulling()) return;
    const currentY = event.touches[0].clientY;
    if (currentY > this.pullStartY) {
      this.pullMoveY = currentY;
    } else {
      this.isPulling.set(false);
    }
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isPulling()) return;
    if (this.pullDistance() >= 60 && !this.refreshing()) {
      this.refreshing.set(true);
      this.refreshData();
    }
    this.isPulling.set(false);
    this.pullStartY = 0;
    this.pullMoveY = 0;
  }

  async refreshData() {
    window.location.reload();
  }

  accountTrackerService = inject(AccountTrackerService);
  activeGaugeIndex = signal<number>(0);

  @ViewChild('carouselTrack') carouselTrack!: ElementRef<HTMLDivElement>;

  scrollToCard(index: number) {
    this.activeGaugeIndex.set(index);
    if (this.carouselTrack?.nativeElement) {
      const track = this.carouselTrack.nativeElement;
      const cards = track.children;
      if (cards[index]) {
        (cards[index] as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }

  onCarouselScroll(event: Event) {
    const track = event.target as HTMLElement;
    if (!track) return;
    const firstCard = track.firstElementChild as HTMLElement;
    const cardWidth = firstCard?.getBoundingClientRect().width || 300;
    const scrollLeft = track.scrollLeft;
    const index = Math.round(scrollLeft / (cardWidth + 16));
    if (index >= 0 && index <= 2 && index !== this.activeGaugeIndex()) {
      this.activeGaugeIndex.set(index);
    }
  }

  thisMonthTotal = computed(() => {
    return this.expenseService.salaryTotalSpend();
  });

  getCategoryTheme(category: string) {
    const cat = (category || '').toUpperCase();
    if (cat.includes('SHOPPING')) return { bg: 'bg-orange-50', text: 'text-orange-600', tagBg: 'bg-orange-100' };
    if (cat.includes('FOOD') || cat.includes('DINING')) return { bg: 'bg-blue-50', text: 'text-blue-600', tagBg: 'bg-blue-100' };
    if (cat.includes('TRAVEL')) return { bg: 'bg-rose-50', text: 'text-rose-600', tagBg: 'bg-rose-100' };
    if (cat.includes('BILLS') || cat.includes('UTILITIES')) return { bg: 'bg-emerald-50', text: 'text-emerald-600', tagBg: 'bg-emerald-100' };
    if (cat.includes('ENTERTAINMENT')) return { bg: 'bg-pink-50', text: 'text-pink-600', tagBg: 'bg-pink-100' };
    return { bg: 'bg-purple-50', text: 'text-purple-600', tagBg: 'bg-purple-100' };
  }

  formatPaymentMode(mode?: string): string {
    const m = (mode || 'UPI').toUpperCase();
    if (m.includes('CREDIT')) return 'CREDIT';
    if (m.includes('DEBIT')) return 'DEBIT';
    return m;
  }

  salary = computed(() => this.authService.userProfile().salary || 0);
  cashBalance = computed(() => this.accountTrackerService.cashBalance());
  cashSpent = computed(() => this.expenseService.cashTotalSpend());
  savingsBalance = computed(() => this.accountTrackerService.savingsBalance());

  remainingAmount = computed(() => {
    const s = this.salary();
    const spent = this.thisMonthTotal();
    return Math.max(0, s - spent);
  });

  percentage = computed(() => {
    const total = this.thisMonthTotal();
    const max = this.salary();
    if (max <= 0) return 0;
    return Math.min(total / max, 1);
  });

  isOverBudget = computed(() => {
    const s = this.salary();
    const spent = this.thisMonthTotal();
    return s > 0 && spent > s;
  });

  overAmount = computed(() => {
    const s = this.salary();
    const spent = this.thisMonthTotal();
    return Math.max(0, spent - s);
  });

  salaryGaugeColor = computed(() => {
    const total = this.thisMonthTotal();
    const max = this.salary();
    if (max > 0 && total >= max) return '#EF4444'; // Red (Over Budget)
    if (max > 0 && total / max >= 0.8) return '#F59E0B'; // Amber (Near Limit)
    return '#FFFFFF';
  });

  salaryGaugeOffset = computed(() => {
    const p = this.percentage();
    return 125.66 * (1 - p);
  });

  cashGaugeColor = computed(() => {
    return this.cashBalance() <= 0 ? '#EF4444' : '#F59E0B';
  });

  cashGaugeOffset = computed(() => {
    const bal = this.cashBalance();
    const spent = this.cashSpent();
    const total = bal + spent;
    if (total <= 0) return 125.66;
    const ratio = Math.min(spent / total, 1);
    return 125.66 * (1 - ratio);
  });

  recentExpenses = computed(() => {
    return this.expenseService
      .expenses()
      .sort(
        (a, b) =>
          new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime(),
      )
      .slice(0, 5);
  });

  totalOwedToYou = this.splitService.totalOwedToYou;
  totalYouOwe = this.splitService.totalYouOwe;

  topSplitFriends = computed(() => {
    const balances = this.splitService.simplifiedBalances();
    const friends = this.friendService.acceptedFriends();

    const friendBalances = friends
      .map((f) => {
        const balance = balances[f.profile.id] || 0;
        return {
          friend: f,
          balance,
          absBalance: Math.abs(balance),
        };
      })
      .filter((fb) => fb.absBalance > 0);

    friendBalances.sort((a, b) => b.absBalance - a.absBalance);
    return friendBalances.slice(0, 5);
  });

  friendsWhoOweYou = computed(() => this.topSplitFriends().filter((fb) => fb.balance > 0));
  friendsYouOwe = computed(() => this.topSplitFriends().filter((fb) => fb.balance < 0));

  combinedUpcomingPayments = computed(() => {
    const today = new Date().getDate();

    const subs = this.subscriptionService.upcomingSubscriptions().map((s) => {
      let diff = s.billing_day - today;
      if (diff < -15) {
        const d = new Date();
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        diff = daysInMonth - today + s.billing_day;
      }
      return {
        id: 'sub_' + s.id,
        type: 'sub' as const,
        title: s.title,
        amount: s.amount,
        dueDay: s.billing_day,
        diff: diff,
        original: s,
      };
    });

    const activeMonth = this.expenseService.activeMonth();
    const thisMonthGoalExpenses = this.expenseService
      .expenses()
      .filter((e) => e.category === 'virtual-invest' && e.date.startsWith(activeMonth));

    const goals = this.goalService
      .goals()
      .filter((g) => g.calculated_installment > 0)
      .filter((g) => this.goalService.isGoalDueThisMonth(g))
      .map((g) => {
        const goalExpenses = thisMonthGoalExpenses.filter((e) => {
          const goalName = e.title.startsWith('Goal: ') ? e.title.replace('Goal: ', '') : e.title;
          return goalName === g.name;
        });
        const paidThisMonth = goalExpenses.reduce((sum, e) => sum + e.amount, 0);
        return { goal: g, remaining: g.calculated_installment - paidThisMonth };
      })
      .filter((x) => x.remaining > 0)
      .map((x) => {
        const g = x.goal;
        let diff = g.installment_date - today;
        if (diff < 0) {
          const d = new Date();
          const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
          diff = daysInMonth - today + g.installment_date;
        }
        return {
          id: 'goal_' + g.id,
          type: 'goal' as const,
          title: g.name,
          amount: x.remaining,
          dueDay: g.installment_date,
          diff: diff,
          original: g,
        };
      });

    return [...subs, ...goals].sort((a, b) => a.diff - b.diff).slice(0, 5);
  });

  getOrdinalSuffix(i: number): string {
    const j = i % 10,
      k = i % 100;
    if (j == 1 && k != 11) {
      return 'st';
    }
    if (j == 2 && k != 12) {
      return 'nd';
    }
    if (j == 3 && k != 13) {
      return 'rd';
    }
    return 'th';
  }

  constructor() {
    effect(() => {
      const shouldMask = this.authService.userProfile().maskValues;
      this.isMasked.set(shouldMask);
    });
  }

  getGoalIconPath(iconPath: string): string {
    const defaultPremiumPath =
      'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5';
    if (
      !iconPath ||
      iconPath.startsWith('M20 12v10H4V12') ||
      iconPath.startsWith('M2.25 18L9 11.25')
    ) {
      return defaultPremiumPath;
    }
    return iconPath;
  }

  getFontSizeForAmount(amountText: string | null): string {
    if (!amountText) return '28px';
    const len = amountText.length;
    if (len > 10) return '18px';
    if (len > 8) return '20px';
    if (len > 6) return '24px';
    return '28px';
  }

  ngOnInit() {}

  ngAfterViewInit() {}

  ngOnDestroy() {}

  getAvatarUrl(id?: number): string {
    return this.authService.getAvatarUrl(id);
  }

  toggleMask() {
    if (this.authService.userProfile().maskValues) {
      this.isMasked.update((v) => !v);
    }
  }

  openAddExpense() {
    this.expenseService.openBottomSheet();
  }

  async editExpense(expense: Expense) {
    if (expense.category === 'virtual-invest') {
      const goalName = expense.title.startsWith('Goal: ')
        ? expense.title.replace('Goal: ', '')
        : expense.title;
      const goal = this.goalService.goals().find((g) => g.name === goalName);
      if (goal) {
        this.goalService.openAddFundsSheet(goal, expense);
      } else {
        this.toastService.showError('Goal not found.');
      }
      return;
    }

    if (expense.category.includes('(Subscription)')) {
      const sub = this.subscriptionService.subscriptions().find((s) => s.title === expense.title);
      if (sub) {
        this.subscriptionService.openBottomSheet(sub);
      } else {
        this.toastService.showError('Subscription not found.');
      }
      return;
    }

    if (expense.id.startsWith('split_')) {
      const splitId = expense.id.replace('split_', '');
      const existingSplit = this.splitService.splits().find((s) => s.id === splitId);
      if (existingSplit) {
        this.splitService.openAddSplitSheet(existingSplit);
      } else {
        const { data, error } = await this.supabaseService.client
          .from('split_expenses')
          .select('*')
          .eq('id', splitId)
          .single();

        if (!error && data) {
          this.splitService.openAddSplitSheet(data as any);
        } else {
          this.toastService.showError("Couldn't load split expense.");
        }
      }
      return;
    }
    this.expenseService.openBottomSheet(expense);
  }

  payUpcoming(payment: any) {
    if (payment.type === 'sub') {
      const sub = payment.original;
      this.confirmService.open({
        title: 'Mark as Paid',
        message: `Are you sure you want to mark ${sub.title} as paid? This will log an expense for ₹${sub.amount}.`,
        confirmText: 'Mark Paid',
        cancelText: 'Cancel',
        onConfirm: async () => {
          await this.subscriptionService.markAsPaid(sub);
        },
      });
    } else if (payment.type === 'goal') {
      this.goalService.openAddFundsSheet(payment.original);
    }
  }
}
