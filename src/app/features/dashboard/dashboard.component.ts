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
import { ExpenseService } from '../../core/services/expense.service';
import { AuthService } from '../../core/services/auth.service';

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
        <div class="bg-black text-white p-6 border-2 border-black rounded-none relative h-[120px]">
          <div class="flex flex-col gap-3 relative z-10 mt-1">
            <div class="h-3 bg-gray-800 w-24 animate-pulse"></div>
            <div class="h-10 bg-gray-800 w-32 animate-pulse mt-1"></div>
          </div>
        </div>
        <!-- Chart Section Shimmer -->
        <div class="bg-white border-2 border-black rounded-none p-5 flex flex-col gap-6 h-[340px]">
          <div class="flex justify-between items-center">
            <div class="h-6 bg-gray-200 w-24 animate-pulse"></div>
            <div class="h-8 bg-gray-200 w-32 animate-pulse"></div>
          </div>
          <div class="flex-1 bg-gray-100 animate-pulse w-full"></div>
        </div>
        <!-- Recent Transactions Shimmer -->
        <div class="flex flex-col gap-3 mt-2">
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
        <!-- Chart Section -->
        <div class="bg-white border-2 border-black rounded-none p-5">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold">Analytics</h3>
            <!-- Toggle -->
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
        <!-- Recent Transactions -->
        <div class="flex flex-col gap-3 mt-2">
          <div class="flex justify-between items-end mb-1">
            <h3 class="text-lg font-bold">Recent Transactions</h3>
          </div>
          <div class="flex flex-col gap-2">
            @for (expense of recentExpenses(); track expense.id) {
              <div
                class="w-full bg-gray-200 rounded-none p-3 flex justify-between items-center text-left border-l-4"
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
              </div>
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

  chartType: 'weekly' | 'monthly' = 'weekly';
  chartInstance: any;
  isInitialLoading = computed(() => !this.expenseService.hasInitiallyLoaded() || this.expenseService.isLoading());
  isMasked = signal(false);

  private chartCanvasRef!: ElementRef;

  @ViewChild('chartCanvas') set chartCanvas(el: ElementRef | undefined) {
    if (el) {
      this.chartCanvasRef = el;
      if (!this.chartInstance) {
        setTimeout(() => {
          this.initChart();
        });
      }
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

  getCategoryColor(category: string): string {
    if (!category) return 'border-black';
    if (category.includes('(Group Split)')) {
      return 'border-purple-600';
    } else if (category.includes('(Split)')) {
      return 'border-blue-600';
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
}
