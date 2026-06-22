import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GoalService, Goal } from '../../core/services/goal.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { AddFundsSheetComponent } from '../../shared/ui/add-funds-sheet/add-funds-sheet.component';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full',
  },
  template: `
    <div class="h-full bg-gray-50 p-4 flex flex-col gap-4">
      @if (goalService.isLoading()) {
        <!-- Shimmer -->
        <div class="flex flex-col gap-1.5 pb-36 mt-2">
          @for (i of [1, 2, 3]; track i) {
            <div class="w-full bg-gray-200 rounded-none p-4 flex items-center gap-4 h-[100px] animate-pulse">
              <div class="h-10 w-10 bg-gray-300 rounded-full shrink-0"></div>
              <div class="flex flex-col gap-2 flex-1">
                <div class="h-4 bg-gray-300 w-1/3"></div>
                <div class="h-3 bg-gray-300 w-1/2"></div>
                <div class="h-2 bg-gray-300 w-full mt-2"></div>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="flex-1 flex flex-col gap-3 pb-36 mt-2">
          @if (goalService.goals().length > 0) {
            @for (goal of goalService.goals(); track goal.id) {
              <button
                (click)="openTransactions(goal.id)"
                class="w-full bg-white border-2 border-black rounded-none p-4 flex flex-col gap-3 text-left hover:bg-gray-50 transition-colors active:bg-gray-100"
              >
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-black text-white flex items-center justify-center shrink-0 rounded-none">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                      <path [attr.d]="getGoalIconPath(goal.icon)"></path>
                    </svg>
                  </div>
                  <div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
                    <span class="font-extrabold text-lg text-black truncate">{{ goal.name }}</span>
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Target: {{ goal.target_date | date:'MMM yyyy' }}</span>
                  </div>
                  <div class="flex flex-col items-end shrink-0">
                    <span class="font-extrabold text-lg text-black">₹{{ goal.calculated_installment | number: '1.0-0' }}</span>
                    <span class="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{{ goal.frequency }}</span>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div class="w-full flex flex-col gap-1 mt-1">
                  <div class="flex justify-between text-[10px] font-bold text-black uppercase tracking-widest">
                    <span>₹{{ goal.saved_amount | number: '1.0-0' }} Saved</span>
                    <span>₹{{ goal.total_amount | number: '1.0-0' }} Goal</span>
                  </div>
                  <div class="h-2 w-full bg-gray-200 border border-gray-300 overflow-hidden">
                    <div class="h-full bg-black transition-all duration-500 origin-left animate-[fillProgress_1s_ease-out]" [style.width.%]="getProgress(goal)"></div>
                  </div>
                </div>

                <div class="flex justify-between items-center w-full gap-2 mt-2 pt-3 border-t border-gray-100">
                  <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest min-w-0">
                    <span [ngClass]="getDueMessageClass(goal.installment_date)">
                      {{ getDueMessage(goal.installment_date) }}
                    </span>
                  </span>
                  <button
                    (click)="addFunds($event, goal)"
                    class="bg-black text-white px-4 py-1.5 rounded-none text-[9px] font-extrabold uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    Add Funds
                  </button>
                </div>
              </button>
            }
          } @else {
            <div class="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div class="w-32 h-32 bg-gray-200 border-2 border-transparent rounded-full flex items-center justify-center mb-6">
                <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p class="text-gray-500 font-extrabold text-xl">No active goals</p>
              <p class="text-gray-400 font-bold text-sm mt-2 max-w-[250px]">
                Tap the + button to create a new savings goal.
              </p>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class GoalsComponent {
  goalService = inject(GoalService);
  confirmService = inject(ConfirmService);
  router = inject(Router);

  getProgress(goal: Goal): number {
    if (!goal.total_amount) return 0;
    return Math.min(100, Math.round((goal.saved_amount / goal.total_amount) * 100));
  }

  getGoalIconPath(iconPath: string): string {
    const defaultPremiumPath = 'M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5';
    // Automatically upgrade old, generic icons (gift box or line chart) to the new premium Target icon
    if (!iconPath || iconPath.startsWith('M20 12v10H4V12') || iconPath.startsWith('M2.25 18L9 11.25')) {
      return defaultPremiumPath;
    }
    return iconPath;
  }

  addFunds(event: Event, goal: Goal) {
    event.stopPropagation();
    this.goalService.openAddFundsSheet(goal);
  }

  openTransactions(id: string) {
    this.router.navigate(['/goals', id]);
  }

  getDueMessage(installmentDate: number): string {
    const today = new Date().getDate();
    if (installmentDate > today) {
      return `Due in ${installmentDate - today} day(s)`;
    } else if (installmentDate === today) {
      return 'Due Today';
    } else {
      return `Overdue by ${today - installmentDate} day(s)`;
    }
  }

  getDueMessageClass(installmentDate: number): string {
    const today = new Date().getDate();
    if (installmentDate > today) {
      return 'text-orange-600';
    } else if (installmentDate === today) {
      return 'text-red-500';
    } else {
      return 'text-red-600 font-extrabold';
    }
  }
}
