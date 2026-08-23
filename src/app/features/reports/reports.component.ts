import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  effect,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import {
  ReportService,
  DateRangePreset,
  ReportExpense,
  MonthlySummary,
} from '../../core/services/report.service';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full flex flex-col relative w-full bg-[#FAFAFA]">
      
      <!-- Header & Tab Section -->
      <div class="flex-none bg-[#FAFAFA] px-6 pt-6 pb-4 z-10">
        <!-- Top Bar (Tabs & Download) -->
        <div class="flex items-center gap-3 mb-6">
          <div class="flex-1 flex p-1 bg-gray-100 rounded-[20px]">
            <button 
              (click)="switchTab('insights')"
              [class.bg-white]="activeTab === 'insights'"
              [class.shadow-sm]="activeTab === 'insights'"
              [class.text-gray-900]="activeTab === 'insights'"
              [class.text-gray-500]="activeTab !== 'insights'"
              class="flex-1 py-2.5 px-4 rounded-[16px] text-sm font-semibold transition-all duration-200">
              Overview
            </button>
            <button 
              (click)="switchTab('charts')"
              [class.bg-white]="activeTab === 'charts'"
              [class.shadow-sm]="activeTab === 'charts'"
              [class.text-gray-900]="activeTab === 'charts'"
              [class.text-gray-500]="activeTab !== 'charts'"
              class="flex-1 py-2.5 px-4 rounded-[16px] text-sm font-semibold transition-all duration-200">
              Analytics
            </button>
          </div>
          <button 
            (click)="downloadPDF()"
            [disabled]="isDownloading || reportService.isLoading()"
            class="flex-none flex items-center justify-center w-11 h-11 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 text-reports-primary hover:bg-gray-50 transition-colors disabled:opacity-50">
            <svg *ngIf="!isDownloading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <svg *ngIf="isDownloading" class="animate-spin h-5 w-5 text-reports-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          </button>
        </div>

        <!-- Month Wise Filters (Scrollable) -->
        <div class="relative mb-4 -mx-4 sm:-mx-6">
          <div class="absolute left-0 top-0 bottom-1 w-4 sm:w-6 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div class="absolute right-0 top-0 bottom-1 w-4 sm:w-6 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div class="flex gap-3 overflow-x-auto hide-scrollbar pb-1 px-4 sm:px-6 snap-x">
            <button *ngFor="let p of presets" 
              (click)="reportService.fetchReports(p)"
              class="snap-start shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors border"
              [ngClass]="reportService.activePreset() === p 
                ? 'bg-reports-primary text-white border-reports-primary' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'">
              {{ p }}
            </button>
          </div>
        </div>

        <!-- Component Level Filters (Scrollable) -->
        <div class="relative -mx-4 sm:-mx-6">
          <div class="absolute left-0 top-0 bottom-2 w-4 sm:w-6 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div class="absolute right-0 top-0 bottom-2 w-4 sm:w-6 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
          <div class="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-4 sm:px-6 snap-x">
            <!-- Expenses -->
            <button (click)="reportService.toggleExpenseFilter()"
              class="snap-start shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border"
              [ngClass]="reportService.showExpenses() ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-500 border-gray-200 opacity-60 hover:bg-gray-50'">
              <div class="w-2 h-2 rounded-full" [ngClass]="reportService.showExpenses() ? 'bg-blue-500' : 'bg-gray-300'"></div>
              Expenses
            </button>
            <!-- Subscriptions -->
            <button (click)="reportService.toggleSubscriptionFilter()"
              class="snap-start shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border"
              [ngClass]="reportService.showSubscriptions() ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-500 border-gray-200 opacity-60 hover:bg-gray-50'">
              <div class="w-2 h-2 rounded-full" [ngClass]="reportService.showSubscriptions() ? 'bg-purple-500' : 'bg-gray-300'"></div>
              Subscriptions
            </button>
            <!-- Goals -->
            <button (click)="reportService.toggleGoalFilter()"
              class="snap-start shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border"
              [ngClass]="reportService.showGoals() ? 'bg-pink-50 text-pink-700 border-pink-200' : 'bg-white text-gray-500 border-gray-200 opacity-60 hover:bg-gray-50'">
              <div class="w-2 h-2 rounded-full" [ngClass]="reportService.showGoals() ? 'bg-pink-500' : 'bg-gray-300'"></div>
              Goals
            </button>
            <!-- Splits -->
            <button (click)="reportService.toggleSplitFilter()"
              class="snap-start shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border"
              [ngClass]="reportService.showSplits() ? 'bg-lime-50 text-lime-700 border-lime-200' : 'bg-white text-gray-500 border-gray-200 opacity-60 hover:bg-gray-50'">
              <div class="w-2 h-2 rounded-full" [ngClass]="reportService.showSplits() ? 'bg-lime-500' : 'bg-gray-300'"></div>
              Splits
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="reportService.isLoading()" class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>

      <!-- Content Section -->
      <div *ngIf="!reportService.isLoading()" class="flex-1 overflow-y-auto hide-scrollbar pb-24 px-6 flex flex-col gap-6 relative">
        
        <!-- Tab 1: Insights (Overview) -->
        <div *ngIf="activeTab === 'insights'" class="animate-fade-scale flex flex-col gap-4">
          
          <!-- Total Spent Card (Hero Insight) -->
          <div class="bg-reports-primary rounded-[24px] p-6 text-white shadow-md relative overflow-hidden">
            <p class="text-white/80 font-medium text-sm mb-1 relative z-10">Total Spent</p>
            <h2 class="text-4xl font-bold tracking-tight relative z-10">{{ totalSpent | currency: 'INR' : 'symbol' : '1.0-0' }}</h2>
          </div>

          <!-- Bento Grid for other 4 insights -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Daily Avg -->
            <div class="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-center">
              <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mb-3 text-blue-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <p class="text-gray-500 font-medium text-xs">Daily Average</p>
              <p class="text-gray-900 font-bold text-lg">{{ dailyAverage | currency: 'INR' : 'symbol' : '1.0-0' }}</p>
            </div>

            <!-- Largest Spend -->
            <div class="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-center">
              <div class="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center mb-3 text-rose-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
              <p class="text-gray-500 font-medium text-xs">Largest Spend</p>
              <p class="text-gray-900 font-bold text-lg">{{ largestSpend | currency: 'INR' : 'symbol' : '1.0-0' }}</p>
            </div>
            
            <!-- Top Category -->
            <div class="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-center">
              <div class="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mb-3 text-orange-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
              </div>
              <p class="text-gray-500 font-medium text-xs">Top Category</p>
              <p class="text-gray-900 font-bold text-sm truncate">{{ highestCategory }}</p>
            </div>

            <!-- Top Payment -->
            <div class="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex flex-col justify-center">
              <div class="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center mb-3 text-emerald-500">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              </div>
              <p class="text-gray-500 font-medium text-xs">Top Payment</p>
              <p class="text-gray-900 font-bold text-sm truncate">{{ topPaymentMethod }}</p>
            </div>
          </div>
          
          <!-- Total Transactions -->
          <div class="bg-white rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
              </div>
              <div>
                <p class="text-gray-500 font-medium text-sm">Total Transactions</p>
              </div>
            </div>
            <p class="text-gray-900 font-bold text-xl">{{ totalTransactions }}</p>
          </div>

        </div>

        <!-- Tab 2: Analytics (Charts) -->
        <div *ngIf="activeTab === 'charts'" class="animate-fade-scale flex flex-col gap-6 mb-4">
          
          <!-- Spending Trend -->
          <div class="bg-reports-surface rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 class="font-bold text-reports-dark mb-4">Spending Trend</h3>
            <div class="h-48 relative w-full">
              <canvas #trendChart></canvas>
            </div>
          </div>

          <!-- Category Distribution -->
          <div class="bg-reports-surface rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 class="font-bold text-reports-dark mb-4">Category Distribution</h3>
            <div class="h-48 relative w-full">
              <canvas #categoryChart></canvas>
            </div>
          </div>

          <!-- Payment Methods -->
          <div class="bg-reports-surface rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <h3 class="font-bold text-reports-dark mb-4">Payment Methods</h3>
            <div class="h-48 relative w-full">
              <canvas #paymentChart></canvas>
            </div>
          </div>

        </div>
      </div>

      <!-- PDF Export Container (Hidden) -->
      <div #pdfContainer class="absolute -left-[9999px] top-0 w-[800px] bg-[#FAFAFA] p-8 flex flex-col" style="pointer-events: none;">
        <!-- Header -->
        <div class="border-b border-[#e5e7eb] pb-4 mb-6">
          <div class="text-3xl font-bold text-[#111827] tracking-tight m-0 leading-none">Expensio Report</div>
          <div class="text-[#6b7280] mt-3 mb-0 leading-none m-0">Generated for: {{ getActiveFiltersText() }}</div>
        </div>

        <!-- Insights -->
        <div class="flex flex-col mb-6">
          <div class="text-xl font-bold text-[#111827] mb-4 m-0 leading-none">Overview</div>
          
          <div class="bg-[#e11d48] rounded-[24px] pt-4 pb-8 px-6 text-[#ffffff] shadow-md relative overflow-hidden mb-4">
            <div class="text-[rgba(255,255,255,0.8)] font-medium text-sm mb-2 relative z-10 m-0 leading-none">Total Spent</div>
            <div class="text-4xl font-bold tracking-tight relative z-10 m-0 leading-none">{{ totalSpent | currency: 'INR' : 'symbol' : '1.0-0' }}</div>
          </div>

          <!-- 4 Insights boxes using flex wrap instead of grid -->
          <div class="flex flex-wrap w-full mb-4">
            <div class="w-[calc(50%-8px)] mr-[16px] mb-[16px] bg-[#ffffff] rounded-[24px] pt-3 pb-7 px-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex flex-col justify-center">
              <div class="text-[#6b7280] font-medium text-xs mb-2 leading-none m-0">Daily Average</div>
              <div class="text-[#111827] font-bold text-xl leading-none m-0">{{ dailyAverage | currency: 'INR' : 'symbol' : '1.0-0' }}</div>
            </div>
            <div class="w-[calc(50%-8px)] mb-[16px] bg-[#ffffff] rounded-[24px] pt-3 pb-7 px-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex flex-col justify-center">
              <div class="text-[#6b7280] font-medium text-xs mb-2 leading-none m-0">Largest Spend</div>
              <div class="text-[#111827] font-bold text-xl leading-none m-0">{{ largestSpend | currency: 'INR' : 'symbol' : '1.0-0' }}</div>
            </div>
            <div class="w-[calc(50%-8px)] mr-[16px] bg-[#ffffff] rounded-[24px] pt-3 pb-7 px-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex flex-col justify-center">
              <div class="text-[#6b7280] font-medium text-xs mb-2 leading-none m-0">Top Category</div>
              <div class="text-[#111827] font-bold text-base leading-none m-0">{{ highestCategory }}</div>
            </div>
            <div class="w-[calc(50%-8px)] bg-[#ffffff] rounded-[24px] pt-3 pb-7 px-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex flex-col justify-center">
              <div class="text-[#6b7280] font-medium text-xs mb-2 leading-none m-0">Top Payment</div>
              <div class="text-[#111827] font-bold text-base leading-none m-0">{{ topPaymentMethod }}</div>
            </div>
          </div>
          
          <div class="bg-[#ffffff] rounded-[24px] px-5 pt-2 pb-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#f3f4f6] flex items-center justify-between">
            <div class="text-[#6b7280] font-medium text-sm leading-none m-0 flex items-center">Total Transactions</div>
            <div class="text-[#111827] font-bold text-xl leading-none m-0 flex items-center">{{ totalTransactions }}</div>
          </div>
        </div>

        <!-- Charts -->
        <div class="flex flex-col mt-2">
          <div class="text-xl font-bold text-[#111827] mb-4 m-0 leading-none">Analytics</div>
          
          <!-- Spending Trend (Full Width) -->
          <div class="bg-[#fff1f2] rounded-[24px] p-5 mb-4">
            <div class="font-bold text-[#be123c] mb-3 m-0 leading-none">Spending Trend</div>
            <div class="h-48 relative w-full">
              <canvas #pdfTrendChart></canvas>
            </div>
          </div>

          <!-- Category & Payment (Side by Side) -->
          <div class="flex w-full">
            <div class="w-[calc(50%-8px)] mr-[16px] bg-[#fff1f2] rounded-[24px] p-5">
              <div class="font-bold text-[#be123c] mb-3 m-0 leading-none">Category Distribution</div>
              <div class="h-48 relative w-full">
                <canvas #pdfCategoryChart></canvas>
              </div>
            </div>

            <div class="w-[calc(50%-8px)] bg-[#fff1f2] rounded-[24px] p-5">
              <div class="font-bold text-[#be123c] mb-3 m-0 leading-none">Payment Methods</div>
              <div class="h-48 relative w-full">
                <canvas #pdfPaymentChart></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [
    `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      @keyframes fadeScaleIn {
        from {
          opacity: 0;
          transform: scale(0.96) translateY(8px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      .animate-fade-scale {
        animation: fadeScaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
    `,
  ],
})
export class ReportsComponent implements OnInit, OnDestroy {
  reportService = inject(ReportService);
  cdr = inject(ChangeDetectorRef);
  
