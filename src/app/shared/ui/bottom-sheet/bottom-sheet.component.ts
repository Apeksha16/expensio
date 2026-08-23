import {
  Component,
  inject,
  OnInit,
  effect,
  signal,
  computed,
  untracked,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { ExpenseService } from '../../../core/services/expense.service';
import { BudgetService, DEFAULT_CATEGORIES } from '../../../core/services/budget.service';
import { GoalService } from '../../../core/services/goal.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';
import { SafeInputDirective } from '../safe-input.directive';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePickerComponent,
    SwipeToCloseDirective,
    AmountInputDirective,
    AutofocusDirective,
    SafeInputDirective,
  ],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(100%)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('300ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    @if (expenseService.isBottomSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="active:scale-[0.98] transition-all duration-200 fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>
      <div
        appSwipeToClose
        (swipeClose)="close()"
        @slideUp
        class="fixed bottom-0 left-0 right-0 z-[70] 
               max-h-[95vh] flex flex-col rounded-t-[32px] shadow-2xl bg-white overflow-hidden" style="padding-bottom: env(safe-area-inset-bottom);"
      >
        <!-- Header -->
        <div class="flex justify-between items-center py-4 px-6 text-white rounded-t-[32px] sticky top-0 z-10 shrink-0 shadow-sm" [ngClass]="theme.bg">
          <h2 class="text-lg font-bold tracking-wide">
            {{ isEditing ? 'Edit Expense' : 'Add Expense' }}
          </h2>
          @if (isEditing) {
            <button
              type="button"
              (click)="delete()"
              [disabled]="isDeleting() || isSaving()"
              class="w-8 h-8 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 transition-all rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95"
            >
              @if (!isDeleting()) {
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
              }
              @if (isDeleting()) {
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
            </button>
          }
        </div>
        
        <!-- Content -->
        <div class="p-6 overflow-y-auto overscroll-none flex-1 pb-6" [ngClass]="theme.surfaceBg" style="scrollbar-width: none;">
          @if (isEditing) {
            <div class="flex justify-center mb-4">
              <span class="text-[10px] font-bold tracking-wide uppercase text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 mt-2">
                Added {{ $safeNavigationMigration(expenseService.editingExpense()?.created_at) | date: 'medium' }}
              </span>
            </div>
          }
          <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <!-- Amount -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Amount</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" [ngClass]="theme.text"><path d="M6 3h12"/><path d="M6 8h12"/><path d="m6 13 8.5 8"/><path d="M6 13h3"/><path d="M9 13c6.667 0 6.667-10 0-10"/></svg>
                </div>
                <input
                  type="text"
                  inputmode="decimal"
                  appAmountInput
                  [appAutofocus]="!isEditing"
                  formControlName="amount"
                  placeholder="0.00"
                  (keydown)="preventE($event)"
                  class="w-full bg-white border-2 text-slate-900 font-bold text-2xl rounded-2xl pl-11 pr-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300" [ngClass]="[theme.focusBorder, theme.focusRing, theme.surfaceBorder]"
                />
              </div>
            </div>
            <!-- Name -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Expense Name</label>
              <div class="relative group">
                <input
                  type="text"
                  formControlName="title"
                  appSafeInput
                  placeholder="What was this for?"
                  class="w-full bg-white border-2 text-slate-900 font-semibold text-base rounded-2xl px-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400" [ngClass]="[theme.focusBorder, theme.focusRing, theme.surfaceBorder]"
                />
              </div>
            </div>
            <!-- Budgets -->
            @if (budgetService.isLoading()) {
              <div class="flex flex-col gap-1.5 relative w-full">
                <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Category</label>
                <div 
                  #scrollCatLoading 
                  (scroll)="updateScrollState($event.target, false)" 
                  class="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 relative z-0 touch-pan-x transition-all duration-300"
                  [style.-webkit-mask-image]="getMaskImage(false)"
                  [style.mask-image]="getMaskImage(false)"
                >
                  @for (i of [1, 2, 3, 4, 5]; track i) {
                    <div class="flex items-center gap-2 p-2 px-3 border border-slate-100 bg-slate-50 rounded-full h-[40px] w-[100px] shrink-0 animate-pulse"></div>
                  }
                </div>
              </div>
            } @else {
              <div class="flex flex-col gap-1.5 relative w-full">
                <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Category</label>
                <div 
                  #scrollCat 
                  (scroll)="updateScrollState($event.target, true)" 
                  class="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 relative z-0 touch-pan-x transition-all duration-300"
                  [style.-webkit-mask-image]="getMaskImage(true)"
                  [style.mask-image]="getMaskImage(true)"
                >
                  @for (cat of budgetCategories(); track cat) {
                    <button
                      type="button"
                      (click)="selectBudget(cat)"
                      class="flex items-center gap-2 p-2 px-3 border-2 rounded-full transition-all shrink-0 active:scale-95 snap-center"
                      [ngClass]="
                        (expenseForm.get('category')?.value || '').toLowerCase() === cat.name.toLowerCase()
                          ? theme.activeBg
                          : 'bg-white text-slate-600 shadow-sm ' + theme.surfaceBorder
                      "
                    >
                      <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <path [attr.d]="cat.path"></path>
                      </svg>
                      <span class="text-xs font-bold tracking-wide whitespace-nowrap">{{ cat.name }}</span>
                    </button>
                  }
                </div>
              </div>
            }
            <!-- Paid Via -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Paid Via</label>
              <div class="flex items-center bg-slate-50 border border-slate-100 rounded-2xl p-1 shadow-inner">
                @for (method of ['Cash', 'Credit Card', 'UPI']; track method) {
                  <button
                    type="button"
                    (click)="expenseForm.patchValue({ paid_via: method })"
                    class="flex-1 active:scale-[0.98] transition-all duration-200 py-2.5 px-3 text-xs font-bold rounded-xl text-center"
                    [ngClass]="
                      expenseForm.get('paid_via')?.value === method
                        ? theme.activeBg
                        : 'text-slate-600 bg-transparent'
                    "
                  >
                    {{ method === 'Credit Card' ? 'Credit' : method }}
                  </button>
                }
              </div>
            </div>
            <!-- Date -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[11px] font-bold text-slate-500 tracking-widest uppercase">Date</label>
              <button
                type="button"
                (click)="isDatePickerOpen = true"
                class="active:scale-[0.98] transition-all duration-200 w-full bg-white border-2 text-slate-900 font-semibold text-sm rounded-2xl flex justify-between items-center p-3 px-4 outline-none transition-all touch-manipulation shadow-sm" [ngClass]="[theme.focusBorder, theme.focusRing, theme.surfaceBorder]"
              >
                <div class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-slate-400"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
                  <span>{{ $safeNavigationMigration(expenseForm.get('date')?.value) | date: 'MMM d, y, h:mm a' }}</span>
                </div>
                <svg class="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
              </button>
            </div>
            

            <!-- Bottom Buttons -->
            <div class="mt-6 flex gap-3 pb-2">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-bold rounded-2xl border-2 transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-white text-slate-700 text-center shadow-sm" [ngClass]="theme.surfaceBorder"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!expenseForm.valid || isSaving() || isDeleting()"
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm text-white shadow-md disabled:opacity-50 disabled:active:scale-100" [ngClass]="theme.bg"
              >
                @if (isSaving()) {
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                }
                <span>{{ isSaving() ? 'Saving...' : isEditing ? 'Update Expense' : 'Save Expense' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Global Date Picker for Form -->
    <app-date-picker
      [isOpen]="isDatePickerOpen"
      [initialDate]="$safeNavigationMigration(expenseForm.get('date')?.value)"
      (dateSelected)="onDateSelected($event)"
      (closed)="isDatePickerOpen = false"
    >
    </app-date-picker>
  `,
})
export class BottomSheetComponent implements OnInit {

  router = inject(Router);

  get theme() {
    const route = this.router.url.split('/')[1] || 'dashboard';
    const t = (p: string) => ({
      text: `text-${p}-primary`, bg: `bg-${p}-primary`, border: `border-${p}-primary`, 
      focusBorder: `focus:border-${p}-primary`, focusRing: `focus:ring-4 focus:ring-${p}-primary/15`, 
      shadow: `shadow-${p}-primary/20`, 
      activeBg: `bg-${p}-primary text-white border-${p}-primary shadow-md shadow-${p}-primary/20`,
      surfaceBg: `bg-white`, surfaceBorder: `border-gray-100`
    });
    switch (route) {
      case 'expenses': return t('expense');
      case 'budgets': return t('budget');
      case 'friends': return t('friends');
      case 'splits': return t('splits');
      case 'subscriptions': return t('subscriptions');
      case 'goals': 
      case 'goal-transactions': return t('goals');
      case 'ledger': 
      case 'ledger-details': return t('ledger');
      case 'tracker': return t('tracker');
      case 'profile': return t('profile');
      case 'reports': return t('reports');
      default: return t('expense');
    }
  }

  expenseService = inject(ExpenseService);
  budgetService = inject(BudgetService);
  goalService = inject(GoalService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);
  private haptic = inject(HapticService);
  private fb = inject(FormBuilder);
  private supabaseService = inject(SupabaseService);

  expenseForm!: FormGroup;
  isEditing = false;
  isDatePickerOpen = false;
  isSaving = signal(false);
  isDeleting = signal(false);

  @ViewChild('scrollCat') scrollCat?: ElementRef;
  @ViewChild('scrollCatLoading') scrollCatLoading?: ElementRef;

  showLeftFade = signal(false);
  showRightFade = signal(false);
  showLeftFadeLoading = signal(false);
  showRightFadeLoading = signal(false);

  selectedMonth = signal<string>('');

  budgetCategories = computed(() => {
    const month = this.selectedMonth();
    const cache = this.budgetService.budgetsCache();
    const fetchedBudgets = cache[month] ? [...cache[month]] : [];
    const defaultCats = DEFAULT_CATEGORIES;
    if (fetchedBudgets.length === 0) return defaultCats;
    
    const editing = this.expenseService.editingExpense();
    if (editing && editing.category) {
      const exists = fetchedBudgets.some(b => b.name.toLowerCase() === editing.category.toLowerCase());
      if (!exists) {
        const defaultCat = DEFAULT_CATEGORIES.find(c => c.name.toLowerCase() === editing.category.toLowerCase());
        fetchedBudgets.unshift({
          id: 'virtual-editing',
          name: editing.category,
          amount: 0,
          icon_path: defaultCat ? defaultCat.path : '',
          month: month,
          auto_rollover: false,
        } as any);
      }
    }

    const hasOthers = fetchedBudgets.some(
      (b: any) => b.name.toLowerCase() === 'others' || b.name.toLowerCase() === 'other'
    );

    if (!hasOthers) {
      fetchedBudgets.push({
        id: 'virtual-others',
        name: 'Others',
        amount: 0,
        icon_path: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
        month: month,
        auto_rollover: false,
      } as any);
    }

    return this.budgetService.sortCategories(fetchedBudgets.map((b) => {
      let iconPath = b.icon_path;
      return {
        name: b.name,
        path:
          iconPath ||
          'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
      };
    }));
  });

  constructor() {
    effect(() => {
      const month = this.selectedMonth();
      const isOpen = this.expenseService.isBottomSheetOpen();
      if (month && isOpen) {
        untracked(() => {
          this.budgetService.fetchBudgets(month);
        });
      }
    });

    effect(() => {
      const isLoading = this.budgetService.isLoading();
      // Check scrolls after categories have rendered
      untracked(() => {
        setTimeout(() => this.checkScrolls(), 50);
      });
    });

    effect(() => {
      const isOpen = this.expenseService.isBottomSheetOpen();
      const editing = this.expenseService.editingExpense();

      if (isOpen) {
        if (!this.expenseForm) {
          this.initForm();
        } else {
          this.isEditing = !!(editing && editing.id);
          const dateStr = editing?.date ? editing.date : new Date().toISOString();
          const d = editing?.date ? new Date(editing.date) : new Date();
          const y = d.getFullYear();
          const m = (d.getMonth() + 1).toString().padStart(2, '0');
          this.selectedMonth.set(`${y}-${m}`);
          this.expenseForm.reset({
            title: editing?.title || '',
            amount: editing?.amount || null,
            category: editing?.category || 'Others',
            date: dateStr,
            paid_via: editing?.paid_via || 'UPI',
          });
        }
        untracked(() => {
          setTimeout(() => this.checkScrolls(), 100);
        });
      }
    });
  }

  ngOnInit() {
    if (!this.expenseForm) {
      this.initForm();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.checkScrolls(), 100);
  }

  checkScrolls() {
    if (this.scrollCat?.nativeElement) {
      this.updateScrollState(this.scrollCat.nativeElement, true);
    }
    if (this.scrollCatLoading?.nativeElement) {
      this.updateScrollState(this.scrollCatLoading.nativeElement, false);
    }
  }

  updateScrollState(target: any, isLoaded: boolean) {
    if (!target) return;
    const isAtStart = target.scrollLeft <= 0;
    const isAtEnd = target.scrollLeft >= target.scrollWidth - target.clientWidth - 1;
    const hasScroll = target.scrollWidth > target.clientWidth;
    
    if (isLoaded) {
      this.showLeftFade.set(!isAtStart && hasScroll);
      this.showRightFade.set(!isAtEnd && hasScroll);
    } else {
      this.showLeftFadeLoading.set(!isAtStart && hasScroll);
      this.showRightFadeLoading.set(!isAtEnd && hasScroll);
    }
  }

  getMaskImage(isLoaded: boolean): string {
    const left = isLoaded ? this.showLeftFade() : this.showLeftFadeLoading();
    const right = isLoaded ? this.showRightFade() : this.showRightFadeLoading();
    
    if (left && right) {
      return 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)';
    } else if (left) {
      return 'linear-gradient(to right, transparent, black 24px, black)';
    } else if (right) {
      return 'linear-gradient(to right, black, black calc(100% - 24px), transparent)';
    } else {
      return 'none';
    }
  }

  private initForm() {
    const editing = this.expenseService.editingExpense();
    this.isEditing = !!(editing && editing.id);

    const dateStr = editing?.date ? editing.date : new Date().toISOString();
    const d = editing?.date ? new Date(editing.date) : new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    this.selectedMonth.set(`${y}-${m}`);

    this.expenseForm = this.fb.group({
      title: [
        { value: editing?.title || '', disabled: editing?.category === 'virtual-invest' },
        Validators.required,
      ],
      amount: [editing?.amount || null, [Validators.required, Validators.min(0.01)]],
      category: [
        { value: editing?.category || 'Others', disabled: editing?.category === 'virtual-invest' },
        Validators.required,
      ],
      paid_via: [editing?.paid_via || 'UPI', Validators.required],
      date: [dateStr, Validators.required],
    });
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  close() {
    this.haptic.impactLight();
    this.expenseService.closeBottomSheet();
  }

  onDateSelected(dateStr: string) {
    const existingDateVal = this.expenseForm.get('date')?.value;
    const dateObj = existingDateVal ? new Date(existingDateVal) : new Date();

    // dateStr is YYYY-MM-DD
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      dateObj.setFullYear(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      this.selectedMonth.set(`${year}-${month}`);
    }

    this.expenseForm.patchValue({ date: dateObj.toISOString() });
  }

  selectBudget(cat: { name: string; path: string }) {
    this.expenseForm.patchValue({ category: cat.name });
  }

  delete() {
    if (this.isEditing) {
      this.confirmService.open({
        title: 'Delete Expense',
        message: 'Are you sure you want to delete this expense? This action cannot be undone.',
        confirmText: 'Delete',
        onConfirm: async () => {
          this.haptic.impactMedium();
          this.isDeleting.set(true);
          const original = this.expenseService.editingExpense()!;
          const id = original.id;
          const success = await this.expenseService.deleteExpense(id);
          this.isDeleting.set(false);

          if (success) {
            if (original.category === 'virtual-invest') {
              const goalName = original.title.replace('Goal: ', '');
              const goal = this.goalService.goals().find((g) => g.name === goalName);
              if (goal) {
                await this.goalService.updateGoal(
                  goal.id,
                  { saved_amount: goal.saved_amount - original.amount },
                  true,
                );
              }
            }
            this.haptic.success();
            this.close();
          } else {
            this.haptic.error();
          }
        },
      });
    }
  }

  async onSubmit() {
    if (this.expenseForm.valid && !this.isSaving()) {
      this.isSaving.set(true);
      const formValue = this.expenseForm.getRawValue();
      const expenseData = {
        title: formValue.title,
        amount: Number(formValue.amount),
        category: formValue.category || 'Others',
        paid_via: formValue.paid_via || 'UPI',
        date: new Date(formValue.date).toISOString(),
      };

      let success = false;
      if (this.isEditing) {
        const original = this.expenseService.editingExpense()!;
        const id = original.id;
        success = await this.expenseService.updateExpense(id, expenseData);
        if (success && original.category === 'virtual-invest') {
          const goalName = original.title.replace('Goal: ', '');
          const goal = this.goalService.goals().find((g) => g.name === goalName);
          if (goal) {
            const diff = expenseData.amount - original.amount;
            if (diff !== 0) {
              await this.goalService.updateGoal(
                goal.id,
                { saved_amount: goal.saved_amount + diff },
                true,
              );
            }
          }
        }
      } else {
        success = await this.expenseService.addExpense(expenseData);
      }

      this.isSaving.set(false);

      if (success) {
        this.haptic.success();
        this.close();
      } else {
        this.haptic.error();
      }
    }
  }
}
