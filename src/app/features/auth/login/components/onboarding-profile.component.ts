import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';

import { FormsModule } from '@angular/forms';
import { SafeInputDirective } from '../../../../shared/ui/safe-input.directive';
import { Button } from '../../../../shared/ui/button/button.component';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoginStateService } from '../login-state.service';

@Component({
  selector: 'app-onboarding-profile',
  standalone: true,
  imports: [Button, FormsModule, AuthLayoutComponent, SafeInputDirective],
  host: {
    class: 'block w-full h-full',
  },
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <app-auth-layout
      [isMpinScreen]="true"
      [quoteMessage]="'Your money, your rules. Let\\'s make it official.'"
    >
      <div class="w-full">
        <form (ngSubmit)="onFinalSubmit()" class="flex flex-col w-full gap-2">
          <div class="flex flex-col">
            <label class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
              >Display Name</label
            >
            <div class="relative w-full pb-6">
              <div
                class="w-full relative flex items-center bg-gray-50 border-2 border-black transition-colors"
                [class.border-red-500]="nameError()"
              >
                <input
                  type="text"
                  [(ngModel)]="profileName"
                  (ngModelChange)="nameError.set('')"
                  name="name"
                  placeholder="John Doe"
                  autocomplete="off"
                  autofocus
                  class="w-full px-4 py-3 bg-transparent text-black placeholder-gray-500 font-bold focus:outline-none border-0 focus:ring-0 m-0"
                  required
                  appSafeInput
                />
              </div>
              <p
                class="text-red-500 text-xs font-bold absolute bottom-1 left-1 transition-opacity duration-200"
                [class.opacity-0]="!nameError()"
              >
                {{ nameError() || 'Error' }}
              </p>
            </div>
          </div>

          <div class="flex flex-col">
            <label class="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
              >Monthly Salary (₹)</label
            >
            <div class="relative w-full pb-6">
              <div
                class="w-full relative flex items-center bg-gray-50 border-2 border-black transition-colors"
                [class.border-red-500]="salaryError()"
              >
                <input
                  type="text"
                  inputmode="numeric"
                  [(ngModel)]="salaryStr"
                  name="salary"
                  placeholder="50,000"
                  autocomplete="off"
                  class="w-full px-4 py-3 bg-transparent text-black placeholder-gray-500 font-bold focus:outline-none border-0 focus:ring-0 m-0"
                  required
                />
              </div>
              <p
                class="text-red-500 text-xs font-bold absolute bottom-1 left-1 transition-opacity duration-200"
                [class.opacity-0]="!salaryError()"
              >
                {{ salaryError() || 'Error' }}
              </p>
            </div>
          </div>

          <app-button
            [text]="'Complete Setup'"
            class="w-full"
            [isLoading]="isLoading()"
            (clicked)="onFinalSubmit()"
          ></app-button>
        </form>
      </div>
    </app-auth-layout>
  `,
})
export class OnboardingProfileComponent implements OnInit {
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private state = inject(LoginStateService);

  isLoading = signal(false);
  nameError = signal('');
  salaryError = signal('');

  profileName = '';
  profileSalary: number | null = null;

  private _salaryStr = '';
  get salaryStr() {
    return this._salaryStr;
  }
  set salaryStr(val: string) {
    let raw = val.replace(/\D/g, '');
    if (!raw) {
      this._salaryStr = '';
      this.profileSalary = null;
      this.salaryError.set('');
      return;
    }
    this._salaryStr = parseInt(raw, 10).toLocaleString('en-IN');
    this.profileSalary = parseInt(raw, 10);
    this.salaryError.set('');
  }

  ngOnInit() {
    if (!this.state.email() || !this.state.mpin()) {
      this.router.navigate(['/login']);
    }
  }

  async onFinalSubmit() {
    let hasError = false;
    if (!this.profileName.trim()) {
      this.nameError.set('Please enter your display name.');
      hasError = true;
    }
    if (!this.profileSalary || this.profileSalary <= 0) {
      this.salaryError.set('Please enter a valid monthly salary.');
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

        this.toastService.showSuccess('Welcome to Expensio! Your account is ready.');
        this.state.clearAll();

        // Force navigation
        this.router.navigate(['/dashboard']);
      } else {
        this.toastService.showError("Couldn't create your account. Please try again.");
      }
    } catch (e: any) {
      console.error(e);
      this.toastService.showError(e.message || 'An error occurred during signup.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
