import {
  Component,
  inject,
  computed,
  signal,
  OnInit,
  effect,
  ChangeDetectionStrategy,
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
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (subscriptionService.isBottomSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        @slideUp
        appSwipeToClose
        (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 bg-black z-[70] max-h-[95vh] overflow-y-auto overscroll-none flex flex-col shadow-2xl"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center py-4 px-6 bg-subscriptions-primary border-b border-subscriptions-dark text-white sticky top-[-2px] z-10"
        >
          <h2 class="text-xl font-extrabold tracking-tight">
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
              class="w-8 h-8 bg-red-500 flex items-center justify-center border-2 border-transparent hover:border-white transition-colors rounded-none text-white disabled:opacity-70"
            >
              @if (isDeleting()) {
                <svg
                  class="animate-spin h-4 w-4 text-white"
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
              } @else {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              }
            </button>
          }
        </div>
        <div class="p-6 bg-white flex-1">
          @if (subscriptionService.editingSubscription()?.id) {
            <div class="flex justify-center mb-5">
              <span
                class="text-[9px] font-extrabold tracking-widest uppercase text-subscriptions-dark bg-subscriptions-surface px-3 py-1 rounded-none"
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
            <div class="flex flex-col gap-1">
              <label
                class="text-[11px] font-semibold text-subscriptions-dark tracking-widest uppercase"
                >Name</label
              >
              <input
                [appAutofocus]="!subscriptionService.editingSubscription()?.id"
                appSafeInput
                type="text"
                formControlName="title"
                placeholder="e.g. Netflix, Gym"
                class="w-full bg-subscriptions-surface text-subscriptions-dark text-sm rounded-none focus:ring-2 focus:ring-subscriptions-primary focus:outline-none block p-2.5 transition-all placeholder-subscriptions-dark/50 min-h-[44px] touch-manipulation font-sans"
              />
            </div>

            <div class="flex gap-4">
              <div class="flex-1 flex flex-col gap-1">
                <label
                  class="text-[11px] font-semibold text-subscriptions-dark tracking-widest uppercase"
                  >Amount</label
                >
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 font-medium">₹</span>
                  </div>
                  <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    appAmountInput
                    formControlName="amount"
                    placeholder="0"
                    (keydown)="preventE($event)"
                    class="w-full bg-subscriptions-surface text-subscriptions-dark text-sm rounded-none focus:ring-2 focus:ring-subscriptions-primary focus:outline-none block p-2.5 transition-all placeholder-subscriptions-dark/50 min-h-[44px] touch-manipulation font-sans pl-8"
                  />
                </div>
              </div>

              <div class="w-32 flex flex-col gap-1">
                <label
                  class="text-[11px] font-semibold text-subscriptions-dark tracking-widest uppercase"
                  >Billing Day</label
                >
                <button
                  type="button"
                  (click)="isDayPickerOpen = true"
                  class="w-full bg-subscriptions-surface text-subscriptions-dark text-sm rounded-none focus:ring-2 focus:ring-subscriptions-primary flex justify-between items-center p-2.5 outline-none transition-all min-h-[44px] font-sans"
                >
                  <span>{{ subForm.get('billing_day')?.value || 1 }}</span>
                  <svg
                    class="fill-current h-4 w-4 text-gray-700"
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

            <div class="flex flex-col gap-1">
              <label
                class="text-[11px] font-semibold text-subscriptions-dark tracking-widest uppercase"
                >Category</label
              >
              <div class="grid grid-cols-4 gap-2">
                @for (cat of budgetCategories(); track cat.name) {
                  <button
                    type="button"
                    (click)="selectCategory(cat.name)"
                    class="flex flex-col items-center justify-center gap-1 p-2 rounded-none transition-all min-h-[60px]"
                    [ngClass]="
                      subForm.get('category')?.value === cat.name
                        ? 'bg-subscriptions-primary text-white'
                        : 'bg-subscriptions-surface text-subscriptions-dark hover:bg-subscriptions-light'
                    "
                  >
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      viewBox="0 0 24 24"
                    >
                      <path [attr.d]="cat.path"></path>
                    </svg>
                    <span
                      class="text-[9px] font-semibold uppercase tracking-wider text-center line-clamp-1 w-full overflow-hidden text-ellipsis"
                      >{{ cat.name }}</span
                    >
                  </button>
                }
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <label
                class="text-[11px] font-semibold text-subscriptions-dark tracking-widest uppercase"
                >Date added</label
              >
              <button
                type="button"
                (click)="isDatePickerOpen = true"
                class="w-full bg-subscriptions-surface text-subscriptions-dark text-sm rounded-none focus:ring-2 focus:ring-subscriptions-primary p-2.5 outline-none transition-all min-h-[44px] touch-manipulation font-sans flex justify-between items-center text-left"
              >
                <span>{{
                  $safeNavigationMigration(subForm.get('created_at')?.value)
                    | date: 'MMM d, y, h:mm a'
                }}</span>
                <svg
                  class="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>

            <div class="mt-4 flex gap-4">
              <button
                type="button"
                (click)="close()"
                class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-subscriptions-surface text-subscriptions-dark hover:bg-subscriptions-light text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!subForm.valid || isSaving() || isDeleting()"
                class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-subscriptions-primary hover:bg-subscriptions-dark text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
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

    <app-date-picker
      [isOpen]="isDatePickerOpen"
      [initialDate]="$safeNavigationMigration(subForm.get('created_at')?.value)"
      (dateSelected)="onDateSelected($event)"
      (closed)="isDatePickerOpen = false"
    ></app-date-picker>
    <app-day-picker
      [isOpen]="isDayPickerOpen"
      [initialDay]="$safeNavigationMigration(subForm.get('billing_day')?.value)"
      (daySelected)="subForm.patchValue({ billing_day: $event }); isDayPickerOpen = false"
      (closed)="isDayPickerOpen = false"
    ></app-day-picker>
  `,
})
export class SubscriptionSheetComponent implements OnInit {
  subscriptionService = inject(SubscriptionService);
  budgetService = inject(BudgetService);
  confirmService = inject(ConfirmService);
  fb = inject(FormBuilder);
  haptic = inject(HapticService);

  isSaving = signal(false);
  isDeleting = signal(false);
  isDatePickerOpen = false;
  isDayPickerOpen = false;

  subForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(1)]],
    category: ['Others'],
    billing_day: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    created_at: [new Date().toISOString(), Validators.required],
  });

  budgetCategories = computed(() => {
    return this.budgetService
      .budgets()
      .filter((b) => b.id !== 'virtual-others')
      .map((b) => ({
        name: b.name,
        path:
          b.icon_path ||
          'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
      }));
  });

  constructor() {
    effect(() => {
      const editing = this.subscriptionService.editingSubscription();
      if (editing) {
        this.subForm.patchValue({
          title: editing.title,
          amount: editing.amount.toString(),
          category: editing.category,
          billing_day: editing.billing_day,
          created_at: editing.created_at || new Date().toISOString(),
        });
      } else {
        // preserve the originally generated created_at so we don't trigger NG0100
        const currentCreatedAt = this.subForm?.get('created_at')?.value || new Date().toISOString();
        this.subForm.reset({ billing_day: 1, category: 'Others', created_at: currentCreatedAt });
      }
    });
  }

  ngOnInit() {}

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

  onDateSelected(date: string) {
    this.subForm.patchValue({ created_at: date });
    this.isDatePickerOpen = false;
  }

  selectCategory(categoryName: string) {
    this.haptic.impactLight();
    this.subForm.patchValue({ category: categoryName });
  }

  close() {
    this.subForm.reset({
      billing_day: 1,
      category: 'Others',
      created_at: new Date().toISOString(),
    });
    this.subscriptionService.closeBottomSheet();
  }

  async onSubmit() {
    if (this.subForm.invalid) return;
    this.haptic.impactLight();
    this.isSaving.set(true);

    const val = this.subForm.value;
    const editing = this.subscriptionService.editingSubscription();

    let success = false;
    if (editing?.id) {
      success = await this.subscriptionService.updateSubscription(editing.id, {
        title: val.title,
        amount: Number(val.amount),
        category: val.category || 'Others',
        billing_day: Number(val.billing_day),
        created_at: val.created_at,
        updated_at: new Date().toISOString(),
      });
    } else {
      success = await this.subscriptionService.addSubscription({
        title: val.title,
        amount: Number(val.amount),
        category: val.category || 'Others',
        billing_day: Number(val.billing_day),
        created_at: val.created_at,
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
