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
    <div class="h-full overflow-y-auto bg-white px-4 pt-4 flex flex-col gap-6 pb-28">
      
      <!-- Card 1: Avatar & Info -->
      <div class="bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-6">
        <!-- Avatar Selection -->
        <div class="flex flex-col items-center gap-4">
          <div class="w-24 h-24 border-2 border-black rounded-2xl bg-gray-100 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <img [src]="getSelectedAvatarUrl()" alt="Active Avatar" class="w-full h-full object-cover" />
          </div>
          <div class="w-full">
            <h3 class="text-[10px] font-black tracking-widest uppercase text-black mb-2">Choose Avatar</h3>
            <div class="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
              @for (avatar of authService.avatars; track avatar) {
                <button
                  (click)="selectAvatar(avatar.id)"
                  class="flex-shrink-0 w-16 h-16 border-2 rounded-xl flex items-center justify-center transition-all overflow-hidden"
                  [ngClass]="
                    pendingProfile().avatarId === avatar.id
                      ? 'border-black scale-105 bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'border-black bg-gray-100 opacity-70 hover:opacity-100'
                  "
                >
                  <img [src]="avatar.url" alt="Avatar" class="w-full h-full object-cover" />
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Inputs -->
        <div class="flex flex-col gap-4 mt-2">
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-black text-black tracking-widest uppercase">Full Name</label>
            <input type="text" [ngModel]="pendingProfile().name" (ngModelChange)="updateField('name', $event)"
              class="w-full bg-white border-2 border-black text-black font-bold text-sm rounded-xl focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] block p-3 outline-none transition-all placeholder-gray-400"
              placeholder="e.g. Jane Doe" appSafeInput />
          </div>
          
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-black text-gray-500 tracking-widest uppercase">Username</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-400 font-bold">@</span>
              </div>
              <input type="text" [value]="pendingProfile().username" disabled
                class="w-full bg-gray-100 border-2 border-gray-300 text-gray-500 font-bold text-sm rounded-xl block p-3 pl-8 outline-none opacity-80 cursor-not-allowed" />
            </div>
          </div>
          
          <div class="flex flex-col gap-1">
            <label class="text-[10px] font-black text-gray-500 tracking-widest uppercase">Email</label>
            <input type="text" [value]="pendingProfile().email" disabled
              class="w-full bg-gray-100 border-2 border-gray-300 text-gray-500 font-bold text-sm rounded-xl block p-3 outline-none opacity-80 cursor-not-allowed" />
          </div>
        </div>
      </div>

      <!-- Card 2: Account Balances -->
      <div class="bg-blue-50 border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
        <div class="flex items-center justify-between mb-1">
          <h3 class="text-xs font-black tracking-widest uppercase text-blue-900">Account Balances</h3>
          <span class="text-[9px] font-bold text-blue-700 bg-blue-200 border-2 border-blue-900 px-2 py-1 rounded-md uppercase shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]">3 Types</span>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-black text-blue-900 tracking-widest uppercase">Salary / Monthly</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-blue-900 font-bold">₹</span>
            </div>
            <input type="text" inputmode="numeric" [ngModel]="formattedSalary" (ngModelChange)="formatSalary($event)"
              class="w-full bg-white border-2 border-black text-black font-black text-sm rounded-xl focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] block p-3 pl-8 pr-12 outline-none transition-all placeholder-gray-400"
              placeholder="0" />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="text-gray-400 text-[10px] font-bold">INR</span>
            </div>
          </div>
        </div>
        
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-black text-blue-900 tracking-widest uppercase">Cash Account</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-blue-900 font-bold">₹</span>
            </div>
            <input type="text" inputmode="numeric" [ngModel]="formattedCash" (ngModelChange)="formatCash($event)"
              class="w-full bg-white border-2 border-black text-black font-black text-sm rounded-xl focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] block p-3 pl-8 pr-12 outline-none transition-all placeholder-gray-400"
              placeholder="0" />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="text-gray-400 text-[10px] font-bold">INR</span>
            </div>
          </div>
        </div>
        
        <div class="flex flex-col gap-1">
          <label class="text-[10px] font-black text-blue-900 tracking-widest uppercase">Savings Account</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-blue-900 font-bold">₹</span>
            </div>
            <input type="text" inputmode="numeric" [ngModel]="formattedSavings" (ngModelChange)="formatSavings($event)"
              class="w-full bg-white border-2 border-black text-black font-black text-sm rounded-xl focus:ring-0 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] block p-3 pl-8 pr-12 outline-none transition-all placeholder-gray-400"
              placeholder="0" />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="text-gray-400 text-[10px] font-bold">INR</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Preferences -->
      <div class="bg-violet-50 border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-5">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black tracking-widest uppercase text-violet-900">Preferences</h3>
        </div>

        <div class="flex items-center justify-between bg-white border-2 border-black p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div class="flex flex-col">
            <label class="text-[10px] font-black text-black tracking-widest uppercase">Mask Values</label>
            <span class="text-[9px] font-bold text-gray-500 mt-0.5">Hide dashboard numbers</span>
          </div>
          <button type="button" (click)="toggleMaskValues()"
            class="relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-black transition-colors duration-200 ease-in-out focus:outline-none"
            [ngClass]="pendingProfile().maskValues ? 'bg-emerald-400' : 'bg-gray-200'" role="switch"
            [attr.aria-checked]="pendingProfile().maskValues">
            <span aria-hidden="true"
              class="pointer-events-none inline-block h-5 w-5 mt-0.5 ml-0.5 transform rounded-full border-2 border-black bg-white transition duration-200 ease-in-out"
              [ngClass]="pendingProfile().maskValues ? 'translate-x-5' : 'translate-x-0'"></span>
          </button>
        </div>

        <div class="flex flex-col gap-2">
          <div class="flex flex-col">
            <label class="text-[10px] font-black text-black tracking-widest uppercase">Email Reports</label>
            <span class="text-[9px] font-bold text-gray-500 mt-0.5">Automated expense summaries</span>
          </div>
          <div class="flex border-2 border-black rounded-xl overflow-hidden bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <button (click)="updateField('emailReportFrequency', 'none')"
              [class.bg-black]="pendingProfile().emailReportFrequency === 'none'"
              [class.text-white]="pendingProfile().emailReportFrequency === 'none'"
              [class.text-black]="pendingProfile().emailReportFrequency !== 'none'"
              class="flex-1 px-2 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors text-center border-r-2 border-black">
              Off
            </button>
            <button (click)="updateField('emailReportFrequency', 'weekly')"
              [class.bg-black]="pendingProfile().emailReportFrequency === 'weekly'"
              [class.text-white]="pendingProfile().emailReportFrequency === 'weekly'"
              [class.text-black]="pendingProfile().emailReportFrequency !== 'weekly'"
              class="flex-1 px-2 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors text-center border-r-2 border-black">
              Weekly
            </button>
            <button (click)="updateField('emailReportFrequency', 'monthly')"
              [class.bg-black]="pendingProfile().emailReportFrequency === 'monthly'"
              [class.text-white]="pendingProfile().emailReportFrequency === 'monthly'"
              [class.text-black]="pendingProfile().emailReportFrequency !== 'monthly'"
              class="flex-1 px-2 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors text-center">
              Monthly
            </button>
          </div>
        </div>
      </div>

      <!-- Update Button -->
      <div class="mt-2">
        <button [disabled]="!isDirty() || isUpdating()" (click)="handleUpdate()"
          class="w-full bg-emerald-400 text-black border-2 border-black p-4 font-black text-sm tracking-widest uppercase transition-all rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-emerald-300 active:shadow-none active:translate-y-[4px] active:translate-x-[4px] disabled:opacity-50 disabled:bg-gray-200 disabled:shadow-none disabled:translate-y-0 disabled:translate-x-0 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          @if (isUpdating()) {
            <svg class="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
          } @else {
            Save Changes
          }
        </button>
      </div>
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
