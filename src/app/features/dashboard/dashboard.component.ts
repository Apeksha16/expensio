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
  imports: [CommonModule],
  host: {
    class: 'flex flex-col h-full',
  },
  template: `
    <div
      class="h-full bg-gray-50 flex flex-col overflow-y-auto pb-28 select-none"
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
            class="animate-spin h-6 w-6 text-black"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        } @else if (pullDistance() > 0) {
          <div
            class="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex flex-col items-center gap-1"
          >
            <svg
              class="w-5 h-5 transition-transform"
              [class.rotate-180]="pullDistance() > 60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              ></path>
            </svg>
            {{ pullDistance() > 60 ? 'Release to refresh' : 'Pull to refresh' }}
          </div>
        }
      </div>

      <div class="p-6 flex flex-col gap-6">
        @if (isInitialLoading()) {
          <!-- Total Expenses Shimmer -->
          <div class="bg-gray-200 p-6 rounded-none relative overflow-hidden">
            <div class="flex flex-col items-center justify-center relative mt-2">
              <div
                class="w-full max-w-[220px] aspect-[100/55] bg-gray-300 rounded-t-full animate-pulse"
              ></div>
              <div class="absolute bottom-0 flex flex-col items-center translate-y-1">
                <div class="h-2 bg-gray-300 w-16 mb-2 animate-pulse"></div>
                <div class="h-8 bg-gray-300 w-32 animate-pulse"></div>
              </div>
            </div>

            <div class="flex justify-between items-end mt-6 pt-4 border-t-2 border-gray-300">
              <div>
                <div class="h-2 bg-gray-300 w-10 mb-2 animate-pulse"></div>
                <div class="h-4 bg-gray-300 w-16 animate-pulse"></div>
              </div>
              <div class="flex flex-col items-end">
                <div class="h-2 bg-gray-300 w-10 mb-2 animate-pulse"></div>
                <div class="h-4 bg-gray-300 w-16 animate-pulse"></div>
              </div>
            </div>
          </div>
          <!-- Upcoming Payments Shimmer -->
          <div class="flex flex-col gap-3">
            <div class="h-6 bg-gray-200 w-48 animate-pulse mb-1"></div>
            <div class="flex gap-4 overflow-x-hidden pb-1 pt-1 px-1">
              @for (i of [1, 2]; track i) {
                <div
                  class="shrink-0 w-[240px] rounded-none bg-gray-100 p-3 flex items-center gap-3 animate-pulse"
                >
                  <div class="bg-gray-200 w-10 h-10 shrink-0 rounded-none"></div>
                  <div class="flex flex-col flex-1 gap-2">
                    <div class="flex justify-between items-center w-full">
                      <div class="h-4 bg-gray-200 w-20"></div>
                      <div class="h-4 bg-gray-200 w-12"></div>
                    </div>
                    <div class="h-2.5 bg-gray-200 w-24 mt-0.5"></div>
                  </div>
                </div>
              }
            </div>
          </div>
          <!-- Quick Actions Shimmer -->
          <div class="flex flex-col gap-3">
            <div class="h-6 bg-gray-200 w-32 animate-pulse mb-1"></div>
            <div class="grid grid-cols-4 gap-3 mb-2">
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="bg-gray-200 h-[84px] rounded-none animate-pulse"></div>
              }
            </div>
          </div>
          <!-- Split Summary Shimmer -->
          <div class="flex flex-col gap-3">
            <div class="h-6 bg-gray-200 w-36 animate-pulse mb-1"></div>
            <div
              class="bg-gray-100 p-5 flex flex-col gap-6 rounded-none h-[250px] animate-pulse"
            ></div>
          </div>
          <!-- Recent Transactions Shimmer -->
          <div class="flex flex-col gap-3">
            <div class="h-6 bg-gray-200 w-40 animate-pulse"></div>
            <div class="flex flex-col gap-2">
              @for (i of [1, 2, 3]; track i) {
                <div class="bg-gray-100 rounded-none h-[68px] animate-pulse"></div>
              }
            </div>
          </div>
        } @else {
          <!-- 3D Cover Flow Carousel for 3 Accounts -->
          <div class="relative w-full">
            <!-- Top Navigation Pill Controls -->
            <div class="flex items-center justify-between mb-3 px-1">
              <span class="text-xs font-black uppercase tracking-widest text-gray-900">Account Progress</span>
              <!-- Sleek Segmented Switcher -->
              <div class="flex bg-gray-200 p-0.5 rounded-full border border-gray-300 shadow-inner">
                <button
                  (click)="scrollToCard(0)"
                  [class.bg-black]="activeGaugeIndex() === 0"
                  [class.text-white]="activeGaugeIndex() === 0"
                  [class.text-gray-600]="activeGaugeIndex() !== 0"
                  class="px-3.5 py-1 text-[10px] font-extrabold rounded-full transition-all duration-200 cursor-pointer"
                >
                  Salary
                </button>
                <button
                  (click)="scrollToCard(1)"
                  [class.bg-black]="activeGaugeIndex() === 1"
                  [class.text-white]="activeGaugeIndex() === 1"
                  [class.text-gray-600]="activeGaugeIndex() !== 1"
                  class="px-3.5 py-1 text-[10px] font-extrabold rounded-full transition-all duration-200 cursor-pointer"
                >
                  Cash
                </button>
                <button
                  (click)="scrollToCard(2)"
                  [class.bg-black]="activeGaugeIndex() === 2"
                  [class.text-white]="activeGaugeIndex() === 2"
                  [class.text-gray-600]="activeGaugeIndex() !== 2"
                  class="px-3.5 py-1 text-[10px] font-extrabold rounded-full transition-all duration-200 cursor-pointer"
                >
                  Savings
                </button>
              </div>
            </div>

            <!-- Horizontal Scroll Snap Carousel Track -->
            <div
              #carouselTrack
              (scroll)="onCarouselScroll($event)"
              class="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar py-2 px-1 scroll-smooth"
            >
                    <!-- CARD 1: SALARY ACCOUNT GAUGE -->
              <div
                (click)="scrollToCard(0)"
                class="snap-center shrink-0 w-[85vw] max-w-[340px] bg-black text-white p-5 border-2 rounded-2xl transition-all duration-300 transform relative cursor-pointer shadow-xl"
                [class.scale-100]="activeGaugeIndex() === 0"
                [class.scale-95]="activeGaugeIndex() !== 0"
                [class.opacity-50]="activeGaugeIndex() !== 0"
                [class.border-blue-500]="activeGaugeIndex() === 0"
                [class.border-black]="activeGaugeIndex() !== 0"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-extrabold text-sm tracking-wide text-white">Salary Account</span>
                  </div>
                  <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">Primary</span>
                </div>

                <div class="flex flex-col items-center justify-center relative mt-1">
                  <svg viewBox="0 0 100 55" class="w-full max-w-[200px] drop-shadow-xl">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#222" stroke-width="8" stroke-linecap="round" />
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      [attr.stroke]="salaryGaugeColor()"
                      stroke-width="8"
                      stroke-linecap="round"
                      stroke-dasharray="125.66"
                      [attr.stroke-dashoffset]="salaryGaugeOffset()"
                      class="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div class="absolute bottom-0 flex flex-col items-center translate-y-1" (click)="toggleMask(); $event.stopPropagation()">
                    <h2 class="text-[9px] font-bold uppercase tracking-widest mb-0.5" [class.text-red-400]="isOverBudget()" [class.text-gray-400]="!isOverBudget()">
                      {{ isOverBudget() ? 'OVER BUDGET' : 'REMAINING' }}
                    </h2>
                    <p class="text-2xl font-black tracking-tighter" [class.text-red-500]="isOverBudget()" [class.text-white]="!isOverBudget()">
                      {{ isMasked() ? '••••' : (isOverBudget() ? '+' + (overAmount() | currency:'INR':'symbol':'1.0-0') : (remainingAmount() | currency:'INR':'symbol':'1.0-0')) }}
                    </p>
                  </div>
                </div>

                <div class="flex justify-between items-end mt-4 pt-3 border-t border-gray-800" (click)="toggleMask(); $event.stopPropagation()">
                  <div>
                    <p class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Spent This Month</p>
                    <p class="text-xs font-bold text-white">{{ isMasked() ? '••••' : (thisMonthTotal() | currency:'INR':'symbol':'1.0-0') }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Salary Limit</p>
                    <p class="text-xs font-bold text-white">{{ isMasked() ? '••••' : (salary() | currency:'INR':'symbol':'1.0-0') }}</p>
                  </div>
                </div>
              </div>

              <!-- CARD 2: CASH ACCOUNT GAUGE -->
              <div
                (click)="scrollToCard(1)"
                class="snap-center shrink-0 w-[85vw] max-w-[340px] bg-black text-white p-5 border-2 rounded-2xl transition-all duration-300 transform relative cursor-pointer shadow-xl"
                [class.scale-100]="activeGaugeIndex() === 1"
                [class.scale-95]="activeGaugeIndex() !== 1"
                [class.opacity-50]="activeGaugeIndex() !== 1"
                [class.border-amber-500]="activeGaugeIndex() === 1"
                [class.border-black]="activeGaugeIndex() !== 1"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-extrabold text-sm tracking-wide text-white">Cash Account</span>
                  </div>
                  <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">Wallet</span>
                </div>

                <div class="flex flex-col items-center justify-center relative mt-1">
                  <svg viewBox="0 0 100 55" class="w-full max-w-[200px] drop-shadow-xl">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#222" stroke-width="8" stroke-linecap="round" />
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      [attr.stroke]="cashGaugeColor()"
                      stroke-width="8"
                      stroke-linecap="round"
                      stroke-dasharray="125.66"
                      [attr.stroke-dashoffset]="cashGaugeOffset()"
                      class="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div class="absolute bottom-0 flex flex-col items-center translate-y-1" (click)="toggleMask(); $event.stopPropagation()">
                    <h2 class="text-[9px] font-bold uppercase tracking-widest mb-0.5 text-amber-400">
                      {{ cashBalance() <= 0 ? 'CASH DEPLETED' : 'CASH REMAINING' }}
                    </h2>
                    <p class="text-2xl font-black tracking-tighter text-white">
                      {{ isMasked() ? '••••' : (cashBalance() | currency:'INR':'symbol':'1.0-0') }}
                    </p>
                  </div>
                </div>

                <div class="flex justify-between items-end mt-4 pt-3 border-t border-gray-800" (click)="toggleMask(); $event.stopPropagation()">
                  <div>
                    <p class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Cash Spent</p>
                    <p class="text-xs font-bold text-white">{{ isMasked() ? '••••' : (cashSpent() | currency:'INR':'symbol':'1.0-0') }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Cash Balance</p>
                    <p class="text-xs font-bold text-white">{{ isMasked() ? '••••' : (cashBalance() | currency:'INR':'symbol':'1.0-0') }}</p>
                  </div>
                </div>
              </div>

              <!-- CARD 3: SAVINGS ACCOUNT GAUGE -->
              <div
                (click)="scrollToCard(2)"
                class="snap-center shrink-0 w-[85vw] max-w-[340px] bg-black text-white p-5 border-2 rounded-2xl transition-all duration-300 transform relative cursor-pointer shadow-xl"
                [class.scale-100]="activeGaugeIndex() === 2"
                [class.scale-95]="activeGaugeIndex() !== 2"
                [class.opacity-50]="activeGaugeIndex() !== 2"
                [class.border-emerald-500]="activeGaugeIndex() === 2"
                [class.border-black]="activeGaugeIndex() !== 2"
              >
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-extrabold text-sm tracking-wide text-white">Savings Account</span>
                  </div>
                  <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">Savings</span>
                </div>

                <div class="flex flex-col items-center justify-center relative mt-1">
                  <svg viewBox="0 0 100 55" class="w-full max-w-[200px] drop-shadow-xl">
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#222" stroke-width="8" stroke-linecap="round" />
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="#10B981"
                      stroke-width="8"
                      stroke-linecap="round"
                      stroke-dasharray="125.66"
                      stroke-dashoffset="0"
                      class="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div class="absolute bottom-0 flex flex-col items-center translate-y-1" (click)="toggleMask(); $event.stopPropagation()">
                    <h2 class="text-[9px] font-bold uppercase tracking-widest mb-0.5 text-emerald-400">
                      TOTAL SAVINGS
                    </h2>
                    <p class="text-2xl font-black tracking-tighter text-white">
                      {{ isMasked() ? '••••' : (savingsBalance() | currency:'INR':'symbol':'1.0-0') }}
                    </p>
                  </div>
                </div>

                <div class="flex justify-between items-end mt-4 pt-3 border-t border-gray-800" (click)="toggleMask(); $event.stopPropagation()">
                  <div>
                    <p class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Growth</p>
                    <p class="text-xs font-bold text-emerald-400">Active</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Accumulated</p>
                    <p class="text-xs font-bold text-white">{{ isMasked() ? '••••' : (savingsBalance() | currency:'INR':'symbol':'1.0-0') }}</p>
                  </div>
                </div>
              </div>

            </div>

            <!-- Carousel Dot Indicators -->
            <div class="flex justify-center items-center gap-2 mt-2">
              @for (idx of [0, 1, 2]; track idx) {
                <button
                  (click)="scrollToCard(idx)"
                  [class.w-6]="activeGaugeIndex() === idx"
                  [class.bg-black]="activeGaugeIndex() === idx"
                  [class.w-2]="activeGaugeIndex() !== idx"
                  [class.bg-gray-300]="activeGaugeIndex() !== idx"
                  class="h-2 rounded-full transition-all duration-300"
                ></button>
              }
            </div>
          </div>

          <!-- Upcoming Payments (Horizontal Ticket Style) -->
          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-end mb-1">
              <h3 class="text-xs font-black uppercase tracking-widest text-gray-900">Upcoming Payments</h3>
            </div>

            @if (combinedUpcomingPayments().length > 0) {
              <!-- Horizontal Scroll Container -->
              <div
                class="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 snap-x snap-mandatory no-scrollbar"
              >
                @for (payment of combinedUpcomingPayments(); track payment.id; let i = $index) {
                  <div
                    class="snap-start shrink-0 w-[240px] bg-white border-2 border-black rounded-2xl p-3 flex items-center gap-3 transition-transform active:scale-95 cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                    (click)="payUpcoming(payment)"
                  >
                    <!-- Icon -->
                    <div
                      class="bg-black text-white flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                    >
                      @if (payment.type === 'sub') {
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          ></path>
                        </svg>
                      } @else {
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path [attr.d]="getGoalIconPath(payment.original.icon)"></path>
                        </svg>
                      }
                    </div>

                    <!-- Details -->
                    <div class="flex flex-col flex-1 min-w-0">
                      <div class="flex justify-between items-start gap-1">
                        <span class="font-extrabold text-xs text-gray-900 truncate">{{ payment.title }}</span>
                        <span class="font-black text-xs text-gray-900 shrink-0"
                          >₹{{ payment.amount | number: '1.0-0' }}</span
                        >
                      </div>
                      <div class="flex items-center gap-1.5 mt-1">
                        <span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-md border border-gray-300">
                          {{ payment.type === 'sub' ? 'Sub' : 'Goal' }}
                        </span>
                        <span class="text-[9px] font-bold text-gray-500">
                          Due {{ payment.dueDay }}{{ getOrdinalSuffix(payment.dueDay) }}
                        </span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div
                class="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 text-center"
              >
                <span class="text-xs font-bold uppercase tracking-widest"
                  >No Upcoming payments this month</span
                >
              </div>
            }
          </div>

          <!-- Split Summary -->
          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-end mb-1">
              <h3 class="text-xs font-black uppercase tracking-widest text-gray-900">Split Summary</h3>
            </div>

            <div class="bg-black text-white p-5 rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(99,102,241,1)] flex flex-col gap-5">
              <!-- Totals Header -->
              <div class="grid grid-cols-2 gap-4 divide-x divide-gray-800">
                <div class="flex flex-col items-start pr-2">
                  <span class="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400"
                    >You Are Owed</span
                  >
                  <span class="text-2xl font-black text-white my-1">{{
                    totalOwedToYou() | currency: 'INR' : 'symbol' : '1.0-0'
                  }}</span>
                  <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest"
                    >from {{ friendsWhoOweYou().length }} {{ friendsWhoOweYou().length === 1 ? 'person' : 'people' }}</span
                  >
                </div>

                <div class="flex flex-col items-start pl-4">
                  <span class="text-[10px] font-extrabold uppercase tracking-widest text-red-400"
                    >You Owe</span
                  >
                  <span class="text-2xl font-black text-white my-1">{{
                    totalYouOwe() | currency: 'INR' : 'symbol' : '1.0-0'
                  }}</span>
                  <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest"
                    >to {{ friendsYouOwe().length }} {{ friendsYouOwe().length === 1 ? 'person' : 'people' }}</span
                  >
                </div>
              </div>

              <!-- Top Balances List -->
              <div class="flex flex-col gap-2 pt-2 border-t border-gray-800">
                @if (topSplitFriends().length === 0) {
                  <div
                    class="text-center text-gray-500 text-[10px] uppercase tracking-widest font-bold py-2"
                  >
                    All Settled Up
                  </div>
                } @else {
                  @for (fb of topSplitFriends(); track fb.friend.id) {
                    <div class="bg-gray-900 border border-gray-800 p-2.5 rounded-xl flex items-center justify-between">
                      <div class="flex items-center gap-2.5">
                        <div
                          class="w-7 h-7 rounded-full border border-gray-700 bg-gray-800 flex items-center justify-center overflow-hidden shrink-0"
                        >
                          <img
                            [src]="getAvatarUrl(fb.friend.profile.avatarId)"
                            class="w-full h-full object-cover"
                          />
                        </div>
                        <span class="font-extrabold text-xs text-white truncate max-w-[110px]">{{
                          fb.friend.profile.name
                        }}</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="text-[9px] font-bold text-gray-400 uppercase tracking-wider"
                          >{{ fb.balance > 0 ? 'owes you' : 'you owe' }}</span
                        >
                        <span
                          class="font-black text-xs"
                          [ngClass]="fb.balance > 0 ? 'text-emerald-400' : 'text-red-400'"
                        >
                          {{ (fb.balance > 0 ? fb.balance : -fb.balance) | currency: 'INR' : 'symbol' : '1.0-0' }}
                        </span>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-end mb-1">
              <h3 class="text-xs font-black uppercase tracking-widest text-gray-900">Recent Transactions</h3>
            </div>
            <div class="flex flex-col gap-2.5">
              @for (expense of recentExpenses(); track expense.id) {
                <button
                  (click)="editExpense(expense)"
                  class="w-full bg-white border-2 border-black rounded-2xl p-3.5 flex items-center gap-3 text-left transition-all active:scale-[0.99] cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <!-- Icon -->
                  <div class="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center shrink-0 bg-gray-100">
                    <span class="text-base font-black text-black">{{ expense.title.charAt(0).toUpperCase() }}</span>
                  </div>

                  <!-- Details -->
                  <div class="flex flex-col gap-1 min-w-0 flex-1">
                    <span class="font-extrabold text-sm text-gray-900 truncate">{{ expense.title }}</span>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md border border-gray-200 truncate max-w-[130px]">
                        {{ expense.category }}
                      </span>
                      <span class="text-[10px] font-semibold text-gray-400">
                        {{ expense.date | date: 'MMM d, h:mm a' }}
                      </span>
                    </div>
                  </div>

                  <!-- Amount & Payment Tag -->
                  <div class="flex flex-col items-end gap-0.5 shrink-0">
                    <span class="font-black text-base text-gray-900">
                      ₹{{ expense.amount % 1 === 0 ? (expense.amount | number: '1.0-0') : (expense.amount | number: '1.2-2') }}
                    </span>
                    <span class="text-[9px] font-extrabold uppercase text-gray-400 tracking-wider">
                      {{ expense.paid_via || 'UPI' }}
                    </span>
                  </div>
                </button>
              }
              @if (recentExpenses().length === 0) {
                <div
                  class="w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400"
                >
                  <span class="text-xs font-bold uppercase tracking-widest">No Transactions</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
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

  getCardColor(index: number, type: 'sub' | 'goal'): string {
    if (type === 'sub')
      return 'border-subscriptions-primary bg-subscriptions-surface text-subscriptions-dark';
    if (type === 'goal') return 'border-goals-primary bg-goals-surface text-goals-dark';
    return 'border-gray-400 bg-gray-100 text-gray-800';
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

  getCategoryColor(category: string): string {
    if (!category)
      return 'border-expense-primary bg-expense-surface hover:bg-expense-light text-expense-dark';
    if (category === 'virtual-invest') {
      return 'border-goals-primary bg-goals-surface hover:bg-goals-light text-goals-dark';
    } else if (category.includes('(Group Split)')) {
      return 'border-friends-primary bg-friends-surface hover:bg-friends-light text-friends-dark';
    } else if (category.includes('(Split)')) {
      return 'border-splits-primary bg-splits-surface hover:bg-splits-light text-splits-dark';
    } else if (category.includes('(Subscription)')) {
      return 'border-subscriptions-primary bg-subscriptions-surface hover:bg-subscriptions-light text-subscriptions-dark';
    }
    return 'border-expense-primary bg-expense-surface hover:bg-expense-light text-expense-dark';
  }

  constructor() {}

  ngOnInit() {
    this.isMasked.set(this.authService.userProfile().maskValues);
  }

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
