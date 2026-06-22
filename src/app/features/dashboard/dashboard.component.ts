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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { ExpenseService, Expense } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';
import { GoalService } from '../../core/services/goal.service';
import { ToastService } from '../../core/services/toast.service';
import { SplitService } from '../../core/services/split.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'flex flex-col h-full',
  },
  template: `
    <div class="flex-1 bg-gray-50 p-6 flex flex-col gap-6 pb-36">
      @if (isInitialLoading()) {
        <!-- Total Expenses Shimmer -->
        <div class="bg-black text-white p-6 border-2 border-black rounded-none relative overflow-hidden">
          <div class="flex flex-col items-center justify-center relative mt-2">
            <div class="w-full max-w-[220px] aspect-[100/55] bg-gray-900 rounded-t-full animate-pulse"></div>
            <div class="absolute bottom-0 flex flex-col items-center translate-y-1">
              <div class="h-2 bg-gray-800 w-16 mb-2 animate-pulse"></div>
              <div class="h-8 bg-gray-800 w-32 animate-pulse"></div>
            </div>
          </div>
          
          <div class="flex justify-between items-end mt-6 pt-4 border-t-2 border-gray-800">
            <div>
              <div class="h-2 bg-gray-800 w-10 mb-2 animate-pulse"></div>
              <div class="h-4 bg-gray-800 w-16 animate-pulse"></div>
            </div>
            <div class="flex flex-col items-end">
              <div class="h-2 bg-gray-800 w-10 mb-2 animate-pulse"></div>
              <div class="h-4 bg-gray-800 w-16 animate-pulse"></div>
            </div>
          </div>
        </div>
        <!-- Upcoming Payments Shimmer -->
        <div class="flex flex-col gap-3">
          <div class="h-6 bg-gray-200 w-48 animate-pulse mb-1"></div>
          <div class="flex gap-4 overflow-x-hidden pb-1 pt-1 px-1">
            @for (i of [1, 2]; track i) {
              <div class="shrink-0 w-[240px] rounded-none border-2 border-gray-200 p-3 flex items-center gap-3 animate-pulse bg-white">
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
        <!-- Recent Transactions Shimmer -->
        <div class="flex flex-col gap-3">
          <div class="h-6 bg-gray-200 w-40 animate-pulse"></div>
          <div class="flex flex-col gap-2">
            @for (i of [1, 2, 3]; track i) {
              <div class="bg-white border-2 border-gray-300 rounded-none h-[68px] animate-pulse"></div>
            }
          </div>
        </div>
      } @else {
        <!-- Total Expenses Box -->
        <div class="bg-black text-white p-6 border-2 border-black rounded-none relative overflow-hidden">
          <div class="flex flex-col items-center justify-center relative mt-2">
            <svg viewBox="0 0 100 55" class="w-full max-w-[220px] drop-shadow-xl">
              <!-- Background track -->
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#333" stroke-width="8" stroke-linecap="butt" />
              <!-- Progress -->
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" [attr.stroke]="gaugeColor()" stroke-width="8" stroke-linecap="butt"
                    stroke-dasharray="125.66" [attr.stroke-dashoffset]="gaugeOffset()"
                    class="transition-all duration-1000 ease-out" />
            </svg>
            <div class="absolute bottom-0 flex flex-col items-center translate-y-1 cursor-pointer" (click)="toggleMask()">
              <h2 class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Remaining</h2>
              <p class="text-3xl font-black tracking-tighter transition-colors duration-500" [style.color]="gaugeColor()">
                {{ remainingAmount() | currency: 'INR' : 'symbol' : '1.0-0' }}
              </p>
            </div>
          </div>
          
          <div class="flex justify-between items-end mt-6 pt-4 border-t-2 border-gray-800 cursor-pointer" (click)="toggleMask()">
            <div>
              <p class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Spent</p>
              <p class="text-sm font-bold text-white transition-all">{{ isMasked() ? '••••' : (thisMonthTotal() | currency: 'INR' : 'symbol' : '1.0-0') }}</p>
            </div>
            <div class="text-right">
              <p class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Limit</p>
              <p class="text-sm font-bold text-white transition-all">{{ isMasked() ? '••••' : (salary() | currency: 'INR' : 'symbol' : '1.0-0') }}</p>
            </div>
          </div>
        </div>
        <!-- Chart Section Hidden for now -->
        <!--
        <div class="bg-white border-2 border-black rounded-none p-5">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold">Analytics</h3>
            <div class="flex border-2 border-black rounded-none overflow-hidden text-xs font-bold">
              <button
                (click)="setChartType('weekly')"
                [class.bg-black]="chartType === 'weekly'"
                [class.text-white]="chartType === 'weekly'"
                [class.text-gray-500]="chartType !== 'weekly'"
                [class.bg-white]="chartType !== 'weekly'"
                class="px-3 py-1.5 transition-colors"
              >
                Weekly
              </button>
              <button
                (click)="setChartType('monthly')"
                [class.bg-black]="chartType === 'monthly'"
                [class.text-white]="chartType === 'monthly'"
                [class.text-gray-500]="chartType !== 'monthly'"
                [class.bg-white]="chartType !== 'monthly'"
                class="px-3 py-1.5 border-l-2 border-black transition-colors"
              >
                Monthly
              </button>
            </div>
          </div>
          <div class="relative h-64 w-full">
            <canvas #chartCanvas></canvas>
          </div>
        </div>
        -->

        <!-- Upcoming Payments (Horizontal Ticket Style) -->
        @if (combinedUpcomingPayments().length > 0) {
          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-end mb-1">
              <h3 class="text-lg font-bold">Upcoming Payments</h3>
            </div>
            
            <!-- Horizontal Scroll Container -->
            <div class="flex gap-4 overflow-x-auto pb-1 pt-1 px-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              
              @for (payment of combinedUpcomingPayments(); track payment.id; let i = $index) {
                <div class="snap-start shrink-0 w-[240px] rounded-none border-2 border-black p-3 flex items-center gap-3 transition-transform active:scale-95 cursor-pointer"
                     [ngClass]="getCardColor(i, payment.type)"
                     (click)="payUpcoming(payment)">
                  
                  <!-- Icon -->
                  <div class="border-2 border-black bg-white flex items-center justify-center w-10 h-10 shrink-0">
                    @if (payment.type === 'sub') {
                      <svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    } @else {
                      <svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <path [attr.d]="getGoalIconPath(payment.original.icon)"></path>
                      </svg>
                    }
                  </div>

                  <!-- Details -->
                  <div class="flex flex-col flex-1 min-w-0">
                    <div class="flex justify-between items-start gap-2">
                      <span class="font-extrabold text-sm text-black truncate">{{ payment.title }}</span>
                      <span class="font-black text-sm text-black shrink-0">₹{{ payment.amount | number: '1.0-0' }}</span>
                    </div>
                    <span class="text-[9px] font-bold text-black/60 uppercase tracking-widest mt-0.5">
                      {{ payment.type === 'sub' ? 'Sub' : 'Goal' }} • Due {{ payment.dueDay }}{{ getOrdinalSuffix(payment.dueDay) }}
                    </span>
                  </div>

                </div>
              }
              
            </div>
          </div>
        }

        <!-- Recent Transactions -->
        <div class="flex flex-col gap-3">
          <div class="flex justify-between items-end mb-1">
            <h3 class="text-lg font-bold">Recent Transactions</h3>
          </div>
          <div class="flex flex-col gap-2">
            @for (expense of recentExpenses(); track expense.id) {
              <button
                (click)="editExpense(expense)"
                class="w-full bg-gray-200 rounded-none p-3 flex justify-between items-center text-left border-l-4 hover:bg-gray-300 transition-colors active:bg-gray-400"
                [ngClass]="getCategoryColor(expense.category)"
              >
                <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                  <span class="font-extrabold text-lg text-black truncate">{{ expense.title }}</span>
                  <div class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest min-w-0">
                    <span class="truncate">{{ expense.category }}</span>
                    <span class="flex-shrink-0">•</span>
                    <span class="whitespace-nowrap flex-shrink-0">{{ expense.date | date: 'MMM d, h:mm a' }}</span>
                  </div>
                </div>
                <div class="flex flex-col items-end gap-2 flex-shrink-0">
                  <span class="font-extrabold text-xl">₹{{ expense.amount | number: '1.2-2' }}</span>
                </div>
              </button>
            }
            @if (recentExpenses().length === 0) {
              <div class="w-full bg-white border-2 border-dashed border-gray-300 rounded-none p-6 flex flex-col items-center justify-center text-gray-400">
                <span class="text-sm font-bold uppercase tracking-widest">No Transactions</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: ``,
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private expenseService = inject(ExpenseService);
  private authService = inject(AuthService);
  private goalService = inject(GoalService);
  private toastService = inject(ToastService);
  private splitService = inject(SplitService);
  private supabaseService = inject(SupabaseService);
  private subscriptionService = inject(SubscriptionService);
  private confirmService = inject(ConfirmService);

  chartType: 'weekly' | 'monthly' = 'weekly';
  chartInstance: any;
  isInitialLoading = computed(() => !this.expenseService.hasInitiallyLoaded() || this.expenseService.isLoading());
  isMasked = signal(false);

  private chartCanvasRef!: ElementRef;

  @ViewChild('chartCanvas') set chartCanvas(el: ElementRef | undefined) {
    if (el) {
      this.chartCanvasRef = el;
      // Analytics hidden for now
      // if (!this.chartInstance) {
      //   setTimeout(() => {
      //     this.initChart();
      //   });
      // }
    } else {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
    }
  }

  thisMonthTotal = computed(() => {
    const month = this.expenseService.activeMonth();
    return this.expenseService
      .expenses()
      .filter((e) => e.date.startsWith(month))
      .reduce((sum, e) => sum + e.amount, 0);
  });

  salary = computed(() => this.authService.userProfile().salary || 0);

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

  gaugeColor = computed(() => {
    const p = this.percentage();
    if (p < 0.25) return '#3b82f6'; // blue
    if (p < 0.50) return '#22c55e'; // green
    if (p < 0.80) return '#eab308'; // yellow
    return '#ef4444'; // red
  });

  gaugeOffset = computed(() => {
    const p = this.percentage();
    return 125.66 * (1 - p);
  });

  recentExpenses = computed(() => {
    return this.expenseService.expenses()
      .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
      .slice(0, 5);
  });

  combinedUpcomingPayments = computed(() => {
    const today = new Date().getDate();
    
    const subs = this.subscriptionService.upcomingSubscriptions().map(s => {
      let diff = s.billing_day - today;
      if (diff < -15) {
         const d = new Date();
         const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
         diff = (daysInMonth - today) + s.billing_day;
      }
      return {
        id: 'sub_' + s.id,
        type: 'sub' as const,
        title: s.title,
        amount: s.amount,
        dueDay: s.billing_day,
        diff: diff,
        original: s
      };
    });

    const activeMonth = this.expenseService.activeMonth();
    const thisMonthGoalExpenses = this.expenseService.expenses().filter(e => 
      e.category === 'virtual-invest' && e.date.startsWith(activeMonth)
    );

    const goals = this.goalService.goals()
      .filter(g => g.calculated_installment > 0)
      .filter(g => {
        const hasPaid = thisMonthGoalExpenses.some(e => {
          const goalName = e.title.startsWith('Goal: ') ? e.title.replace('Goal: ', '') : e.title;
          return goalName === g.name;
        });
        return !hasPaid;
      })
      .map(g => {
      let diff = g.installment_date - today;
      if (diff < 0) {
         const d = new Date();
         const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
         diff = (daysInMonth - today) + g.installment_date;
      }
      return {
        id: 'goal_' + g.id,
        type: 'goal' as const,
        title: g.name,
        amount: g.calculated_installment,
        dueDay: g.installment_date,
        diff: diff,
        original: g
      };
    });

    return [...subs, ...goals]
      .filter(p => p.diff >= -15 && p.diff <= 31) // Keep reasonable range of upcoming/overdue
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 5);
  });

  getOrdinalSuffix(i: number): string {
    const j = i % 10,
          k = i % 100;
    if (j == 1 && k != 11) { return "st"; }
    if (j == 2 && k != 12) { return "nd"; }
    if (j == 3 && k != 13) { return "rd"; }
    return "th";
  }

  getCardColor(index: number, type: 'sub' | 'goal'): string {
    const colors = [
      'bg-[#B2F5EA]', // Teal-100/Cyan-100ish
      'bg-[#FEEBC8]', // Orange-100ish
      'bg-[#FED7E2]', // Pink-100ish
      'bg-[#E9D8FD]', // Purple-100ish
      'bg-[#FEFCBF]', // Yellow-100ish
      'bg-[#C6F6D5]'  // Green-100ish
    ];
    // Use an offset so goals and subs have varied colors
    const offset = type === 'goal' ? 3 : 0;
    return colors[(index + offset) % colors.length];
  }

  getGoalIconPath(iconPath: string): string {
    const defaultPremiumPath = 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5';
    if (!iconPath || iconPath.startsWith('M20 12v10H4V12') || iconPath.startsWith('M2.25 18L9 11.25')) {
      return defaultPremiumPath;
    }
    return iconPath;
  }

  getCategoryColor(category: string): string {
    if (!category) return 'border-black';
    if (category === 'virtual-invest') {
      return 'border-amber-500';
    } else if (category.includes('(Group Split)')) {
      return 'border-teal-500';
    } else if (category.includes('(Split)')) {
      return 'border-blue-600';
    } else if (category.includes('(Subscription)')) {
      return 'border-pink-500';
    }
    return 'border-black';
  }

  constructor() {
    effect(() => {
      // Whenever expenses change, update chart if initialized
      const _ = this.expenseService.expenses(); // track dependency
      if (!this.isInitialLoading()) {
        this.updateChartData();
      }
    });
  }

  ngOnInit() {
    this.isMasked.set(this.authService.userProfile().maskValues);
  }

  ngAfterViewInit() {
  }

  ngOnDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }



  toggleMask() {
    if (this.authService.userProfile().maskValues) {
      this.isMasked.update((v) => !v);
    }
  }

  openAddExpense() {
    this.expenseService.openBottomSheet();
  }

  setChartType(type: 'weekly' | 'monthly') {
    this.chartType = type;
    this.updateChartData();
  }

  private initChart() {
    if (!this.chartCanvasRef) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.chartCanvasRef.nativeElement.getContext('2d');

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: this.getChartData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: '#000000',
            titleFont: {
              family: 'sans-serif',
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              family: 'sans-serif',
              size: 14,
              weight: 'bold',
            },
            padding: 12,
            cornerRadius: 0,
            displayColors: false,
            callbacks: {
              label: function (context: any) {
                return '₹' + context.parsed.y;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              font: {
                family: 'sans-serif',
                weight: 'bold',
                size: 10,
              },
              color: '#000000',
            },
            border: {
              display: true,
              color: '#000000',
              width: 2,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: '#f3f4f6',
              drawTicks: false,
            },
            ticks: {
              maxTicksLimit: 5,
              font: {
                family: 'sans-serif',
                weight: 'bold',
                size: 10,
              },
              color: '#6b7280',
              callback: function (value: any) {
                return '₹' + value;
              },
            },
            border: {
              display: false,
            },
          },
        },
      },
    });
  }

  private updateChartData() {
    if (this.chartInstance) {
      this.chartInstance.data = this.getChartData();
      this.chartInstance.update();
    }
  }

  private getChartData() {
    const expenses = this.expenseService.expenses();

    if (this.chartType === 'weekly') {
      // Very basic grouping by day of week for current month
      const days = [0, 0, 0, 0, 0, 0, 0];
      expenses.forEach((e) => {
        const d = new Date(e.date);
        let day = d.getDay() - 1;
        if (day === -1) day = 6; // Sunday
        days[day] += e.amount;
      });
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Expenses',
            data: days,
            backgroundColor: '#000000',
            borderWidth: 2,
            borderColor: '#000000',
            borderRadius: 0,
            borderSkipped: false,
          },
        ],
      };
    } else {
      // Grouping by week of month
      const weeks = [0, 0, 0, 0];
      expenses.forEach((e) => {
        const d = new Date(e.date);
        const week = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
        weeks[week] += e.amount;
      });
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4+'],
        datasets: [
          {
            label: 'Expenses',
            data: weeks,
            backgroundColor: '#000000',
            borderWidth: 2,
            borderColor: '#000000',
            borderRadius: 0,
            borderSkipped: false,
          },
        ],
      };
    }
  }

  async editExpense(expense: Expense) {
    if (expense.category === 'virtual-invest') {
      const goalName = expense.title.startsWith('Goal: ') ? expense.title.replace('Goal: ', '') : expense.title;
      const goal = this.goalService.goals().find(g => g.name === goalName);
      if (goal) {
        this.goalService.openAddFundsSheet(goal, expense);
      } else {
        this.toastService.showError('Goal not found.');
      }
      return;
    }

    if (expense.category.includes('(Subscription)')) {
      const sub = this.subscriptionService.subscriptions().find(s => s.title === expense.title);
      if (sub) {
        this.subscriptionService.openBottomSheet(sub);
      } else {
        this.toastService.showError('Subscription not found.');
      }
      return;
    }

    if (expense.id.startsWith('split_')) {
      const splitId = expense.id.replace('split_', '');
      const existingSplit = this.splitService.splits().find(s => s.id === splitId);
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
          this.toastService.showError('Could not load split expense.');
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
        }
      });
    } else if (payment.type === 'goal') {
      this.goalService.openAddFundsSheet(payment.original);
    }
  }
}
