import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ReportService,
  DateRangePreset,
  ReportExpense,
  MonthlySummary,
} from '../../core/services/report.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="h-full flex flex-col relative w-full bg-white overflow-y-auto">
      <!-- Filters Header -->
      <div class="bg-white p-4 border-b-2 border-black sticky top-0 z-10 flex flex-col gap-4">
        <!-- Date Presets Scrollable -->
        <div class="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          @for (preset of presets; track preset) {
            <button
              (click)="reportService.fetchReports(preset)"
              class="whitespace-nowrap px-4 py-2 text-sm font-black border-2 border-black rounded-xl transition-all active:scale-[0.98]"
              [ngClass]="{
                'bg-black text-white shadow-[3px_3px_0px_0px_rgba(236,72,153,1)]': reportService.activePreset() === preset,
                'bg-white text-black hover:bg-gray-50 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]': reportService.activePreset() !== preset,
              }"
            >
              {{ preset }}
            </button>
          }
        </div>

        <!-- Type Toggles -->
        <div class="flex flex-wrap gap-4">
          <label class="flex items-center gap-2 text-xs font-black text-black cursor-pointer">
            <input
              type="checkbox"
              [checked]="reportService.showGoals()"
              (change)="reportService.toggleGoalFilter()"
              class="text-black bg-white border-2 border-black focus:ring-black focus:ring-offset-0 w-4 h-4 rounded"
            />
            Include Goals
          </label>
          <label class="flex items-center gap-2 text-xs font-black text-black cursor-pointer">
            <input
              type="checkbox"
              [checked]="reportService.showSubscriptions()"
              (change)="reportService.toggleSubscriptionFilter()"
              class="text-black bg-white border-2 border-black focus:ring-black focus:ring-offset-0 w-4 h-4 rounded"
            />
            Include Subs
          </label>
          <label class="flex items-center gap-2 text-xs font-black text-black cursor-pointer">
            <input
              type="checkbox"
              [checked]="reportService.showSplits()"
              (change)="reportService.toggleSplitFilter()"
              class="text-black bg-white border-2 border-black focus:ring-black focus:ring-offset-0 w-4 h-4 rounded"
            />
            Include Splits
          </label>
        </div>
      </div>

      <div class="p-4 flex flex-col gap-6 pb-24">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white border-2 border-black p-4 rounded-2xl flex flex-col gap-1 shadow-[4px_4px_0px_0px_rgba(244,63,94,1)]">
            <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Total Spent</span>
            <span class="text-xl font-black text-black">{{ totalSpent | currency: 'INR' : 'symbol' : '1.0-0' }}</span>
          </div>
          <div class="bg-white border-2 border-black p-4 rounded-2xl flex flex-col gap-1 shadow-[4px_4px_0px_0px_rgba(59,130,246,1)]">
            <span class="text-[10px] font-black text-gray-500 uppercase tracking-widest">Daily Avg</span>
            <span class="text-xl font-black text-black">{{ dailyAverage | currency: 'INR' : 'symbol' : '1.0-0' }}</span>
          </div>
        </div>

        @if (reportService.isLoading()) {
          <div class="flex flex-col gap-6">
            <div class="bg-gray-100 h-64 w-full animate-pulse rounded-2xl p-4 flex flex-col items-center justify-center border-2 border-gray-200">
              <div class="w-40 h-40 rounded-full border-8 border-gray-200"></div>
            </div>
            <div class="bg-gray-100 h-64 w-full animate-pulse rounded-2xl p-4 flex flex-col justify-end gap-2 border-2 border-gray-200">
              <div class="flex justify-between items-end h-32 w-full px-4">
                <div class="w-8 bg-gray-200 h-24 rounded-t"></div>
                <div class="w-8 bg-gray-200 h-16 rounded-t"></div>
                <div class="w-8 bg-gray-200 h-32 rounded-t"></div>
                <div class="w-8 bg-gray-200 h-12 rounded-t"></div>
                <div class="w-8 bg-gray-200 h-20 rounded-t"></div>
              </div>
            </div>
          </div>
        } @else if (
          reportService.expenses().length === 0 &&
          (!reportService.isLongTerm() || reportService.monthlySummaries().length === 0)
        ) {
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center mt-8 h-[300px]">
            <div class="w-32 h-32 bg-gray-50 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-6">
              <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p class="text-black font-extrabold text-xl">No data available</p>
            <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
              Try changing the date range or toggling filters to see your reports.
            </p>
          </div>
        } @else {
          <!-- Category Doughnut Chart -->
          <div class="bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 class="text-sm font-black text-black uppercase tracking-widest mb-4 pb-2 border-b-2 border-black">
              Category Breakdown
            </h2>
            <div class="relative h-64 w-full">
              <canvas #categoryChart></canvas>
            </div>
          </div>

          <!-- Trend Bar Chart -->
          <div class="bg-white border-2 border-black p-4 rounded-2xl mt-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 class="text-sm font-black text-black uppercase tracking-widest mb-4 pb-2 border-b-2 border-black">
              Spending Trend
            </h2>
            <div class="relative h-64 w-full">
              <canvas #trendChart></canvas>
            </div>
          </div>

          <!-- Top Spends List -->
          <div class="mt-6">
            <h2 class="text-xs font-black text-black uppercase tracking-widest mb-3 px-1">
              Top Transactions
            </h2>
            <div class="flex flex-col gap-3">
              @for (expense of topExpenses; track expense.id) {
                <div class="w-full bg-white border-2 border-black rounded-2xl p-4 flex justify-between items-center text-left shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <div class="flex flex-col gap-1 flex-1 min-w-0 pr-4">
                    <span class="font-extrabold text-base text-gray-900 truncate">{{ expense.title }}</span>
                    <div class="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-0">
                      <span class="truncate">{{ expense.category }}</span>
                      <span class="flex-shrink-0 border-l-2 border-gray-300 h-3"></span>
                      <span class="whitespace-nowrap flex-shrink-0">{{ expense.date | date: 'MMM d' }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2 flex-shrink-0">
                    <span class="font-black text-lg text-black">
                      ₹{{ expense.amount | number: '1.0-0' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [
    `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export class ReportsComponent implements OnInit, OnDestroy {
  reportService = inject(ReportService);

  @ViewChild('categoryChart') categoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendCanvas!: ElementRef<HTMLCanvasElement>;

  private catChartInstance: Chart | null = null;
  private trendChartInstance: Chart | null = null;

  presets: DateRangePreset[] = [
    'This Month',
    'Last Month',
    'Last 3 Months',
    'This Year',
    'All Time',
  ];

  totalSpent = 0;
  dailyAverage = 0;
  topExpenses: ReportExpense[] = [];

  constructor() {
    effect(() => {
      const isLongTerm = this.reportService.isLongTerm();
      const expenses = this.reportService.expenses();
      const summaries = this.reportService.monthlySummaries();
      const isLoading = this.reportService.isLoading();

      if (!isLoading) {
        if (isLongTerm) {
          if (summaries.length > 0 || expenses.length > 0) {
            this.calculateInsightsLongTerm(summaries, expenses);
            setTimeout(() => {
              this.renderCategoryChartLongTerm(summaries);
              this.renderTrendChartLongTerm(summaries);
            }, 0);
          }
        } else {
          if (expenses.length > 0) {
            this.calculateInsights(expenses);
            setTimeout(() => {
              this.renderCategoryChart(expenses);
              this.renderTrendChart(expenses);
            }, 0);
          }
        }
      }
    });
  }

  ngOnInit() {
    this.reportService.fetchReports(this.reportService.activePreset());
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  private destroyCharts() {
    if (this.catChartInstance) this.catChartInstance.destroy();
    if (this.trendChartInstance) this.trendChartInstance.destroy();
  }

  getCategoryColor(category: string): string {
    if (!category) return 'border-black';
    if (category === 'virtual-invest') {
      return 'border-goals-primary';
    } else if (category.includes('(Group Split)') || category.includes('(Split)')) {
      return 'border-splits-primary';
    } else if (category.includes('(Subscription)')) {
      return 'border-subscriptions-primary';
    }
    return 'border-expense-primary';
  }

  getCategoryColorHEX(category: string, index: number): string {
    if (category === 'virtual-invest') return '#f26a8d'; // Goals

    if (category.includes('(Group Split)') || category.includes('(Split)')) {
      const splits = ['#629900', '#4d7a00', '#7ac200', '#a8e046', '#3f6200'];
      return splits[index % splits.length];
    }

    if (category.includes('(Subscription)')) {
      const subs = ['#8B5CF6', '#7C3AED', '#6D28D9', '#A78BFA', '#5B21B6'];
      return subs[index % subs.length];
    }

    const expenses = ['#3B82F6', '#2563EB', '#1D4ED8', '#60A5FA', '#1E40AF', '#93C5FD'];
    return expenses[index % expenses.length];
  }

  private calculateDailyAverageFromTotal(total: number) {
    const { startDate, endDate } = this.reportService.getDateRangeForPreset(
      this.reportService.activePreset(),
    );
    const start = new Date(startDate);
    const end = new Date(endDate);

    let diffTime = end.getTime() - start.getTime();
    if (this.reportService.activePreset() === 'All Time') {
      diffTime = new Date().getTime() - new Date(2023, 0, 1).getTime();
    }

    const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    this.dailyAverage = total / diffDays;
  }

  private calculateInsights(expenses: ReportExpense[]) {
    this.totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const sortedByAmount = [...expenses].sort((a, b) => b.amount - a.amount);
    this.topExpenses = sortedByAmount.slice(0, 5);

    const { startDate, endDate } = this.reportService.getDateRangeForPreset(
      this.reportService.activePreset(),
    );
    const start = new Date(startDate);
    const end = new Date(endDate);

    let diffTime = end.getTime() - start.getTime();
    if (this.reportService.activePreset() === 'All Time' && expenses.length > 0) {
      const firstExpDate = new Date(expenses[expenses.length - 1].date);
      diffTime = new Date().getTime() - firstExpDate.getTime();
    }

    const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    this.dailyAverage = this.totalSpent / diffDays;
  }

  private calculateInsightsLongTerm(summaries: MonthlySummary[], expenses: ReportExpense[]) {
    const showGoals = this.reportService.showGoals();
    const showSubs = this.reportService.showSubscriptions();
    const showSplits = this.reportService.showSplits();

    this.totalSpent = summaries.reduce((sum, m) => {
      let t = m.regular_expenses_total;
      if (showGoals) t += m.goal_expenses_total;
      if (showSubs) t += m.subscription_expenses_total;
      if (showSplits) t += m.split_expenses_total;
      return sum + t;
    }, 0);

    this.calculateDailyAverageFromTotal(this.totalSpent);
    this.topExpenses = expenses;
  }

  private renderCategoryChart(expenses: ReportExpense[]) {
    if (!this.categoryCanvas) return;

    const ctx = this.categoryCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.catChartInstance) this.catChartInstance.destroy();

    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    const labels: string[] = [];
    const data: number[] = [];
    let othersTotal = 0;

    sortedEntries.forEach((entry, index) => {
      if (index < 5) {
        labels.push(entry[0]);
        data.push(entry[1]);
      } else {
        othersTotal += entry[1];
      }
    });

    if (othersTotal > 0) {
      labels.push('Others');
      data.push(othersTotal);
    }

    const backgroundColors = labels.map((label, idx) => {
      if (label === 'Others') return '#999999';
      return this.getCategoryColorHEX(label, idx);
    });

    this.catChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { family: 'Inter, sans-serif', weight: 'bold', size: 10 },
              color: '#000',
            },
          },
        },
        cutout: '65%',
      },
    });
  }

  private renderCategoryChartLongTerm(summaries: MonthlySummary[]) {
    if (!this.categoryCanvas) return;

    const ctx = this.categoryCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.catChartInstance) this.catChartInstance.destroy();

    const showGoals = this.reportService.showGoals();
    const showSubs = this.reportService.showSubscriptions();
    const showSplits = this.reportService.showSplits();

    const categoryTotals: Record<string, number> = {};

    summaries.forEach((m) => {
      if (!m.breakdown_by_source) return;

      const applySource = (sourceKey: string) => {
        const catMap = m.breakdown_by_source[sourceKey];
        if (catMap) {
          Object.entries(catMap).forEach(([cat, val]) => {
            categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
          });
        }
      };

      applySource('expense');
      if (showGoals) applySource('goal');
      if (showSubs) applySource('subscription');
      if (showSplits) applySource('split');
    });

    const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const labels: string[] = [];
    const data: number[] = [];
    let othersTotal = 0;

    sortedEntries.forEach((entry, index) => {
      if (index < 5) {
        labels.push(entry[0]);
        data.push(entry[1]);
      } else {
        othersTotal += entry[1];
      }
    });

    if (othersTotal > 0) {
      labels.push('Others');
      data.push(othersTotal);
    }

    const backgroundColors = labels.map((label, idx) => {
      if (label === 'Others') return '#999999';
      return this.getCategoryColorHEX(label, idx);
    });

    this.catChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: backgroundColors,
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { weight: 'bold', size: 10 }, color: '#000' },
          },
        },
        cutout: '65%',
      },
    });
  }

  private renderTrendChart(expenses: ReportExpense[]) {
    if (!this.trendCanvas) return;

    const ctx = this.trendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.trendChartInstance) this.trendChartInstance.destroy();

    const preset = this.reportService.activePreset();
    const groupBy = preset === 'This Month' || preset === 'Last Month' ? 'day' : 'month';

    const trends: Record<string, number> = {};

    expenses.forEach((e) => {
      const dateStr = e.date.split('T')[0];
      const key = groupBy === 'day' ? dateStr.substring(8, 10) : dateStr.substring(0, 7);
      trends[key] = (trends[key] || 0) + e.amount;
    });

    const sortedKeys = Object.keys(trends).sort();
    const labels = sortedKeys.map((k) => {
      if (groupBy === 'day') return k;
      const date = new Date(k + '-01');
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });
    const data = sortedKeys.map((k) => trends[k]);

    this.trendChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Spent',
            data,
            backgroundColor: '#EC4899',
            borderWidth: 2,
            borderColor: '#EC4899',
            borderRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { weight: 'bold', size: 10 },
              color: '#666',
            },
          },
          y: {
            grid: { color: '#f3f4f6' },
            beginAtZero: true,
            ticks: {
              font: { weight: 'bold', size: 10 },
              color: '#666',
              maxTicksLimit: 5,
              callback: (value) => '₹' + value,
            },
          },
        },
      },
    });
  }

  private renderTrendChartLongTerm(summaries: MonthlySummary[]) {
    if (!this.trendCanvas) return;

    const ctx = this.trendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.trendChartInstance) this.trendChartInstance.destroy();

    const trends: Record<string, number> = {};
    const showGoals = this.reportService.showGoals();
    const showSubs = this.reportService.showSubscriptions();
    const showSplits = this.reportService.showSplits();

    summaries.forEach((m) => {
      let t = m.regular_expenses_total;
      if (showGoals) t += m.goal_expenses_total;
      if (showSubs) t += m.subscription_expenses_total;
      if (showSplits) t += m.split_expenses_total;
      trends[m.month] = (trends[m.month] || 0) + t;
    });

    const sortedKeys = Object.keys(trends).sort();
    const labels = sortedKeys.map((k) => {
      const date = new Date(k + '-01');
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });
    const data = sortedKeys.map((k) => trends[k]);

    this.trendChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Spent',
            data,
            backgroundColor: '#EC4899',
            borderWidth: 2,
            borderColor: '#EC4899',
            borderRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { weight: 'bold', size: 10 }, color: '#666' },
          },
          y: {
            grid: { color: '#f3f4f6' },
            beginAtZero: true,
            ticks: {
              font: { weight: 'bold', size: 10 },
              color: '#666',
              maxTicksLimit: 5,
              callback: (value) => '₹' + value,
            },
          },
        },
      },
    });
  }
}
