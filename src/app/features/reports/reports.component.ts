import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReportService, DateRangePreset, ReportExpense } from '../../core/services/report.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="h-full flex flex-col relative w-full bg-gray-50 overflow-y-auto">
      <!-- Filters Header -->
      <div class="bg-white p-4 border-b-2 border-black sticky top-0 z-10 shadow-sm flex flex-col gap-4">
        <!-- Date Presets Scrollable -->
        <div class="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
          @for (preset of presets; track preset) {
            <button
              (click)="reportService.fetchReports(preset)"
              class="whitespace-nowrap px-4 py-2 text-sm font-bold border-2 rounded-none transition-colors"
              [ngClass]="{
                'bg-black text-white border-black': reportService.activePreset() === preset,
                'bg-white text-gray-700 border-gray-300 hover:border-black': reportService.activePreset() !== preset
              }"
            >
              {{ preset }}
            </button>
          }
        </div>
        
        <!-- Type Toggles -->
        <div class="flex flex-wrap gap-3">
          <label class="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
            <input type="checkbox" [checked]="reportService.showGoals()" (change)="reportService.toggleGoalFilter()" class="accent-black w-4 h-4 border-2 border-black rounded-none">
            Include Goals
          </label>
          <label class="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
            <input type="checkbox" [checked]="reportService.showSubscriptions()" (change)="reportService.toggleSubscriptionFilter()" class="accent-black w-4 h-4 border-2 border-black rounded-none">
            Include Subs
          </label>
          <label class="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
            <input type="checkbox" [checked]="reportService.showSplits()" (change)="reportService.toggleSplitFilter()" class="accent-black w-4 h-4 border-2 border-black rounded-none">
            Include Splits
          </label>
        </div>
      </div>

      <div class="p-4 flex flex-col gap-6 pb-24">
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white p-4 border-2 border-black rounded-none flex flex-col gap-1">
            <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Total Spent</span>
            <span class="text-xl font-black">{{ totalSpent | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
          <div class="bg-white p-4 border-2 border-black rounded-none flex flex-col gap-1">
            <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Daily Avg</span>
            <span class="text-xl font-black">{{ dailyAverage | currency:'INR':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        @if (reportService.isLoading()) {
          <div class="flex flex-col gap-6">
            <div class="bg-gray-200 h-64 w-full animate-pulse rounded-none p-4 flex flex-col items-center justify-center">
              <div class="w-40 h-40 rounded-full border-8 border-gray-300"></div>
            </div>
            <div class="bg-gray-200 h-64 w-full animate-pulse rounded-none p-4 flex flex-col justify-end gap-2">
              <div class="flex justify-between items-end h-32 w-full px-4">
                <div class="w-8 bg-gray-300 h-24"></div>
                <div class="w-8 bg-gray-300 h-16"></div>
                <div class="w-8 bg-gray-300 h-32"></div>
                <div class="w-8 bg-gray-300 h-12"></div>
                <div class="w-8 bg-gray-300 h-20"></div>
              </div>
            </div>
            <div class="flex flex-col gap-1.5 mt-2">
              @for (i of [1, 2, 3]; track i) {
                <div class="w-full bg-gray-200 rounded-none p-3 h-20 animate-pulse flex justify-between items-center">
                  <div class="flex flex-col gap-2 w-1/2">
                    <div class="h-4 bg-gray-300 w-3/4"></div>
                    <div class="h-3 bg-gray-300 w-1/2"></div>
                  </div>
                  <div class="h-6 bg-gray-300 w-16"></div>
                </div>
              }
            </div>
          </div>
        } @else if (reportService.expenses().length === 0) {
          <div class="flex-1 flex flex-col items-center justify-center p-8 text-center mt-8">
            <div
              class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6"
            >
              <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p class="text-gray-500 font-extrabold text-xl">No data available</p>
            <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
              Try changing the date range or toggling filters to see your reports.
            </p>
          </div>
        } @else {
          <!-- Category Doughnut Chart -->
          <div class="bg-white p-4 border-2 border-black rounded-none">
            <h2 class="text-sm font-extrabold text-black uppercase tracking-wider mb-4 border-b-2 border-black pb-2">Category Breakdown</h2>
            <div class="relative h-64 w-full">
              <canvas #categoryChart></canvas>
            </div>
          </div>

          <!-- Trend Bar Chart -->
          <div class="bg-white p-4 border-2 border-black rounded-none">
            <h2 class="text-sm font-extrabold text-black uppercase tracking-wider mb-4 border-b-2 border-black pb-2">Spending Trend</h2>
            <div class="relative h-64 w-full">
              <canvas #trendChart></canvas>
            </div>
          </div>

          <!-- Top Spends List -->
          <div>
            <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Top Transactions</h2>
            <div class="flex flex-col gap-1.5">
              @for (expense of topExpenses; track expense.id) {
                <div
                  class="w-full bg-gray-200 rounded-none p-3 flex justify-between items-center text-left border-l-4"
                  [ngClass]="getCategoryColor(expense.category)"
                >
                  <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                    <span class="font-extrabold text-lg text-black truncate">{{ expense.title }}</span>
                    <div
                      class="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest min-w-0"
                    >
                      <span class="truncate">{{ expense.category }}</span>
                      <span class="flex-shrink-0">•</span>
                      <span class="whitespace-nowrap flex-shrink-0">{{ expense.date | date: 'MMM d, h:mm a' }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2 flex-shrink-0">
                    <span class="font-extrabold text-xl"
                      >₹{{ expense.amount | number: '1.2-2' }}</span
                    >
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class ReportsComponent implements OnInit, OnDestroy {
  reportService = inject(ReportService);

  @ViewChild('categoryChart') categoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendCanvas!: ElementRef<HTMLCanvasElement>;

  private catChartInstance: Chart | null = null;
  private trendChartInstance: Chart | null = null;

  presets: DateRangePreset[] = ['This Month', 'Last Month', 'Last 3 Months', 'This Year', 'All Time'];

  totalSpent = 0;
  dailyAverage = 0;
  topExpenses: ReportExpense[] = [];

  constructor() {
    // Re-render charts when data changes
    effect(() => {
      const expenses = this.reportService.expenses();
      const isLoading = this.reportService.isLoading();
      
      if (!isLoading && expenses.length > 0) {
        this.calculateInsights(expenses);
        
        // Wait a tick for the canvas elements to be rendered in the DOM by @if
        setTimeout(() => {
          this.renderCategoryChart(expenses);
          this.renderTrendChart(expenses);
        }, 0);
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

  getCategoryColorHEX(category: string, index: number): string {
    if (category === 'virtual-invest') return '#f59e0b';
    if (category.includes('(Group Split)')) return '#14b8a6';
    if (category.includes('(Split)')) return '#2563eb';
    if (category.includes('(Subscription)')) return '#ec4899';
    
    // Default palette for regular expenses
    const palette = ['#000000', '#FF3366', '#33CC99', '#3366FF', '#FF9900', '#999999'];
    return palette[index % palette.length];
  }

  private calculateInsights(expenses: ReportExpense[]) {
    this.totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Sort by amount descending to get top 5
    const sortedByAmount = [...expenses].sort((a, b) => b.amount - a.amount);
    this.topExpenses = sortedByAmount.slice(0, 5);

    // Calculate daily average based on range
    const { startDate, endDate } = this.reportService.getDateRangeForPreset(this.reportService.activePreset());
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // If "All Time", we use the date of the first expense to now
    let diffTime = end.getTime() - start.getTime();
    if (this.reportService.activePreset() === 'All Time' && expenses.length > 0) {
      const firstExpDate = new Date(expenses[expenses.length - 1].date);
      diffTime = new Date().getTime() - firstExpDate.getTime();
    }
    
    const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
    this.dailyAverage = this.totalSpent / diffDays;
  }

  private renderCategoryChart(expenses: ReportExpense[]) {
    if (!this.categoryCanvas) return;
    
    const ctx = this.categoryCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.catChartInstance) this.catChartInstance.destroy();

    // Group by category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    // Sort by total descending
    const sortedEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    
    // Top 5 and Others
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
        datasets: [{
          data,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: { family: 'Inter, sans-serif', weight: 'bold', size: 10 },
              color: '#000'
            }
          }
        },
        cutout: '65%'
      }
    });
  }

  private renderTrendChart(expenses: ReportExpense[]) {
    if (!this.trendCanvas) return;
    
    const ctx = this.trendCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.trendChartInstance) this.trendChartInstance.destroy();

    // Group by month (YYYY-MM) or Day (YYYY-MM-DD) depending on range
    const preset = this.reportService.activePreset();
    const groupBy = (preset === 'This Month' || preset === 'Last Month') ? 'day' : 'month';

    const trends: Record<string, number> = {};
    
    expenses.forEach(e => {
      // e.date is ISO string or YYYY-MM-DD
      const dateStr = e.date.split('T')[0];
      const key = groupBy === 'day' ? dateStr.substring(8, 10) : dateStr.substring(0, 7); // '15' or '2026-06'
      trends[key] = (trends[key] || 0) + e.amount;
    });

    // Sort chronologically
    const sortedKeys = Object.keys(trends).sort();
    const labels = sortedKeys.map(k => {
      if (groupBy === 'day') return k; // day number
      // Format '2026-06' to 'Jun 26'
      const date = new Date(k + '-01');
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });
    const data = sortedKeys.map(k => trends[k]);

    this.trendChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Spent',
          data,
          backgroundColor: '#000000',
          borderWidth: 2,
          borderColor: '#000000',
          borderRadius: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Inter, sans-serif', weight: 'bold', size: 10 },
              color: '#666'
            }
          },
          y: {
            grid: { color: '#f3f4f6' },
            beginAtZero: true,
            ticks: {
              font: { family: 'Inter, sans-serif', weight: 'bold', size: 10 },
              color: '#666',
              maxTicksLimit: 5,
              callback: (value) => '₹' + value
            }
          }
        }
      }
    });
  }
}
