import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';
import { AppIconComponent } from '../../../../shared/ui/icon/app-icon.component';
import { UserIcon, RupeeIcon, Wallet01Icon, PiggyBankIcon } from '@hugeicons/core-free-icons';

import { FormsModule } from '@angular/forms';
import { SafeInputDirective } from '../../../../shared/ui/safe-input.directive';
import { Button } from '../../../../shared/ui/button/button.component';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoginStateService } from '../login-state.service';

@Component({
  selector: 'app-onboarding-profile',
  standalone: true,
  imports: [FormsModule, AuthLayoutComponent, SafeInputDirective, AppIconComponent],
  host: {
    class: 'block w-full h-full',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <app-auth-layout [isMpinScreen]="true" [showBackButton]="true">
      <div class="w-full flex flex-col h-full pb-2">
        
        <!-- Top Branding Area -->
        <div class="flex-1 flex flex-col items-center justify-center pb-10 animate-[title-slide-up_0.5s_ease-out_both]">
          <div class="w-24 h-24 bg-white rounded-[28px] shadow-sm flex items-center justify-center mb-6 border border-slate-100 shrink-0">
            <div class="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center text-violet-600">
              <app-icon [icon]="UserIcon" size="32"></app-icon>
            </div>
          </div>
          <h3 class="text-3xl font-[900] text-slate-900 tracking-tight mb-2 text-center">Tell us about yourself</h3>
          <p class="text-slate-500 font-medium text-sm text-center leading-relaxed">
            We'll personalize your experience.
          </p>
        </div>

        <!-- Bottom Action Card -->
        <div class="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col animate-[title-slide-up_0.6s_ease-out_0.1s_both]">
          <form (ngSubmit)="onFinalSubmit()" class="flex flex-col w-full pb-2">
            
            <div class="w-full mb-1 px-1">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal</span>
            </div>

            <!-- Name Field -->
            <div class="relative w-full pb-4">
              <div
                class="w-full h-14 bg-slate-50 border rounded-2xl flex items-center overflow-hidden transition-colors"
                [class.border-violet-600]="profileName"
                [class.border-slate-200]="!profileName && !nameError()"
                [class.bg-white]="profileName || nameError()"
                [class.border-red-500]="nameError()"
                [class.bg-red-50]="nameError()"
              >
                <div class="pl-4 pr-2 h-full flex items-center justify-center text-slate-400">
                  <app-icon [icon]="UserIcon" size="20"></app-icon>
                </div>
                <input
                  type="text"
                  [(ngModel)]="profileName"
                  name="name"
                  placeholder="Enter your name"
                  class="w-full h-full bg-transparent outline-none text-slate-900 font-medium px-2 text-[16px]"
                  appSafeInput
                />
              </div>
              <p
                class="text-red-500 text-xs font-medium absolute bottom-1 left-2 transition-opacity duration-200"
                [class.opacity-0]="!nameError()"
              >
                {{ nameError() || 'Error' }}
              </p>
            </div>

            <div class="w-full mt-2 mb-3 px-1">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Financial</span>
              <span class="text-xs text-slate-400">Used to suggest budgets and calculate your net worth.</span>
            </div>

            <!-- Salary Field -->
            <div class="relative w-full pb-6">
              <div
                class="w-full h-14 bg-slate-50 border rounded-2xl flex items-center overflow-hidden transition-colors"
                [class.border-violet-600]="profileSalary"
                [class.border-slate-200]="!profileSalary && !salaryError()"
                [class.bg-white]="profileSalary || salaryError()"
                [class.border-red-500]="salaryError()"
                [class.bg-red-50]="salaryError()"
              >
                <div class="pl-4 pr-2 h-full flex items-center justify-center text-slate-400">
                  <app-icon [icon]="RupeeIcon" size="20"></app-icon>
                </div>
                <input
                  type="text"
                  [(ngModel)]="salaryStr"
                  name="salary"
                  placeholder="Monthly salary"
                  inputmode="numeric"
                  class="w-full h-full bg-transparent outline-none text-slate-900 font-medium px-2 text-[16px]"
                  appSafeInput
                />
              </div>
              <p
                class="text-red-500 text-xs font-medium absolute bottom-1 left-2 transition-opacity duration-200"
                [class.opacity-0]="!salaryError()"
              >
                {{ salaryError() || 'Error' }}
              </p>
            </div>

            <!-- Cash Balance Field -->
            <div class="relative w-full pb-6">
              <div
                class="w-full h-14 bg-slate-50 border rounded-2xl flex items-center overflow-hidden transition-colors"
                [class.border-violet-600]="profileCashBalance !== null"
                [class.border-slate-200]="profileCashBalance === null && !cashError()"
                [class.bg-white]="profileCashBalance !== null || cashError()"
                [class.border-red-500]="cashError()"
                [class.bg-red-50]="cashError()"
              >
                <div class="pl-4 pr-2 h-full flex items-center justify-center text-slate-400">
                  <app-icon [icon]="Wallet01Icon" size="20"></app-icon>
                </div>
                <input
                  type="text"
                  [(ngModel)]="cashStr"
                  name="cash"
                  placeholder="Cash balance"
                  inputmode="numeric"
                  class="w-full h-full bg-transparent outline-none text-slate-900 font-medium px-2 text-[16px]"
                  appSafeInput
                />
              </div>
              <p
                class="text-red-500 text-xs font-medium absolute bottom-1 left-2 transition-opacity duration-200"
                [class.opacity-0]="!cashError()"
              >
                {{ cashError() || 'Error' }}
              </p>
            </div>

            <!-- Savings Balance Field -->
            <div class="relative w-full pb-5">
              <div
                class="w-full h-14 bg-slate-50 border rounded-2xl flex items-center overflow-hidden transition-colors"
                [class.border-violet-600]="profileSavingsBalance !== null"
                [class.border-slate-200]="profileSavingsBalance === null && !savingsError()"
                [class.bg-white]="profileSavingsBalance !== null || savingsError()"
                [class.border-red-500]="savingsError()"
                [class.bg-red-50]="savingsError()"
              >
                <div class="pl-4 pr-2 h-full flex items-center justify-center text-slate-400">
                  <app-icon [icon]="PiggyBankIcon" size="20"></app-icon>
                </div>
                <input
                  type="text"
                  [(ngModel)]="savingsStr"
                  name="savings"
                  placeholder="Savings balance"
                  inputmode="numeric"
                  class="w-full h-full bg-transparent outline-none text-slate-900 font-medium px-2 text-[16px]"
                  appSafeInput
                />
              </div>
              <p
                class="text-red-500 text-xs font-medium absolute bottom-1 left-2 transition-opacity duration-200"
                [class.opacity-0]="!savingsError()"
              >
                {{ savingsError() || 'Error' }}
              </p>
            </div>

            <div class="mt-4 w-full">
              <button
                type="submit"
                [disabled]="isLoading()"
                class="active:scale-[0.98] transition-all duration-200 w-full h-[56px] bg-violet-600 text-white rounded-2xl font-bold text-[17px] shadow-sm flex justify-center items-center"
              >
                @if (isLoading()) {
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                } @else {
                  Continue
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </app-auth-layout>
  `,
})
export class OnboardingProfileComponent implements OnInit {
  UserIcon = UserIcon;
  RupeeIcon = RupeeIcon;
  Wallet01Icon = Wallet01Icon;
  PiggyBankIcon = PiggyBankIcon;

  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private state = inject(LoginStateService);

  isLoading = signal(false);
  nameError = signal('');
  salaryError = signal('');
  cashError = signal('');
  savingsError = signal('');

  private _profileName = '';
  get profileName() { return this._profileName; }
  set profileName(val: string) {
    this._profileName = val;
    const trimmed = val.trim();
    if (!trimmed) {
      this.nameError.set('Please enter your name.');
    } else if (trimmed.length < 2) {
      this.nameError.set('Name must be at least 2 characters.');
    } else if (trimmed.length > 50) {
      this.nameError.set('Name cannot exceed 50 characters.');
    } else {
      this.nameError.set('');
    }
  }

  profileSalary: number | null = null;
  profileCashBalance: number | null = null;
  profileSavingsBalance: number | null = null;

  private _salaryStr = '';
  get salaryStr() { return this._salaryStr; }
  set salaryStr(val: string) {
    let raw = val.replace(/\D/g, '');
    if (!raw) {
      this._salaryStr = ''; this.profileSalary = null; 
      this.salaryError.set('Please enter a valid monthly salary.');
      return;
    }
    const num = parseInt(raw, 10);
    this._salaryStr = num.toLocaleString('en-IN');
    this.profileSalary = num;
    
    if (num <= 0) {
      this.salaryError.set('Salary must be greater than 0.');
    } else if (num > 99999999) {
      this.salaryError.set('Amount exceeds maximum limit.');
    } else {
      this.salaryError.set('');
    }
  }

  private _cashStr = '';
  get cashStr() { return this._cashStr; }
  set cashStr(val: string) {
    let raw = val.replace(/\D/g, '');
    if (!raw) {
      this._cashStr = ''; this.profileCashBalance = null; 
      this.cashError.set('Please enter starting cash balance.');
      return;
    }
    const num = parseInt(raw, 10);
    this._cashStr = num.toLocaleString('en-IN');
    this.profileCashBalance = num;
    
    if (num > 99999999) {
      this.cashError.set('Amount exceeds maximum limit.');
    } else {
      this.cashError.set('');
    }
  }

  private _savingsStr = '';
  get savingsStr() { return this._savingsStr; }
  set savingsStr(val: string) {
    let raw = val.replace(/\D/g, '');
    if (!raw) {
      this._savingsStr = ''; this.profileSavingsBalance = null; 
      this.savingsError.set('Please enter starting savings balance.');
      return;
    }
    const num = parseInt(raw, 10);
    this._savingsStr = num.toLocaleString('en-IN');
    this.profileSavingsBalance = num;

    if (num > 99999999) {
      this.savingsError.set('Amount exceeds maximum limit.');
    } else {
      this.savingsError.set('');
    }
  }

  ngOnInit() {
    if (!this.state.email() || !this.state.mpin()) {
      this.router.navigate(['/login']);
    }
  }

  async onFinalSubmit() {
    let hasError = false;

    // Trigger validations
    this.profileName = this._profileName;
    this.salaryStr = this._salaryStr;
    this.cashStr = this._cashStr;
    this.savingsStr = this._savingsStr;

    if (this.nameError() || this.salaryError() || this.cashError() || this.savingsError()) {
      hasError = true;
    }

    if (hasError) return;

    this.isLoading.set(true);
    try {
      const email = this.state.email();
      const mpin = this.state.mpin();

      let baseUsername = this.profileName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!baseUsername) baseUsername = 'user';

      let username = baseUsername;
      let isAvailable = false;
      let counter = 1;

      // Keep checking the profiles table until we find an unused username
      while (!isAvailable) {
        const { data, error } = await this.supabaseService.client
          .from('profiles')
          .select('id')
          .eq('username', username)
          .maybeSingle();
        if (!data) {
          isAvailable = true;
        } else {
          username = `${baseUsername}${counter}`;
          counter++;
        }
      }

      const { user } = await this.supabaseService.signUpWithMpin(email, mpin, {
        full_name: this.profileName,
        salary: this.profileSalary,
        cash_balance: this.profileCashBalance,
        savings_balance: this.profileSavingsBalance,
        username: username,
        newUser: 'N',
        onboardingStatus: 'N',
      });

      if (user) {
        // Attempt to log in explicitly just to ensure session is populated
        try {
          await this.supabaseService.signInWithMpin(email, mpin);
        } catch (loginErr) {
          console.warn('Auto-login failed, but account was created:', loginErr);
        }

        // Prevent balance prompt immediately after signup
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
        localStorage.setItem('lastBalancePromptMonth', currentMonth);

        this.toastService.showSuccess('Welcome to Expensio!', 'Your account is ready.');
        this.state.clearAll();

        // Force navigation
        this.router.navigate(['/dashboard']);
      } else {
        this.toastService.showError('Signup Failed', "Couldn't create your account. Please try again.");
      }
    } catch (e: any) {
      console.error('Signup Error:', e);
      let errorMsg = 'An error occurred during signup. Please try again.';
      if (e) {
        if (e.name === 'AuthRetryableFetchError' || (e.message && e.message.includes('AuthRetryableFetchError'))) {
          errorMsg = 'Network error or rate limit exceeded. Please try again later.';
        } else if (e.message) {
          errorMsg = e.message;
        } else if (typeof e === 'string') {
          errorMsg = e;
        }
      }
      this.toastService.showError('Signup Failed', errorMsg);
    } finally {
      this.isLoading.set(false);
    }
  }
}
