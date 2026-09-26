import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { EmiService } from '../../core/services/emi.service';
import { IconService } from '../../core/services/icon.service';
import { EmiDetailsSheetComponent } from '../../shared/ui/emi-details-sheet/emi-details-sheet.component';

@Component({
  selector: 'app-emis',
  standalone: true,
  imports: [CommonModule, NgClass, EmiDetailsSheetComponent],
  host: {
    class: 'block h-full',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="h-full bg-white p-4 flex flex-col gap-4">
      @if (emiService.isLoading()) {
        <!-- Shimmer -->
        <div class="flex flex-col gap-3 pb-28 mt-2">
          @for (i of [1, 2, 3]; track $index) {
            <div class="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-4 h-[76px] animate-pulse">
              <div class="flex flex-col gap-2 flex-1">
                <div class="h-4 bg-slate-200 w-1/3"></div>
                <div class="h-3 bg-slate-200 w-1/4"></div>
              </div>
              <div class="h-6 bg-slate-200 w-16"></div>
            </div>
          }
        </div>
      } @else {
        <!-- Top Summary Box -->
        <div class="bg-white text-gray-900 border border-slate-100 p-5 rounded-3xl flex flex-col gap-1 relative overflow-hidden shadow-sm mt-2">
          <span class="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
            Total Monthly EMIs
          </span>
          <span class="text-4xl font-extrabold tracking-tight text-gray-900">
            ₹{{ emiService.totalMonthlyAmount() | number: '1.0-0' }}
          </span>
        </div>

        <!-- Tabs -->
        <div class="shrink-0 flex gap-2 mt-2">
          <button
            (click)="activeTab.set('running')"
            [class.bg-emis-primary]="activeTab() === 'running'"
            [class.text-white]="activeTab() === 'running'"
            [class.shadow-md]="activeTab() === 'running'"
            [class.shadow-emis-primary/30]="activeTab() === 'running'"
            [class.bg-slate-50]="activeTab() !== 'running'"
            [class.text-slate-500]="activeTab() !== 'running'"
            class="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 active:scale-95"
          >
            Running
          </button>
          <button
            (click)="activeTab.set('completed')"
            [class.bg-emis-primary]="activeTab() === 'completed'"
            [class.text-white]="activeTab() === 'completed'"
            [class.shadow-md]="activeTab() === 'completed'"
            [class.shadow-emis-primary/30]="activeTab() === 'completed'"
            [class.bg-slate-50]="activeTab() !== 'completed'"
            [class.text-slate-500]="activeTab() !== 'completed'"
            class="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 active:scale-95"
          >
            Completed
          </button>
        </div>

        <!-- List -->
        <div class="flex-1 overflow-y-auto pb-28 scroll-smooth no-scrollbar">
          @if (activeTab() === 'running' && emiService.runningEmis().length === 0) {
            <div class="flex flex-col items-center justify-center h-full gap-3 mt-10">
              <div class="w-16 h-16 bg-emis-surface border border-emis-primary/10 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-emis-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-sm font-bold text-gray-400">No running EMIs found</p>
            </div>
          } @else if (activeTab() === 'completed' && emiService.completedEmis().length === 0) {
            <div class="flex flex-col items-center justify-center h-full gap-3 mt-10">
              <div class="w-16 h-16 bg-emis-surface border border-emis-primary/10 rounded-full flex items-center justify-center">
                <svg class="w-8 h-8 text-emis-primary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p class="text-sm font-bold text-gray-400">No completed EMIs found</p>
            </div>
          } @else {
            <div class="flex flex-col gap-3">
              @for (emi of activeEmis(); track emi.id) {
                <div class="group relative overflow-hidden bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:border-emis-primary/20 cursor-pointer active:scale-[0.98]" (click)="emiService.openDetailsSheet(emi)">
                  
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-emis-surface text-emis-primary flex items-center justify-center shrink-0 shadow-sm border border-emis-primary/10">
                      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path [attr.d]="emi.icon ? iconService.getIconById(emi.icon).svg : iconService.DEFAULT_ICON.svg"></path>
                      </svg>
                    </div>

                    <div class="flex-1 flex flex-col justify-center min-w-0">
                      <span class="text-base font-extrabold text-gray-900 truncate tracking-tight">{{ emi.title }}</span>
                      <span class="text-[12px] font-semibold text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span class="w-1.5 h-1.5 rounded-full" [ngClass]="isDueSoon(emi.due_day) && activeTab() === 'running' ? 'bg-orange-500' : 'bg-emis-light'"></span>
                        Due on {{ emi.due_day }}{{ getOrdinalSuffix(emi.due_day) }}
                      </span>
                    </div>

                    <div class="flex flex-col items-end justify-center shrink-0">
                      <span class="text-lg font-extrabold text-gray-900 tracking-tight">₹{{ emi.amount | number: '1.0-0' }}</span>
                      <span class="text-[11px] font-bold text-emis-primary uppercase tracking-wider mt-0.5">{{ emi.category }}</span>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="w-full flex flex-col gap-1.5 mt-2">
                    <div class="flex justify-between items-center text-[11px] font-bold text-gray-500">
                      <span>{{ emi.months_paid }} paid</span>
                      <span>{{ emi.total_months }} total</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-emis-primary rounded-full transition-all duration-500 ease-out" [style.width.%]="emi.total_months ? (emi.months_paid >= emi.total_months ? 100 : (emi.months_paid / emi.total_months) * 100) : 0"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
    
    <app-emi-details-sheet></app-emi-details-sheet>
  `,
})
export class EmisComponent {
  emiService = inject(EmiService);
  iconService = inject(IconService);

  activeTab = signal<'running' | 'completed'>('running');

  activeEmis = computed(() => {
    return this.activeTab() === 'running' ? this.emiService.runningEmis() : this.emiService.completedEmis();
  });

  getOrdinalSuffix(i: number): string {
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  }

  isDueSoon(dueDay: number): boolean {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    if (dueDay >= currentDay && dueDay <= currentDay + 5) {
      return true;
    }
    
    if (currentDay + 5 > daysInMonth) {
      const remainingDays = (currentDay + 5) - daysInMonth;
      if (dueDay <= remainingDays) {
        return true;
      }
    }
    
    return false;
  }
}
