import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, signal, inject, OnInit, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { ExpenseService } from '../../core/services/expense.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'flex flex-col h-full'
  },
  template: `
    <div class="flex-1 bg-gray-50 p-6 flex flex-col gap-6 pb-20">
      
      <ng-container *ngIf="isInitialLoading(); else contentArea">
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

        <!-- Shortcuts Shimmer -->
        <div class="grid grid-cols-4 gap-2">
           <div *ngFor="let i of [1,2,3,4]" class="bg-gray-200 border-2 border-gray-300 rounded-none h-20 animate-pulse"></div>
        </div>
      </ng-container>

      <ng-template #contentArea>
        <!-- Total Expenses Box -->
        <div class="bg-black text-white p-6 border-2 border-black rounded-none relative">
          <div class="flex justify-between items-center mb-1">
            <h2 class="text-xs font-bold text-gray-400 uppercase tracking-widest">This Month</h2>
            <button (click)="toggleMask()" class="text-gray-400 hover:text-white transition-colors">
              <svg *ngIf="isMasked()" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a10.05 10.05 0 015.71-1.29c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              <svg *ngIf="!isMasked()" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
          </div>
          <p (click)="toggleMask()" class="text-4xl font-extrabold tracking-tight cursor-pointer select-none">
            {{ isMasked() ? '••••••••' : (thisMonthTotal() | currency:'INR':'symbol':'1.2-2') }}
          </p>
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
                class="px-3 py-1.5 transition-colors">
                Weekly
              </button>
              <button 
                (click)="setChartType('monthly')"
                [class.bg-black]="chartType === 'monthly'"
                [class.text-white]="chartType === 'monthly'"
                [class.text-gray-500]="chartType !== 'monthly'"
                [class.bg-white]="chartType !== 'monthly'"
                class="px-3 py-1.5 border-l-2 border-black transition-colors">
                Monthly
              </button>
            </div>
          </div>

          <div class="relative h-64 w-full">
            <canvas #chartCanvas></canvas>
          </div>
        </div>

        <!-- Shortcuts Section -->
        <div class="grid grid-cols-4 gap-2">
          <button (click)="openAddExpense()" class="bg-white border-2 border-black rounded-none p-2 flex flex-col items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors group">
            <svg class="w-5 h-5 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            <span class="font-bold text-[9px] text-center leading-tight">Add<br>Expense</span>
          </button>

          <button class="bg-white border-2 border-black rounded-none p-2 flex flex-col items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors group">
            <svg class="w-5 h-5 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>
            <span class="font-bold text-[9px] text-center leading-tight">Budget</span>
          </button>

          <button class="bg-white border-2 border-black rounded-none p-2 flex flex-col items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors group">
            <svg class="w-5 h-5 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>
            <span class="font-bold text-[9px] text-center leading-tight">Group</span>
          </button>

          <button class="bg-white border-2 border-black rounded-none p-2 flex flex-col items-center justify-center gap-2 hover:bg-black hover:text-white transition-colors group">
            <svg class="w-5 h-5 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            <span class="font-bold text-[9px] text-center leading-tight">Friend</span>
          </button>
        </div>
      </ng-template>

    </div>
  `,
  styles: ``
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  private expenseService = inject(ExpenseService);
  
  chartType: 'weekly' | 'monthly' = 'weekly';
  chartInstance: any;
  isMasked = signal(true);
  isInitialLoading = signal(false);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef;

  thisMonthTotal = computed(() => {
    const month = this.expenseService.activeMonth();
    return this.expenseService.expenses()
      .filter(e => e.date.startsWith(month))
      .reduce((sum, e) => sum + e.amount, 0);
  });

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
    // Initial loading is now immediate, no simulation
  }

  ngAfterViewInit() {
    if (!this.isInitialLoading()) {
      this.initChart();
    }
  }

  ngOnDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  toggleMask() {
    this.isMasked.update(v => !v);
  }

  openAddExpense() {
    this.expenseService.openBottomSheet();
  }

  setChartType(type: 'weekly' | 'monthly') {
    this.chartType = type;
    this.updateChartData();
  }

  private initChart() {
    if (!this.chartCanvas) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: this.getChartData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#000000',
            titleFont: {
              family: 'sans-serif',
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: 'sans-serif',
              size: 14,
              weight: 'bold'
            },
            padding: 12,
            cornerRadius: 0,
            displayColors: false,
            callbacks: {
              label: function(context: any) {
                return '₹' + context.parsed.y;
              }
            }
          }
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
                size: 10
              },
              color: '#000000'
            },
            border: {
              display: true,
              color: '#000000',
              width: 2
            }
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
                size: 10
              },
              color: '#6b7280',
              callback: function(value: any) {
                return '₹' + value;
              }
            },
            border: {
              display: false
            }
          }
        }
      }
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
      expenses.forEach(e => {
        const d = new Date(e.date);
        let day = d.getDay() - 1;
        if (day === -1) day = 6; // Sunday
        days[day] += e.amount;
      });
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Expenses',
          data: days,
          backgroundColor: '#000000',
          borderWidth: 2,
          borderColor: '#000000',
          borderRadius: 0,
          borderSkipped: false,
        }]
      };
    } else {
      // Grouping by week of month
      const weeks = [0, 0, 0, 0];
      expenses.forEach(e => {
        const d = new Date(e.date);
        const week = Math.min(Math.floor((d.getDate() - 1) / 7), 3);
        weeks[week] += e.amount;
      });
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4+'],
        datasets: [{
          label: 'Expenses',
          data: weeks,
          backgroundColor: '#000000',
          borderWidth: 2,
          borderColor: '#000000',
          borderRadius: 0,
          borderSkipped: false,
        }]
      };
    }
  }
}