  private _activeTab: 'insights' | 'charts' = 'insights';
  get activeTab() { return this._activeTab; }
  set activeTab(val: 'insights' | 'charts') {
    this._activeTab = val;
    if (val === 'charts') {
      setTimeout(() => this.renderAllCharts(), 50);
    }
  }

  @ViewChild('categoryChart') categoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChart') paymentCanvas!: ElementRef<HTMLCanvasElement>;

  // PDF specific view children
  @ViewChild('pdfContainer') pdfContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('pdfCategoryChart') pdfCategoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pdfTrendChart') pdfTrendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pdfPaymentChart') pdfPaymentCanvas!: ElementRef<HTMLCanvasElement>;

  private catChartInstance: Chart | null = null;
  private trendChartInstance: Chart | null = null;
  private paymentChartInstance: Chart | null = null;

  private pdfCatChartInstance: Chart | null = null;
  private pdfTrendChartInstance: Chart | null = null;
  private pdfPaymentChartInstance: Chart | null = null;

  presets: DateRangePreset[] = [
    'This Month',
    'Last Month',
    'Last 3 Months',
    'This Year',
    'All Time',
  ];

  totalSpent = 0;
  dailyAverage = 0;
  highestCategory = '';
  topPaymentMethod = '';
  totalTransactions = 0;
  largestSpend = 0;

  isDownloading = false;

  constructor() {
    Chart.register(ChartDataLabels);
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
              this.renderPaymentChartLongTerm(summaries);
              this.renderTrendChartLongTerm(summaries);
            }, 0);
          }
        } else {
          if (expenses.length > 0) {
            this.calculateInsights(expenses);
            setTimeout(() => {
              this.renderCategoryChart(expenses);
              this.renderPaymentChart(expenses);
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

  switchTab(tab: 'insights' | 'charts') {
    this.activeTab = tab;
    if (tab === 'charts') {
      setTimeout(() => {
        this.renderAllCharts();
      }, 0);
    }
  }

  private renderAllCharts() {
    const isLongTerm = this.reportService.isLongTerm();
    const expenses = this.reportService.expenses();
    const summaries = this.reportService.monthlySummaries();
    
    if (isLongTerm && (summaries.length > 0 || expenses.length > 0)) {
      this.renderCategoryChartLongTerm(summaries);
      this.renderPaymentChartLongTerm(summaries);
      this.renderTrendChartLongTerm(summaries);
    } else if (!isLongTerm && expenses.length > 0) {
      this.renderCategoryChart(expenses);
      this.renderPaymentChart(expenses);
      this.renderTrendChart(expenses);
    }
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  private destroyCharts() {
    if (this.catChartInstance) this.catChartInstance.destroy();
    if (this.trendChartInstance) this.trendChartInstance.destroy();
    if (this.paymentChartInstance) this.paymentChartInstance.destroy();
    if (this.pdfCatChartInstance) this.pdfCatChartInstance.destroy();
    if (this.pdfTrendChartInstance) this.pdfTrendChartInstance.destroy();
    if (this.pdfPaymentChartInstance) this.pdfPaymentChartInstance.destroy();
  }

  getCategoryColor(category: string): string {
    if (!category) return 'border-gray-900';
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

  getPaymentColorHEX(method: string): string {
    if (method.toLowerCase().includes('cash')) return '#10B981'; // Green
    if (method.toLowerCase().includes('credit')) return '#8B5CF6'; // Purple
    return '#3B82F6'; // Blue (UPI)
  }


  async downloadPDF() {
    this.isDownloading = true;
    
    const container = this.pdfContainer.nativeElement;
    
    // Temporarily bring container into viewport bounds so Chart.js IntersectionObserver triggers
    // We use absolute, at current scrollY, with -z-50 so it's hidden behind the app.
    container.classList.remove('-left-[9999px]');
    container.classList.add('left-0');
    container.style.top = window.scrollY + 'px';
    container.style.zIndex = '-100';

    // Force charts to render immediately
    if (this.pdfCatChartInstance) { this.pdfCatChartInstance.resize(); this.pdfCatChartInstance.update(); }
    if (this.pdfTrendChartInstance) { this.pdfTrendChartInstance.resize(); this.pdfTrendChartInstance.update(); }
    if (this.pdfPaymentChartInstance) { this.pdfPaymentChartInstance.resize(); this.pdfPaymentChartInstance.update(); }
    
    try {
      // Wait for Chart.js animation/render tick
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // html2canvas config to prevent clipping
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FAFAFA',
        scrollY: -window.scrollY // vital to prevent clipping when element is shifted down
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let finalHeight = (canvas.height * pdfWidth) / canvas.width;
      let finalWidth = pdfWidth;

      // Mathematically prevent cutting off if content is taller than A4 page
      if (finalHeight > pageHeight) {
         finalHeight = pageHeight;
         finalWidth = (canvas.width * pageHeight) / canvas.height;
      }
      
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pageHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      
      const preset = this.reportService.activePreset().replace(/\s+/g, '_');
      pdf.save(`Username_expensio_report_${preset}.pdf`);
    } catch (e) {
      console.error('Error generating PDF', e);
    } finally {
      // Restore off-screen hidden state
      container.classList.add('-left-[9999px]');
      container.classList.remove('left-0');
      container.style.top = '0px';
      container.style.zIndex = 'auto';
      this.isDownloading = false;
      this.cdr.detectChanges();
    }
  }

  getActiveFiltersText(): string {
    const filters = [];
    if (this.reportService.showExpenses()) filters.push('Expenses');
    if (this.reportService.showSubscriptions()) filters.push('Subscriptions');
    if (this.reportService.showGoals()) filters.push('Goals');
    if (this.reportService.showSplits()) filters.push('Splits');
    return `${this.reportService.activePreset()} (${filters.join(', ')})`;
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
    this.totalTransactions = expenses.length;
    const sortedByAmount = [...expenses].sort((a, b) => b.amount - a.amount);
    this.largestSpend = sortedByAmount.length > 0 ? sortedByAmount[0].amount : 0;

    const categoryTotals: Record<string, number> = {};
    const paymentTotals: Record<string, number> = {};

    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      const paymentMethod = e.paid_via || 'UPI';
      paymentTotals[paymentMethod] = (paymentTotals[paymentMethod] || 0) + e.amount;
    });

    const highestCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    this.highestCategory = highestCat ? highestCat[0] : 'N/A';

    const highestPay = Object.entries(paymentTotals).sort((a, b) => b[1] - a[1])[0];
    this.topPaymentMethod = highestPay ? highestPay[0] : 'N/A';

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
    const showExp = this.reportService.showExpenses();

    let total = 0;
    const categoryTotals: Record<string, number> = {};
    const paymentTotals: Record<string, number> = {};

    summaries.forEach((m) => {
      let t = 0;
      if (showExp) t += m.regular_expenses_total;
      if (showGoals) t += m.goal_expenses_total;
      if (showSubs) t += m.subscription_expenses_total;
      if (showSplits) t += m.split_expenses_total;
      total += t;

      const applySource = (sourceKey: string) => {
        if (m.breakdown_by_source && m.breakdown_by_source[sourceKey]) {
          Object.entries(m.breakdown_by_source[sourceKey]).forEach(([cat, val]) => {
            categoryTotals[cat] = (categoryTotals[cat] || 0) + val;
          });
        }
        if (m.breakdown_by_payment_method && m.breakdown_by_payment_method[sourceKey]) {
          Object.entries(m.breakdown_by_payment_method[sourceKey]).forEach(([method, val]) => {
            paymentTotals[method] = (paymentTotals[method] || 0) + val;
          });
        }
      };

      if (showExp) applySource('expense');
      if (showGoals) applySource('goal');
      if (showSubs) applySource('subscription');
      if (showSplits) applySource('split');
    });

    this.totalSpent = total;
    this.calculateDailyAverageFromTotal(this.totalSpent);
    this.totalTransactions = expenses.length;
    const sortedByAmount = [...expenses].sort((a, b) => b.amount - a.amount);
    this.largestSpend = sortedByAmount.length > 0 ? sortedByAmount[0].amount : 0;

    const highestCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    this.highestCategory = highestCat ? highestCat[0] : 'N/A';

    const highestPay = Object.entries(paymentTotals).sort((a, b) => b[1] - a[1])[0];
    this.topPaymentMethod = highestPay ? highestPay[0] : 'N/A';
  }

  private renderCategoryChart(expenses: ReportExpense[]) {
    if (!this.categoryCanvas && !this.pdfCategoryCanvas) return;

    const ctx = this.categoryCanvas?.nativeElement.getContext('2d');
    // if (!ctx) return;

    if (ctx && this.catChartInstance) this.catChartInstance.destroy();

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

    
    const config = {
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
          datalabels: {
            display: 'auto',
            color: '#ffffff',
            font: { weight: 'bold', size: 9, family: 'Inter, sans-serif' },
            formatter: (value: any, ctx: any) => {
              if (value <= 0) return '';
              return '₹' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value);
            }
          }
        },
        cutout: '65%',
      },
    };
    if (ctx) this.catChartInstance = new Chart(ctx, config as any);
    
    if (this.pdfCategoryCanvas) {
      const pCtx = this.pdfCategoryCanvas.nativeElement.getContext('2d');
      if (pCtx) {
        if (this.pdfCatChartInstance) this.pdfCatChartInstance.destroy();
        this.pdfCatChartInstance = new Chart(pCtx, {
           ...config, 
           options: { ...config.options, animation: false } 
        } as any);
      }
    }

  }

  private renderCategoryChartLongTerm(summaries: MonthlySummary[]) {
    if (!this.categoryCanvas && !this.pdfCategoryCanvas) return;

    const ctx = this.categoryCanvas?.nativeElement.getContext('2d');
    // if (!ctx) return;

    if (ctx && this.catChartInstance) this.catChartInstance.destroy();

    const showGoals = this.reportService.showGoals();
    const showSubs = this.reportService.showSubscriptions();
    const showSplits = this.reportService.showSplits();
    const showExp = this.reportService.showExpenses();

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

      if (showExp) applySource('expense');
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

    
    const config = {
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
          datalabels: {
            display: 'auto',
            color: '#ffffff',
            font: { weight: 'bold', size: 9, family: 'Inter, sans-serif' },
            formatter: (value: any, ctx: any) => {
              if (value <= 0) return '';
              return '₹' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value);
            }
          }
        },
        cutout: '65%',
      },
    };
    if (ctx) this.catChartInstance = new Chart(ctx, config as any);
    
    if (this.pdfCategoryCanvas) {
      const pCtx = this.pdfCategoryCanvas.nativeElement.getContext('2d');
      if (pCtx) {
        if (this.pdfCatChartInstance) this.pdfCatChartInstance.destroy();
        this.pdfCatChartInstance = new Chart(pCtx, {
           ...config, 
           options: { ...config.options, animation: false } 
        } as any);
      }
    }

  }

  private renderPaymentChart(expenses: ReportExpense[]) {
    if (!this.paymentCanvas && !this.pdfPaymentCanvas) return;

    const ctx = this.paymentCanvas?.nativeElement.getContext('2d');
    // if (!ctx) return;

    if (ctx && this.paymentChartInstance) this.paymentChartInstance.destroy();

    const paymentTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      const paymentMethod = e.paid_via || 'UPI';
      paymentTotals[paymentMethod] = (paymentTotals[paymentMethod] || 0) + e.amount;
    });

    const sortedEntries = Object.entries(paymentTotals).sort((a, b) => b[1] - a[1]);

    const labels: string[] = [];
    const data: number[] = [];

    sortedEntries.forEach((entry) => {
      labels.push(entry[0]);
      data.push(entry[1]);
    });

    const backgroundColors = labels.map((label) => this.getPaymentColorHEX(label));

    
    const config = {
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
            labels: { font: { family: 'Inter, sans-serif', weight: 'bold', size: 10 }, color: '#000' },
          },
          datalabels: {
            display: 'auto',
            color: '#ffffff',
            font: { weight: 'bold', size: 9, family: 'Inter, sans-serif' },
            formatter: (value: any, ctx: any) => {
              if (value <= 0) return '';
              return '₹' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value);
            }
          }
        },
        cutout: '65%',
      },
    };
    if (ctx) this.paymentChartInstance = new Chart(ctx, config as any);
    
    if (this.pdfPaymentCanvas) {
      const pCtx = this.pdfPaymentCanvas.nativeElement.getContext('2d');
      if (pCtx) {
        if (this.pdfPaymentChartInstance) this.pdfPaymentChartInstance.destroy();
        this.pdfPaymentChartInstance = new Chart(pCtx, {
           ...config, 
           options: { ...config.options, animation: false } 
        } as any);
      }
    }

  }

  private renderPaymentChartLongTerm(summaries: MonthlySummary[]) {
    if (!this.paymentCanvas && !this.pdfPaymentCanvas) return;

    const ctx = this.paymentCanvas?.nativeElement.getContext('2d');
    // if (!ctx) return;

    if (ctx && this.paymentChartInstance) this.paymentChartInstance.destroy();

    const showGoals = this.reportService.showGoals();
    const showSubs = this.reportService.showSubscriptions();
    const showSplits = this.reportService.showSplits();
    const showExp = this.reportService.showExpenses();

    const paymentTotals: Record<string, number> = {};

    summaries.forEach((m) => {
      if (!m.breakdown_by_payment_method) return;

      const applySource = (sourceKey: string) => {
        const payMap = m.breakdown_by_payment_method[sourceKey];
        if (payMap) {
          Object.entries(payMap).forEach(([method, val]) => {
            paymentTotals[method] = (paymentTotals[method] || 0) + val;
          });
        }
      };

      if (showExp) applySource('expense');
      if (showGoals) applySource('goal');
      if (showSubs) applySource('subscription');
      if (showSplits) applySource('split');
    });

    const sortedEntries = Object.entries(paymentTotals).sort((a, b) => b[1] - a[1]);
    const labels: string[] = [];
    const data: number[] = [];

    sortedEntries.forEach((entry) => {
      labels.push(entry[0]);
      data.push(entry[1]);
    });

    const backgroundColors = labels.map((label) => this.getPaymentColorHEX(label));

    
    const config = {
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
          datalabels: {
            display: 'auto',
            color: '#ffffff',
            font: { weight: 'bold', size: 9, family: 'Inter, sans-serif' },
            formatter: (value: any, ctx: any) => {
              if (value <= 0) return '';
              return '₹' + (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value);
            }
          }
        },
        cutout: '65%',
      },
    };
    if (ctx) this.paymentChartInstance = new Chart(ctx, config as any);
    
    if (this.pdfPaymentCanvas) {
      const pCtx = this.pdfPaymentCanvas.nativeElement.getContext('2d');
      if (pCtx) {
        if (this.pdfPaymentChartInstance) this.pdfPaymentChartInstance.destroy();
        this.pdfPaymentChartInstance = new Chart(pCtx, {
           ...config, 
           options: { ...config.options, animation: false } 
        } as any);
      }
    }

  }

  private renderTrendChart(expenses: ReportExpense[]) {
    if (!this.trendCanvas && !this.pdfTrendCanvas) return;

    const ctx = this.trendCanvas?.nativeElement.getContext('2d');
    // if (!ctx) return;

    if (ctx && this.trendChartInstance) this.trendChartInstance.destroy();

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

    
    const config = {
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
          datalabels: {
            color: '#f43f5e',
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold', size: 10, family: 'Inter, sans-serif' },
            formatter: (value: any) => value > 0 ? '₹' + (value >= 1000 ? (value/1000).toFixed(1) + 'k' : value) : ''
          },
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
              callback: (value: any) => '₹' + value,
            },
          },
        },
      },
    };
    if (ctx) this.trendChartInstance = new Chart(ctx, config as any);
    
    if (this.pdfTrendCanvas) {
      const pCtx = this.pdfTrendCanvas.nativeElement.getContext('2d');
      if (pCtx) {
        if (this.pdfTrendChartInstance) this.pdfTrendChartInstance.destroy();
        this.pdfTrendChartInstance = new Chart(pCtx, {
           ...config, 
           options: { ...config.options, animation: false } 
        } as any);
      }
    }

  }

  private renderTrendChartLongTerm(summaries: MonthlySummary[]) {
    if (!this.trendCanvas && !this.pdfTrendCanvas) return;

    const ctx = this.trendCanvas?.nativeElement.getContext('2d');
    // if (!ctx) return;

    if (ctx && this.trendChartInstance) this.trendChartInstance.destroy();

    const trends: Record<string, number> = {};
    const showGoals = this.reportService.showGoals();
    const showSubs = this.reportService.showSubscriptions();
    const showSplits = this.reportService.showSplits();
    const showExp = this.reportService.showExpenses();

    summaries.forEach((m) => {
      let t = 0;
      if (showExp) t += m.regular_expenses_total;
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

    
    const config = {
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
          datalabels: {
            color: '#f43f5e',
            anchor: 'end',
            align: 'top',
            offset: 4,
            font: { weight: 'bold', size: 10, family: 'Inter, sans-serif' },
            formatter: (value: any) => value > 0 ? '₹' + (value >= 1000 ? (value/1000).toFixed(1) + 'k' : value) : ''
          },
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
              callback: (value: any) => '₹' + value,
            },
          },
        },
      },
    };
    if (ctx) this.trendChartInstance = new Chart(ctx, config as any);
    
    if (this.pdfTrendCanvas) {
      const pCtx = this.pdfTrendCanvas.nativeElement.getContext('2d');
      if (pCtx) {
        if (this.pdfTrendChartInstance) this.pdfTrendChartInstance.destroy();
        this.pdfTrendChartInstance = new Chart(pCtx, {
           ...config, 
           options: { ...config.options, animation: false } 
        } as any);
      }
    }

  }
}
