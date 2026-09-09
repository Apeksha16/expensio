import { Component, inject, computed, ChangeDetectionStrategy, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GoalService, Goal, GoalEmi } from '../../../core/services/goal.service';
import { ExpenseService, Expense } from '../../../core/services/expense.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-goal-transactions',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block h-full bg-[#FAFAFA]',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="flex flex-col h-full relative bg-[#FAFAFA]">
      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-5 pt-6 pb-32 relative z-0">
        @if (goalService.isLoading() || expenseService.isLoading()) {
          <div class="flex flex-col gap-3">
            <div class="mb-5 bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm animate-pulse flex flex-col items-center">
              <div class="h-4 bg-slate-100 w-24 mb-4 rounded"></div>
              <div class="h-10 bg-slate-100 w-40 mb-3 rounded"></div>
              <div class="h-3 bg-slate-100 w-32 mb-6 rounded"></div>
              <div class="h-2 bg-slate-100 w-full rounded-full"></div>
            </div>
            @for (i of [1, 2, 3]; track i) {
              <div class="w-full bg-white rounded-[24px] p-5 h-[100px] animate-pulse border border-slate-100 flex flex-col justify-center">
                <div class="flex items-center gap-4 w-full">
                  <div class="w-12 h-12 bg-slate-100 rounded-full shrink-0"></div>
                  <div class="flex flex-col gap-2 flex-1">
                    <div class="h-4 bg-slate-100 w-1/3 rounded"></div>
                    <div class="h-3 bg-slate-100 w-1/4 rounded"></div>
                  </div>
                  <div class="h-5 bg-slate-100 w-16 rounded shrink-0"></div>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Progress Card -->
          <div class="mb-8 bg-white border border-slate-100 p-6 rounded-[24px] shadow-sm relative overflow-hidden flex flex-col items-center text-center">
            <div class="absolute inset-0 bg-gradient-to-b from-goals-primary/5 to-transparent pointer-events-none"></div>
            
            <div class="relative z-10 w-full">
              <span class="font-bold text-sm text-slate-500 uppercase tracking-widest">
                Goal Progress
              </span>
              
              <div class="flex items-center justify-center gap-1 mt-3 mb-1">
                <span class="font-black tracking-tight text-slate-900 leading-none text-[42px]">
                  ₹{{ goal()?.saved_amount | number: '1.0-0' }}
                </span>
              </div>
              
              <span class="text-xs font-bold text-gray-400 uppercase tracking-widest">
                of ₹{{ goal()?.total_amount | number: '1.0-0' }}
              </span>

              <div class="w-full bg-slate-100 h-2.5 mt-6 overflow-hidden rounded-full flex">
                <div
                  class="h-full bg-goals-primary transition-all duration-1000 origin-left animate-[fillProgress_1s_ease-out] rounded-full"
                  [style.width.%]="getProgress()"
                ></div>
              </div>
              <div class="flex justify-between w-full mt-2">
                <span class="text-[10px] font-bold text-goals-primary">{{ getProgress() }}% Saved</span>
                <span class="text-[10px] font-bold text-slate-400">{{ getRemainingAmount() | number: '1.0-0' }} Left</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-center px-1 mb-2">
              <h3 class="font-black text-gray-400 uppercase tracking-widest text-xs">
                Installment Schedule
              </h3>
              <span class="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                {{ emis().length }} EMIs
              </span>
            </div>

            @if (emis().length > 0) {
              @for (emi of emis(); track emi.id; let i = $index) {
                <div class="w-full bg-white rounded-[24px] p-5 flex flex-col gap-4 shadow-sm transition-all relative overflow-hidden"
                  [ngClass]="{
                    'border border-slate-100': emi.status === 'pending' && !isCurrentEmi(emi),
                    'border-2 border-goals-primary shadow-md shadow-goals-primary/10': emi.status === 'pending' && isCurrentEmi(emi),
                    'border border-emerald-100 bg-emerald-50/10': emi.status === 'paid',
                    'border border-amber-100 bg-amber-50/10': emi.status === 'partially_paid',
                    'border border-slate-100 bg-slate-50/50 opacity-75': emi.status === 'skipped'
                  }"
                >
                  <!-- Optional "Next Due" ribbon for current EMI -->
                  @if (emi.status === 'pending' && isCurrentEmi(emi)) {
                    <div class="absolute top-0 right-0 bg-goals-primary text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl z-10">
                      Next Due
                    </div>
                  }

                  <div 
                    class="flex items-center justify-between gap-3 w-full relative z-10 mt-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-goals-primary rounded-xl" 
                    role="button"
                    tabindex="0"
                    [attr.aria-expanded]="expandedEmiId() === emi.id"
                    (click)="toggleEmi(emi.id)"
                    (keydown.enter)="toggleEmi(emi.id)"
                  >
                    <div class="flex items-center gap-4 min-w-0">
                      <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                        [ngClass]="{
                          'bg-goals-primary/10 text-goals-primary': emi.status === 'pending',
                          'bg-emerald-100 text-emerald-600': emi.status === 'paid',
                          'bg-amber-100 text-amber-600': emi.status === 'partially_paid',
                          'bg-slate-200 text-slate-500': emi.status === 'skipped'
                        }"
                      >
                        @if (emi.status === 'paid') {
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                        } @else if (emi.status === 'skipped') {
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                        } @else {
                          <span class="font-black text-lg" aria-hidden="true">{{ i + 1 }}</span>
                        }
                      </div>
                      <div class="flex flex-col min-w-0 gap-0.5">
                        <span class="font-bold text-[16px] text-gray-900 truncate leading-tight">
                          {{ emi.status === 'paid' ? 'Paid in Full' : emi.status === 'partially_paid' ? 'Partial Payment' : emi.status === 'skipped' ? 'Skipped Installment' : 'Installment ' + (i + 1) }}
                        </span>
                        <span class="text-[12px] font-semibold text-gray-500">{{ emi.due_date | date: 'MMM d, yyyy' }}</span>
                      </div>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                      <span class="font-black text-[18px]"
                        [ngClass]="{
                          'text-goals-dark': emi.status === 'pending',
                          'text-emerald-600': emi.status === 'paid',
                          'text-amber-600': emi.status === 'partially_paid',
                          'text-slate-400 line-through': emi.status === 'skipped'
                        }"
                      >
                        ₹{{ emi.expected_amount | number: '1.0-0' }}
                      </span>
                      <svg class="w-4 h-4 text-slate-400 transition-transform duration-300" [class.rotate-180]="expandedEmiId() === emi.id" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                  </div>

                  <!-- Expanded Transactions List with smooth transition -->
                  <div 
                    class="grid transition-all duration-300 ease-in-out relative z-10"
                    [ngClass]="expandedEmiId() === emi.id ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'"
                  >
                    <div class="overflow-hidden">
                      <div class="pt-4 border-t border-slate-100 border-dashed flex flex-col gap-2">
                        <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transactions</h4>
                        @for (tx of getEmiTransactions(emi.id); track tx.id) {
                          <div (click)="editTransaction(tx, emi); $event.stopPropagation()" class="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 active:scale-[0.99] transition-all">
                            <span class="text-xs font-semibold text-slate-700">{{ tx.date | date: 'MMM d' }} &bull; {{ tx.paid_via }}</span>
                            <span class="text-xs font-black" [ngClass]="tx.amount === 0 ? 'text-slate-400' : 'text-slate-900'">₹{{ tx.amount | number: '1.0-0' }}</span>
                          </div>
                        }
                        @if (getEmiTransactions(emi.id).length === 0) {
                          <span class="text-xs font-medium text-slate-500 py-2 px-3 mb-1">No payments recorded.</span>
                        }

                        @if ((emi.status === 'pending' || emi.status === 'partially_paid') && isCurrentEmi(emi)) {
                          <div class="flex items-center gap-2 mt-2">
                            <button (click)="settleEmi(emi); $event.stopPropagation()" class="flex-1 flex justify-center items-center gap-1 bg-goals-primary text-white py-2.5 rounded-[12px] text-[11px] font-black uppercase tracking-wider active:scale-[0.98] transition-all shadow-sm shadow-goals-primary/20">
                              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
                              Settle
                            </button>
                            <button (click)="settlePartial(emi); $event.stopPropagation()" class="flex-1 flex justify-center items-center bg-goals-primary/10 text-goals-primary py-2.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider active:scale-[0.98] transition-all">
                              Partial
                            </button>
                            <button (click)="openSkipModal(emi); $event.stopPropagation()" class="flex-1 flex justify-center items-center bg-slate-100 text-slate-500 py-2.5 rounded-[12px] text-[11px] font-bold uppercase tracking-wider active:scale-[0.98] transition-all hover:bg-slate-200">
                              Skip
                            </button>
                          </div>
                        } @else if (emi.status === 'pending' && !isCurrentEmi(emi)) {
                          <div class="mt-1 py-3 px-4 bg-slate-50 rounded-[14px] border border-slate-100 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            Locked until due
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
            } @else {
              <div class="mt-4 w-full bg-white border border-dashed border-slate-200 rounded-[24px] p-10 flex flex-col items-center justify-center text-center">
                <div class="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                  <svg class="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 class="text-[15px] font-bold text-slate-800 mb-1">No Schedule Yet</h4>
                <p class="text-xs text-slate-500 max-w-[200px] leading-relaxed">
                  Your EMI schedule will appear here once properly generated.
                </p>
              </div>
            }
          </div>
        }
      </div>

      <!-- Custom Skip Modal (Bottom Sheet) -->
      @if (isSkipModalOpen()) {
        <div class="fixed inset-0 z-[100] flex flex-col justify-end">
          <!-- Backdrop -->
          <div 
            class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            [ngClass]="isSkipModalVisible() ? 'opacity-100' : 'opacity-0'" 
            (click)="closeSkipModal()"
          ></div>
          
          <!-- Sheet -->
          <div class="bg-white rounded-t-[32px] p-6 w-full relative z-10 transition-transform duration-300 ease-out shadow-2xl"
               [ngClass]="isSkipModalVisible() ? 'translate-y-0' : 'translate-y-full'">
            <div class="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
            
            <div class="flex flex-col gap-2 mb-6 text-center">
              <h3 class="text-2xl font-black text-slate-900 tracking-tight">Skip Installment</h3>
              <p class="text-sm font-medium text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                How would you like to handle this skipped payment of <span class="font-bold text-slate-700">₹{{ selectedSkipEmi()?.expected_amount | number: '1.0-0' }}</span>?
              </p>
            </div>
            
            <div class="flex flex-col gap-3">
              <!-- Extend Option -->
              <button (click)="confirmSkip('extend')" class="w-full bg-white border border-slate-200 rounded-[20px] p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-all hover:border-goals-primary hover:bg-goals-primary/5 group">
                <div class="w-12 h-12 bg-goals-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-goals-primary/20 transition-colors">
                  <svg class="w-6 h-6 text-goals-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11l-4 4m0 0l-4-4m4 4V3" />
                  </svg>
                </div>
                <div class="flex flex-col flex-1">
                  <span class="font-bold text-base text-slate-900">Extend Duration</span>
                  <span class="text-[11px] font-medium text-slate-500 mt-0.5 leading-snug">Pushes your target date by one period. Future amounts stay similar.</span>
                </div>
              </button>
              
              <!-- Adjust Option -->
              <button (click)="confirmSkip('adjust')" class="w-full bg-white border border-slate-200 rounded-[20px] p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-all hover:border-amber-500 hover:bg-amber-50 group">
                <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                  <svg class="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="flex flex-col flex-1">
                  <span class="font-bold text-base text-slate-900">Adjust Amount</span>
                  <span class="text-[11px] font-medium text-slate-500 mt-0.5 leading-snug">Increases future EMIs slightly to cover the skipped amount.</span>
                </div>
              </button>
            </div>
            
            <button (click)="closeSkipModal()" class="w-full mt-4 py-4 text-sm font-bold text-slate-500 uppercase tracking-widest active:bg-slate-50 rounded-[16px] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class GoalTransactionsComponent {
  route = inject(ActivatedRoute);
  router = inject(Router);
  goalService = inject(GoalService);
  expenseService = inject(ExpenseService);
  confirmService = inject(ConfirmService);
  toastService = inject(ToastService);

  isSkipModalOpen = signal(false);
  isSkipModalVisible = signal(false);
  selectedSkipEmi = signal<GoalEmi | null>(null);
  
  emis = signal<GoalEmi[]>([]);
  expandedEmiId = signal<string | null>(null);
  isLoadingEmis = signal(false);

  goalId = computed(() => this.route.snapshot.paramMap.get('id'));

  goal = computed(() => {
    return this.goalService.goals().find((g) => g.id === this.goalId());
  });

  // All transactions related to this goal
  transactions = computed(() => {
    const currentGoal = this.goal();
    if (!currentGoal) return [];
    // Transactions mapped by goal_id or legacy title match
    const txs = this.expenseService['allExpenses']().filter(
      (e) => e.goal_id === currentGoal.id || 
            (e.category === 'virtual-invest' && (e.title === currentGoal.name || e.title === `Goal: ${currentGoal.name}`))
    );
    // Sort oldest first
    return txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  constructor() {
    effect(() => {
      const gid = this.goalId();
      // Track expenses so EMIs reload automatically when a transaction is added/updated
      this.expenseService.allExpenses();
      if (gid) {
        this.loadEmis(gid);
      }
    });
  }

  async loadEmis(goalId: string) {
    this.isLoadingEmis.set(true);
    const data = await this.goalService.fetchGoalEmis(goalId);
    this.emis.set(data);
    this.isLoadingEmis.set(false);
  }

  isCurrentEmi(emi: GoalEmi): boolean {
    const pendingEmis = this.emis().filter(e => e.status === 'pending' || e.status === 'partially_paid');
    if (pendingEmis.length > 0) {
      return pendingEmis[0].id === emi.id;
    }
    return false;
  }
  
  toggleEmi(emiId: string) {
    if (this.expandedEmiId() === emiId) {
      this.expandedEmiId.set(null);
    } else {
      this.expandedEmiId.set(emiId);
    }
  }

  getEmiTransactions(emiId: string) {
    return this.transactions().filter(tx => tx.goal_emi_id === emiId);
  }

  getProgress(): number {
    const g = this.goal();
    if (!g || !g.total_amount) return 0;
    return Math.min(100, Math.round((g.saved_amount / g.total_amount) * 100));
  }

  getRemainingAmount(): number {
    const g = this.goal();
    if (!g || !g.total_amount) return 0;
    return Math.max(0, g.total_amount - g.saved_amount);
  }

  async settleEmi(emi: GoalEmi) {
    const g = this.goal();
    if (!g) return;
    
    // Calculate how much is left to pay for this specific EMI if it's partially paid
    const txs = this.getEmiTransactions(emi.id);
    const totalPaid = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const remainingToPay = Math.max(0, emi.expected_amount - totalPaid);

    this.confirmService.open({
      title: 'Settle Installment',
      message: `Are you sure you want to settle ₹${remainingToPay.toLocaleString('en-IN')} for this installment?`,
      onConfirm: async () => {
        try {
          const expense = {
            title: `Goal: ${g.name}`,
            amount: remainingToPay,
            category: 'virtual-invest',
            date: new Date().toISOString(),
            paid_via: 'UPI' as const,
            goal_id: g.id,
            goal_emi_id: emi.id
          };
          await this.expenseService.addExpense(expense, true);
          // Sync handled by Postgres trigger `trg_sync_goal_progress`
          // Refresh EMIs
          await this.loadEmis(g.id);
          this.toastService.showSuccess('Installment Settled', `₹${remainingToPay.toLocaleString('en-IN')} added to ${g.name}. You're one step closer to your goal.`);
        } catch (error: any) {
          this.toastService.showError('Payment Failed', 'We couldn\'t record your payment. Please try again.');
        }
      }
    });
  }

  settlePartial(emi: GoalEmi) {
    const g = this.goal();
    if (g) {
      this.goalService.openAddFundsSheet(g, emi);
    }
  }

  editTransaction(tx: any, emi: GoalEmi) {
    const g = this.goal();
    if (g) {
      this.goalService.openAddFundsSheet(g, emi, tx);
    }
  }

  openSkipModal(emi: GoalEmi) {
    this.selectedSkipEmi.set(emi);
    this.isSkipModalOpen.set(true);
    setTimeout(() => this.isSkipModalVisible.set(true), 10);
  }

  closeSkipModal() {
    this.isSkipModalVisible.set(false);
    setTimeout(() => {
      this.isSkipModalOpen.set(false);
      this.selectedSkipEmi.set(null);
    }, 300); // clear after animation
  }

  async confirmSkip(mode: 'extend' | 'adjust') {
    const g = this.goal();
    const emi = this.selectedSkipEmi();
    if (!g || !emi) return;

    try {
      if (mode === 'extend') {
        // Extend target date
        const currentTarget = new Date(g.target_date);
        if (g.frequency === 'monthly') currentTarget.setMonth(currentTarget.getMonth() + 1);
        else if (g.frequency === 'alternate') currentTarget.setMonth(currentTarget.getMonth() + 2);
        else if (g.frequency === 'quarterly') currentTarget.setMonth(currentTarget.getMonth() + 3);
        
        await this.goalService.updateGoal(g.id, { target_date: currentTarget.toISOString() }, true);
      }
      // Mark EMI as skipped directly in the database without creating a dummy expense
      await this.goalService.updateGoalEmi(emi.id, { status: 'skipped' });
      await this.loadEmis(g.id);
      
      // Refresh global upcoming EMIs so it disappears from dashboard
      const currentMonth = new Date().toISOString().slice(0, 7);
      await this.goalService.fetchCurrentMonthEmis(currentMonth);

      this.closeSkipModal();

      if (mode === 'extend') {
        this.toastService.showSuccess('Installment Skipped', 'Your target date has been extended to keep your plan on track.');
      } else {
        this.toastService.showSuccess('Installment Skipped', 'Future installments have been adjusted to match your plan.');
      }
    } catch (error: any) {
      this.toastService.showError("Couldn't Skip Installment", 'We couldn\'t skip this installment. Please try again.');
    }
  }
}
