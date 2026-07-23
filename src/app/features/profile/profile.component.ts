import { Component, inject, signal, computed, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { SafeInputDirective } from '../../shared/ui/safe-input.directive';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickActionsService } from '../../core/services/quick-actions.service';
import { AccountTrackerService } from '../../core/services/account-tracker.service';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeInputDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="h-full overflow-y-auto bg-gray-50 px-4 pt-4 flex flex-col gap-8 pb-28">
      <!-- Top Selected Avatar & Selection List -->
      <div class="flex flex-col items-center gap-6 mt-4">
        <div
          class="w-32 h-32 border-2 border-profile-dark rounded-none bg-gray-200 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <img
            [src]="getSelectedAvatarUrl()"
            alt="Active Avatar"
            class="w-full h-full object-cover"
          />
        </div>

        <div class="w-full flex flex-col gap-3">
          <h3 class="text-xs font-extrabold tracking-widest uppercase text-black">Choose Avatar</h3>
          <div class="flex overflow-x-auto gap-4 py-2 px-1 no-scrollbar">
            @for (avatar of authService.avatars; track avatar) {
              <button
                (click)="selectAvatar(avatar.id)"
                class="flex-shrink-0 w-20 h-20 border-2 rounded-none flex items-center justify-center transition-transform duration-300 overflow-hidden"
                [ngClass]="
                  pendingProfile().avatarId === avatar.id
                    ? 'border-black scale-110 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'border-transparent hover:scale-105 bg-gray-200'
                "
              >
                <img [src]="avatar.url" alt="Avatar" class="w-full h-full object-cover" />
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Form Elements -->
      <div class="flex flex-col gap-6">
        <!-- Editable Name -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
            >Full Name</label
          >
          <div class="relative group">
            <input
              type="text"
              [ngModel]="pendingProfile().name"
              (ngModelChange)="updateField('name', $event)"
              class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-black hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans"
              placeholder="e.g. Jane Doe"
              appSafeInput
            />
          </div>
        </div>

        <!-- Non-editable Username -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
            >Username</label
          >
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500 font-medium">@</span>
            </div>
            <input
              type="text"
              [value]="pendingProfile().username"
              disabled
              class="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8 opacity-50 cursor-not-allowed"
            />
          </div>
        </div>

        <!-- Non-editable Email -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
            >Email</label
          >
          <div class="relative group">
            <input
              type="text"
              [value]="pendingProfile().email"
              disabled
              class="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans opacity-50 cursor-not-allowed"
            />
          </div>
        </div>

        <!-- Section: Account Balances (3 Types) -->
        <div class="border-t-2 border-black pt-5 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black tracking-widest uppercase text-sky-600">
              Account Balances (3 Types)
            </h3>
            <span class="text-[10px] font-bold text-gray-400">Set initial balances</span>
          </div>

          <!-- 1. Salary Account / Monthly Salary -->
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-extrabold text-gray-700 tracking-widest uppercase flex items-center gap-1.5">
              <span>Salary Account / Monthly Salary</span>
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 font-bold">₹</span>
              </div>
              <input
                type="text"
                inputmode="numeric"
                [ngModel]="formattedSalary"
                (ngModelChange)="formatSalary($event)"
                class="w-full bg-white border-2 border-black text-gray-900 text-sm font-bold rounded-none focus:ring-0 focus:border-sky-500 hover:border-gray-400 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8 pr-12"
                placeholder="0"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-400 text-xs font-bold">INR</span>
              </div>
            </div>
          </div>

          <!-- 2. Cash Account Balance -->
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-extrabold text-gray-700 tracking-widest uppercase flex items-center gap-1.5">
              <span>Cash Account Balance</span>
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 font-bold">₹</span>
              </div>
              <input
                type="text"
                inputmode="numeric"
                [ngModel]="formattedCash"
                (ngModelChange)="formatCash($event)"
                class="w-full bg-white border-2 border-black text-gray-900 text-sm font-bold rounded-none focus:ring-0 focus:border-amber-500 hover:border-gray-400 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8 pr-12"
                placeholder="0"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-400 text-xs font-bold">INR</span>
              </div>
            </div>
          </div>

          <!-- 3. Savings Account Balance -->
          <div class="flex flex-col gap-1">
            <label class="text-[11px] font-extrabold text-gray-700 tracking-widest uppercase flex items-center gap-1.5">
              <span>Savings Account Balance</span>
            </label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 font-bold">₹</span>
              </div>
              <input
                type="text"
                inputmode="numeric"
                [ngModel]="formattedSavings"
                (ngModelChange)="formatSavings($event)"
                class="w-full bg-white border-2 border-black text-gray-900 text-sm font-bold rounded-none focus:ring-0 focus:border-emerald-500 hover:border-gray-400 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8 pr-12"
                placeholder="0"
              />
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-400 text-xs font-bold">INR</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Preferences Section -->
        <div class="border-t-2 border-black pt-4 flex flex-col gap-4">
          <!-- Mask Values Preference -->
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                >Mask Values</label
              >
              <span class="text-[10px] font-semibold text-gray-500 mt-0.5"
                >Hide dashboard numbers on every visit</span
              >
            </div>
            <button
              type="button"
              (click)="toggleMaskValues()"
              class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-none border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
              [ngClass]="pendingProfile().maskValues ? 'bg-black' : 'bg-gray-200'"
              role="switch"
              [attr.aria-checked]="pendingProfile().maskValues"
            >
              <span
                aria-hidden="true"
                class="pointer-events-none inline-block h-5 w-5 transform rounded-none bg-white shadow ring-0 transition duration-200 ease-in-out"
                [ngClass]="pendingProfile().maskValues ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>

          <!-- Configure Email Reports -->
          <div class="flex flex-col gap-3">
            <div class="flex flex-col">
              <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
                >Email Reports</label
              >
              <span class="text-[10px] font-semibold text-gray-500 mt-0.5"
                >Receive automated summaries of your expenses</span
              >
            </div>
            <div
              class="flex border-2 border-black rounded-none overflow-hidden text-[11px] font-bold w-full"
            >
              <button
                (click)="updateField('emailReportFrequency', 'none')"
                [class.bg-black]="pendingProfile().emailReportFrequency === 'none'"
                [class.text-white]="pendingProfile().emailReportFrequency === 'none'"
                [class.text-gray-500]="pendingProfile().emailReportFrequency !== 'none'"
                [class.bg-white]="pendingProfile().emailReportFrequency !== 'none'"
                class="px-3 py-2.5 transition-colors text-center"
              >
                Off
              </button>
              <button
                (click)="updateField('emailReportFrequency', 'weekly')"
                [class.bg-black]="pendingProfile().emailReportFrequency === 'weekly'"
                [class.text-white]="pendingProfile().emailReportFrequency === 'weekly'"
                [class.text-gray-500]="pendingProfile().emailReportFrequency !== 'weekly'"
                [class.bg-white]="pendingProfile().emailReportFrequency !== 'weekly'"
                class="flex-1 py-2.5 border-l-2 border-r-2 border-black transition-colors text-center"
              >
                Weekly
              </button>
              <button
                (click)="updateField('emailReportFrequency', 'monthly')"
                [class.bg-black]="pendingProfile().emailReportFrequency === 'monthly'"
                [class.text-white]="pendingProfile().emailReportFrequency === 'monthly'"
                [class.text-gray-500]="pendingProfile().emailReportFrequency !== 'monthly'"
                [class.bg-white]="pendingProfile().emailReportFrequency !== 'monthly'"
                class="flex-1 py-2.5 transition-colors text-center"
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

      </div>

      <!-- Update Button -->
      <button
        [disabled]="!isDirty() || isUpdating()"
        (click)="handleUpdate()"
        class="w-full bg-slate-900 text-white p-4 font-black text-sm tracking-widest uppercase transition-all rounded-2xl shadow-xl hover:bg-slate-800 active:scale-95 mt-2 disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        @if (isUpdating()) {
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
          Updating Profile & Accounts...
        } @else {
          Update Profile & Accounts
        }
      </button>
    </div>
  `,
})
export class Profile {
  authService = inject(AuthService);
  accountTrackerService = inject(AccountTrackerService);
  private supabaseService = inject(SupabaseService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);
  quickActionsService = inject(QuickActionsService);

  pendingProfile = signal<UserProfile>({ ...this.authService.userProfile() });
  cashVal = signal<number>(this.accountTrackerService.cashBalance());
  savingsVal = signal<number>(this.accountTrackerService.savingsBalance());
  isUpdating = signal(false);

  constructor() {
    // Sync account balances when data loads from the service
    effect(() => {
      const cb = this.accountTrackerService.cashBalance();
      const sb = this.accountTrackerService.savingsBalance();
      const profile = this.authService.userProfile();
      
      untracked(() => {
        this.cashVal.set(cb);
        this.savingsVal.set(sb);
        if (profile) {
          this.pendingProfile.set({ ...profile });
        }
      });
    });
  }
  isDirty = computed(() => {
    const current = this.authService.userProfile();
    const pending = this.pendingProfile();
    const currentCash = this.accountTrackerService.cashBalance();
    const currentSavings = this.accountTrackerService.savingsBalance();

    return (
      current.name !== pending.name ||
      current.salary !== pending.salary ||
      current.avatarId !== pending.avatarId ||
      current.maskValues !== pending.maskValues ||
      current.emailReportFrequency !== pending.emailReportFrequency ||
      currentCash !== this.cashVal() ||
      currentSavings !== this.savingsVal()
    );
  });

  getSelectedAvatarUrl(): string {
    return this.authService.getAvatarUrl(this.pendingProfile().avatarId);
  }

  selectAvatar(id: number) {
    this.pendingProfile.update((p) => ({ ...p, avatarId: id }));
  }

  updateField(field: keyof UserProfile, value: any) {
    this.pendingProfile.update((p) => ({ ...p, [field]: value }));
  }

  toggleMaskValues() {
    this.pendingProfile.update((p) => ({ ...p, maskValues: !p.maskValues }));
  }

  get formattedSalary(): string {
    const val = this.pendingProfile().salary;
    if (!val) return '';
    return new Intl.NumberFormat('en-IN').format(val);
  }

  formatSalary(value: string) {
    if (!value) {
      this.updateField('salary', 0);
      return;
    }
    let rawValue = value.toString().replace(/[^0-9]/g, '');
    if (!rawValue) {
      this.updateField('salary', 0);
      return;
    }
    if (parseInt(rawValue) > 999999) {
      rawValue = '999999';
    }
    this.updateField('salary', parseInt(rawValue));
  }

  get formattedCash(): string {
    const val = this.cashVal();
    if (!val) return '';
    return new Intl.NumberFormat('en-IN').format(val);
  }

  formatCash(value: string) {
    if (!value) {
      this.cashVal.set(0);
      return;
    }
    let rawValue = value.toString().replace(/[^0-9]/g, '');
    if (!rawValue) {
      this.cashVal.set(0);
      return;
    }
    if (parseInt(rawValue) > 999999) {
      rawValue = '999999';
    }
    this.cashVal.set(parseInt(rawValue));
  }

  get formattedSavings(): string {
    const val = this.savingsVal();
    if (!val) return '';
    return new Intl.NumberFormat('en-IN').format(val);
  }

  formatSavings(value: string) {
    if (!value) {
      this.savingsVal.set(0);
      return;
    }
    let rawValue = value.toString().replace(/[^0-9]/g, '');
    if (!rawValue) {
      this.savingsVal.set(0);
      return;
    }
    if (parseInt(rawValue) > 999999) {
      rawValue = '999999';
    }
    this.savingsVal.set(parseInt(rawValue));
  }

  async handleUpdate() {
    if (!this.isDirty() || this.isUpdating()) return;

    this.isUpdating.set(true);

    try {
      // 1. Update User Profile
      const success = await this.authService.updateProfile(this.pendingProfile());

      // 2. Update Account Balances in AccountTrackerService
      await this.accountTrackerService.setInitialBalances(
        this.pendingProfile().salary,
        this.cashVal(),
        this.savingsVal()
      );

      if (success) {
        this.toastService.showSuccess('Profile & Accounts updated successfully.', 2000);
      } else {
        this.toastService.showError("Couldn't update profile. Please try again.");
      }
    } catch (e) {
      console.error('Error updating profile & accounts:', e);
      this.toastService.showError("Couldn't update profile. Please try again.");
    } finally {
      this.isUpdating.set(false);
    }
  }
}
