import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
  effect,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { ConfirmService } from '../../../core/services/confirm.service';
import { SubscriptionService, Subscription } from '../../../core/services/subscription.service';
import { BudgetService } from '../../../core/services/budget.service';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { AmountInputDirective } from '../amount-input.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';
import { SafeInputDirective } from '../safe-input.directive';
import { DayPickerComponent } from '../day-picker/day-picker.component';
import { IconSuggesterComponent } from '../icon-suggester/icon-suggester.component';
import { IconService } from '../../../core/services/icon.service';

@Component({
  selector: 'app-subscription-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SwipeToCloseDirective,
    AmountInputDirective,
    AutofocusDirective,
    SafeInputDirective,
    DatePickerComponent,
    DayPickerComponent,
    IconSuggesterComponent,
  ],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(100%)' })),
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
    @if (subscriptionService.isBottomSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="active:scale-[0.98] transition-all duration-200 fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        @slideUp
        appSwipeToClose
        (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 z-[70] max-h-[95vh] flex flex-col rounded-t-[32px] shadow-2xl bg-white overflow-hidden"
        style="padding-bottom: env(safe-area-inset-bottom);"
      >
        <!-- Header -->
        <div class="flex justify-between items-center py-4 px-6 text-white bg-subscriptions-primary rounded-t-[32px] sticky top-0 z-10 shrink-0 shadow-sm">
          <h2 class="text-lg font-bold tracking-wide">
            {{
              subscriptionService.editingSubscription()?.id
                ? 'Edit Subscription'
                : 'Add Subscription'
            }}
          </h2>
          @if (subscriptionService.editingSubscription()?.id) {
            <button
              type="button"
              (click)="onDelete()"
              [disabled]="isDeleting()"
              class="w-8 h-8 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 transition-all rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95"
            >
              @if (isDeleting()) {
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              } @else {
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            </button>
          }
        </div>

        <div class="p-6 bg-white flex-1 overflow-y-auto overscroll-none pb-6" style="scrollbar-width: none;">
          @if (subscriptionService.editingSubscription()?.id) {
            <div class="flex justify-center mb-5">
              <span
                class="text-[10px] font-bold tracking-wide uppercase text-subscriptions-dark bg-subscriptions-surface px-3 py-1 rounded-full border border-subscriptions-primary/10"
              >
                @if (isUpdated()) {
                  Updated
                  {{
                    $safeNavigationMigration(subscriptionService.editingSubscription()?.updated_at)
                      | date: 'medium'
                  }}
                } @else {
                  Added
                  {{
                    $safeNavigationMigration(subscriptionService.editingSubscription()?.created_at)
                      | date: 'medium'
                  }}
                }
              </span>
            </div>
          }
          <form [formGroup]="subForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label
                class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                >Name</label
              >
              <input
                appSafeInput
                type="text"
                formControlName="title"
                placeholder="e.g. Netflix, Gym"
                class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl px-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400 focus:border-subscriptions-primary focus:ring-4 focus:ring-subscriptions-primary/15"
              />
            </div>

            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-1.5">
                <label
                  class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Amount</label
                >
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span class="text-gray-400 font-bold text-xl">₹</span>
                  </div>
                  <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    appAmountInput
                    formControlName="amount"
                    placeholder="0"
                    (keydown)="preventE($event)"
                    class="w-full bg-white border-2 border-gray-100 text-slate-900 font-bold text-2xl rounded-2xl pl-10 pr-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-300 focus:border-subscriptions-primary focus:ring-4 focus:ring-subscriptions-primary/15"
                  />
                </div>
              </div>

              <div class="w-32 flex flex-col gap-1.5">
                <label
                  class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Billing Day</label
                >
                <button
                  type="button"
                  (click)="isDayPickerOpen = true"
                  class="active:scale-[0.98] transition-all duration-200 w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl focus:border-subscriptions-primary focus:ring-4 focus:ring-subscriptions-primary/15 flex justify-between items-center px-4 py-3 outline-none touch-manipulation shadow-sm"
                >
                  <span>{{ subForm.get('billing_day')?.value || 1 }}</span>
                  <svg
                    class="fill-current h-4 w-4 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <app-icon-suggester
              [inputText]="subForm.get('title')?.value || ''"
              [selectedIconId]="subForm.get('icon')?.value"
              (iconSelected)="subForm.patchValue({ icon: $event })"
              (iconCleared)="subForm.patchValue({ icon: null })"
            ></app-icon-suggester>

            <div class="mt-6 flex gap-3">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-transparent text-slate-500 text-center hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!subForm.valid || isSaving() || isDeleting()"
                class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-subscriptions-primary text-white shadow-md shadow-subscriptions-primary/30 disabled:opacity-50 disabled:active:scale-100"
              >
                @if (isSaving()) {
                  <svg
                    class="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                }
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    }


    <app-day-picker
      [isOpen]="isDayPickerOpen"
      [initialDay]="$safeNavigationMigration(subForm.get('billing_day')?.value)"
      themeClass="bg-subscriptions-primary text-white shadow-subscriptions-primary/30"
      (daySelected)="subForm.patchValue({ billing_day: $event }); isDayPickerOpen = false"
      (closed)="isDayPickerOpen = false"
    ></app-day-picker>
  `,
})
export class SubscriptionSheetComponent implements OnInit, AfterViewInit {
  subscriptionService = inject(SubscriptionService);
  budgetService = inject(BudgetService);
  confirmService = inject(ConfirmService);
  iconService = inject(IconService);
  fb = inject(FormBuilder);
  haptic = inject(HapticService);

  isSaving = signal(false);
  isDeleting = signal(false);
  isDayPickerOpen = false;
  
  @ViewChild('scrollCat') scrollCat!: ElementRef;

  subForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(1)]],
    category: ['Others'],
    icon: [null as string | null],
    billing_day: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    created_at: [new Date().toISOString(), Validators.required],
  });

  budgetCategories = computed(() => {
    const categories = this.budgetService
      .budgets()
      .filter((b) => b.id !== 'virtual-others')
      .map((b) => ({
        name: b.name,
        path:
          b.icon_path ||
          'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
      }));
    return this.budgetService.sortCategories(categories);
  });

  constructor() {
    effect(() => {
      const isOpen = this.subscriptionService.isBottomSheetOpen();
      const editing = this.subscriptionService.editingSubscription();
      if (isOpen) {
        if (editing) {
          this.subForm.patchValue({
            title: editing.title,
            amount: editing.amount.toString(),
            category: editing.category,
            icon: editing.icon || null,
            billing_day: editing.billing_day,
            created_at: editing.created_at || new Date().toISOString(),
          });
        } else {
          const currentCreatedAt = this.subForm?.get('created_at')?.value || new Date().toISOString();
          this.subForm.reset({ billing_day: 1, category: 'Others', icon: null, created_at: currentCreatedAt });
        }
      }
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {}

  isUpdated(): boolean {
    const sub = this.subscriptionService.editingSubscription();
    if (!sub || !sub.created_at || !sub.updated_at) return false;
    const diff = Math.abs(new Date(sub.updated_at).getTime() - new Date(sub.created_at).getTime());
    return diff > 5000;
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  close() {
    this.subForm.reset({
      billing_day: 1,
      category: 'Others',
      icon: null,
      created_at: new Date().toISOString(),
    });
    this.subscriptionService.closeBottomSheet();
  }

  async onSubmit() {
    if (this.subForm.invalid) return;
    this.haptic.impactLight();
    this.isSaving.set(true);

    const subData = this.subForm.value;
    
    // Auto-assign icon and category if not explicitly selected
    const selectedIconId = subData.icon;
    let assignedIcon = this.iconService.getIconById(selectedIconId || '');
    if (!selectedIconId) {
      assignedIcon = this.iconService.getSuggestedIcons(subData.title)[0];
      subData.icon = assignedIcon?.id || null;
    }
    // Update category to match the icon's generic name for budgeting
    subData.category = assignedIcon?.name || 'Others';

    const editing = this.subscriptionService.editingSubscription();

    let success = false;
    if (editing?.id) {
      success = await this.subscriptionService.updateSubscription(editing.id, {
        title: subData.title,
        amount: Number(subData.amount),
        category: subData.category || 'Others',
        icon: subData.icon || null,
        billing_day: Number(subData.billing_day),
        created_at: subData.created_at,
      });
    } else {
      success = await this.subscriptionService.addSubscription({
        title: subData.title,
        amount: Number(subData.amount),
        category: subData.category || 'Others',
        icon: subData.icon || null,
        billing_day: Number(subData.billing_day),
        created_at: subData.created_at,
      });
    }

    this.isSaving.set(false);
    if (success) {
      this.close();
    }
  }

  async onDelete() {
    const editing = this.subscriptionService.editingSubscription();
    if (!editing?.id) return;

    this.confirmService.open({
      title: 'Delete Subscription',
      message: 'Are you sure you want to delete this subscription?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        this.isDeleting.set(true);
        const success = await this.subscriptionService.deleteSubscription(editing.id);
        this.isDeleting.set(false);
        if (success) {
          this.close();
        }
      },
    });
  }
}
