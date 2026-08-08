import { Component, inject, signal, computed, effect, untracked, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { SafeInputDirective } from '../../shared/ui/safe-input.directive';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import { QuickActionsService } from '../../core/services/quick-actions.service';
import { AccountTrackerService } from '../../core/services/account-tracker.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeInputDirective],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
<div class="h-full bg-[#FAFAFA] flex flex-col overflow-y-auto select-none font-sans relative">
  <div class="p-4 flex flex-col gap-4 pb-32">
    
    <!-- Top Profile Card (Avatar + Info) -->
    <div class="bg-profile-primary/10 rounded-[24px] p-5 border border-profile-primary/20 shadow-sm flex items-center gap-4 relative overflow-hidden">
      <!-- Background decorative shape -->
      <div class="absolute -top-16 -left-16 w-48 h-48 bg-[#F4F2FF] rounded-full blur-[40px] pointer-events-none"></div>

      <!-- Avatar -->
      <div class="relative shrink-0 z-10">
        <div class="w-[84px] h-[84px] rounded-full p-[3px] bg-white shadow-sm border border-slate-100">
          <div class="w-full h-full rounded-full overflow-hidden bg-profile-primary/10">
            <img [src]="getSelectedAvatarUrl()" alt="Avatar" class="w-full h-full object-cover" />
          </div>
        </div>
        <button (click)="isAvatarSheetOpen.set(true)" class="active:scale-[0.98] transition-all duration-200 absolute bottom-0 right-0 w-[28px] h-[28px] bg-profile-primary text-white rounded-full flex items-center justify-center border-[2.5px] border-white shadow-sm transition-transform">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </button>
      </div>

      <!-- Info -->
      <div class="flex flex-col flex-1 z-10 w-full overflow-hidden">
        <div class="flex items-center justify-between group">
          <input type="text" [ngModel]="pendingProfile().name" (ngModelChange)="updateField('name', $event)"
            class="w-full bg-transparent text-gray-900 font-extrabold text-[20px] leading-tight focus:outline-none focus:border-b focus:border-profile-primary transition-all truncate placeholder-gray-300"
            maxlength="20" placeholder="Your Name" appSafeInput />
          <div class="text-gray-300 group- transition-colors ml-2 pointer-events-none shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </div>
        </div>
        <span class="text-[13px] text-profile-primary font-medium mt-0.5 mb-2 truncate">&#64;{{ pendingProfile().username }}</span>
      </div>
    </div>
      
    <!-- User Info Box -->
    <div class="bg-profile-primary/10 rounded-[24px] p-5 border border-profile-primary/20 flex flex-col gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
      
      <!-- Email -->
      <div class="flex items-center gap-4">
        <div class="w-[42px] h-[42px] rounded-2xl bg-[#F4F2FF] flex items-center justify-center text-profile-primary shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-gray-500">Email Address</span>
          <span class="text-gray-900 font-bold text-[13px]">{{ pendingProfile().email }}</span>
        </div>
      </div>
      
      <div class="h-px w-full bg-indigo-100/50"></div>

      <!-- Member Since -->
      <div class="flex items-center gap-4">
        <div class="w-[42px] h-[42px] rounded-2xl bg-[#F4F2FF] flex items-center justify-center text-profile-primary shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-semibold text-gray-500">Member Since</span>
          <span class="text-gray-900 font-bold text-[13px]">July 30, 2026</span>
        </div>
      </div>
    </div>

      <!-- Account Balances -->
      <div class="flex flex-col gap-3">
        <h3 class="text-profile-primary font-extrabold text-xs tracking-wider uppercase ml-1">Account Balances</h3>
        
        <!-- Salary -->
        <div class="bg-profile-primary/10 rounded-[24px] p-4 border border-profile-primary/20 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div class="flex items-center gap-3">
            <div class="w-[42px] h-[42px] rounded-2xl bg-[#F4F2FF] flex items-center justify-center text-profile-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            </div>
            <span class="text-gray-800 font-bold text-[13px]">Salary / Monthly</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-profile-primary/10 border border-profile-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-[14px] px-3 py-2 w-[110px] focus-within:border-profile-primary focus-within:ring-1 focus-within:ring-profile-primary transition-all">
              <span class="text-profile-primary font-bold text-sm mr-1.5">₹</span>
              <input #salaryInput type="text" inputmode="decimal" [ngModel]="formattedSalary" (ngModelChange)="formatSalary($event); salaryInput.value = formattedSalary" class="w-full bg-transparent text-gray-900 font-bold text-[13px] focus:outline-none" />
            </div>
          </div>
        </div>

        <!-- Cash Account -->
        <div class="bg-profile-primary/10 rounded-[24px] p-4 border border-profile-primary/20 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div class="flex items-center gap-3">
            <div class="w-[42px] h-[42px] rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
            </div>
            <span class="text-gray-800 font-bold text-[13px]">Cash Account</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-profile-primary/10 border border-profile-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-[14px] px-3 py-2 w-[110px] focus-within:border-green-500 focus-within:ring-1 focus-within:ring-green-500 transition-all">
              <span class="text-green-600 font-bold text-sm mr-1.5">₹</span>
              <input #cashInput type="text" inputmode="decimal" [ngModel]="formattedCash" (ngModelChange)="formatCash($event); cashInput.value = formattedCash" class="w-full bg-transparent text-gray-900 font-bold text-[13px] focus:outline-none" />
            </div>
          </div>
        </div>

        <!-- Savings Account -->
        <div class="bg-profile-primary/10 rounded-[24px] p-4 border border-profile-primary/20 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div class="flex items-center gap-3">
            <div class="w-[42px] h-[42px] rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.5-1 2-1.5 2-2 2-4 0-6-1.5-1.5-3-1.5-3-1.5Z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/></svg>
            </div>
            <span class="text-gray-800 font-bold text-[13px]">Savings Account</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center bg-profile-primary/10 border border-profile-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.04)] rounded-[14px] px-3 py-2 w-[110px] focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
              <span class="text-orange-500 font-bold text-sm mr-1.5">₹</span>
              <input #savingsInput type="text" inputmode="decimal" [ngModel]="formattedSavings" (ngModelChange)="formatSavings($event); savingsInput.value = formattedSavings" class="w-full bg-transparent text-gray-900 font-bold text-[13px] focus:outline-none" />
            </div>
          </div>
        </div>
      </div>
      
      <p class="text-xs text-gray-500 mt-[-6px] px-2 leading-tight font-medium">
        * Note: Updating your account balances will immediately overwrite your current balances and reflect across subsequent months.
      </p>

      <!-- Preferences -->
      <div class="flex flex-col gap-3">
        <h3 class="text-profile-primary font-extrabold text-xs tracking-wider uppercase ml-1">Preferences</h3>

        <div class="bg-profile-primary/10 rounded-[24px] border border-profile-primary/20 flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden">
          
          <!-- Mask Values -->
          <div class="flex items-center justify-between p-4 border-b border-profile-primary/20">
            <div class="flex flex-col">
              <span class="text-gray-900 font-bold text-[13px]">Mask Values</span>
              <span class="text-gray-500 font-medium text-xs mt-0.5">Hide balances on dashboard</span>
            </div>
            <button type="button" (click)="toggleMaskValues()"
              class="active:scale-[0.98] transition-all duration-200 relative inline-flex h-[26px] w-[44px] flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none"
              [ngClass]="pendingProfile().maskValues ? 'bg-profile-primary' : 'bg-slate-200'" role="switch"
              [attr.aria-checked]="pendingProfile().maskValues">
              <span aria-hidden="true"
                class="pointer-events-none inline-block h-5 w-5 mt-[3px] ml-[3px] transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out"
                [ngClass]="pendingProfile().maskValues ? 'translate-x-[18px]' : 'translate-x-0'"></span>
            </button>
          </div>

          <div class="flex items-center justify-between p-4">
            <div class="flex flex-col">
              <span class="text-gray-900 font-bold text-[13px]">Email Reports</span>
              <span class="text-gray-500 font-medium text-xs mt-0.5">Automated expense summaries</span>
            </div>
            <div class="flex bg-profile-primary/10 rounded-[10px] p-1 border border-profile-primary/20">
              <button (click)="updateField('emailReportFrequency', 'none')"
                [class.bg-profile-primary]="pendingProfile().emailReportFrequency === 'none'"
                [class.text-white]="pendingProfile().emailReportFrequency === 'none'"
                [class.text-gray-500]="pendingProfile().emailReportFrequency !== 'none'"
                [class.shadow-sm]="pendingProfile().emailReportFrequency === 'none'"
                class="active:scale-[0.98] transition-all duration-200 px-2.5 py-1.5 text-xs font-bold rounded-md transition-all">
                Off
              </button>
              <button (click)="updateField('emailReportFrequency', 'weekly')"
                [class.bg-profile-primary]="pendingProfile().emailReportFrequency === 'weekly'"
                [class.text-white]="pendingProfile().emailReportFrequency === 'weekly'"
                [class.text-gray-500]="pendingProfile().emailReportFrequency !== 'weekly'"
                [class.shadow-sm]="pendingProfile().emailReportFrequency === 'weekly'"
                class="active:scale-[0.98] transition-all duration-200 px-2.5 py-1.5 text-xs font-bold rounded-md transition-all">
                Weekly
              </button>
              <button (click)="updateField('emailReportFrequency', 'monthly')"
                [class.bg-profile-primary]="pendingProfile().emailReportFrequency === 'monthly'"
                [class.text-white]="pendingProfile().emailReportFrequency === 'monthly'"
                [class.text-gray-500]="pendingProfile().emailReportFrequency !== 'monthly'"
                [class.shadow-sm]="pendingProfile().emailReportFrequency === 'monthly'"
                class="active:scale-[0.98] transition-all duration-200 px-2.5 py-1.5 text-xs font-bold rounded-md transition-all">
                Monthly
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Spacer for fixed button -->
      <div class="h-10"></div>
    </div>

    <!-- Save Button (Fixed at bottom) -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-50/50 pb-8 z-20">
      <button [disabled]="!isDirty() || isUpdating()" (click)="handleUpdate()"
        class="active:scale-[0.98] transition-all duration-200 w-full bg-profile-primary text-white p-4 font-bold text-[15px] transition-all rounded-[16px] shadow-lg shadow-profile-primary/25 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2">
        @if (isUpdating()) {
          <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        } @else {
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save Changes
        }
      </button>
    </div>

  <!-- Avatar Selection Bottom Sheet -->
  @if (isAvatarSheetOpen()) {
    <div class="active:scale-[0.98] transition-all duration-200 fixed inset-0 bg-[#0B0F19]/40 z-[100] backdrop-blur-sm transition-opacity" (click)="isAvatarSheetOpen.set(false)"></div>
    <div class="fixed bottom-0 left-0 right-0 z-[101] bg-white rounded-t-[32px] overflow-hidden flex flex-col h-[75vh] animate-[slideUp_0.3s_ease-out]">
      <div class="flex flex-col items-center pt-3 pb-2 px-6 relative shrink-0">
        <div class="w-12 h-1 bg-gray-300 rounded-full mb-4"></div>
        <h2 class="text-base font-bold text-gray-900 mb-2">Choose Avatar</h2>
        <button (click)="isAvatarSheetOpen.set(false)" class="active:scale-[0.98] transition-all duration-200 absolute right-5 top-5 text-gray-500 bg-slate-50 rounded-full p-1.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      
      <div class="flex-1 overflow-y-auto px-6 pb-20 no-scrollbar relative z-10">
        <div class="grid grid-cols-4 gap-4 mt-2">
          @for (avatar of authService.avatars; track avatar.id) {
            <button
              (click)="selectAvatar(avatar.id)"
              class="active:scale-[0.98] transition-all duration-200 relative aspect-square rounded-[20px] flex items-center justify-center transition-all border-2"
              [ngClass]="
                pendingProfile().avatarId === avatar.id
                  ? 'border-profile-primary bg-profile-primary/10 shadow-[0_0_0_2px_rgba(8,145,178,0.1)]'
                  : 'border-transparent bg-[#FAFAFA]'
              "
            >
              <img [src]="avatar.url" alt="Avatar" class="w-full h-full object-cover rounded-[18px]" />
              @if (pendingProfile().avatarId === avatar.id) {
                <div class="absolute -bottom-1 -right-1 w-[22px] h-[22px] bg-profile-primary text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
              }
            </button>
          }
        </div>
      </div>
    </div>
  }
</div>
  `
})
export class Profile {
  authService = inject(AuthService);
  accountTrackerService = inject(AccountTrackerService);
  private supabaseService = inject(SupabaseService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);
  private location = inject(Location);
  quickActionsService = inject(QuickActionsService);

  pendingProfile = signal<UserProfile>({ ...this.authService.userProfile() });
  cashVal = signal<number>(this.accountTrackerService.cashBalance());
  savingsVal = signal<number>(this.accountTrackerService.savingsBalance());
  isUpdating = signal(false);
  isAvatarSheetOpen = signal(false);

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

  goBack() {
    this.location.back();
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
