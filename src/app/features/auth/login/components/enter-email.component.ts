import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';
import { FormsModule } from '@angular/forms';
import { AutofocusDirective } from '../../../../shared/ui/autofocus.directive';
import { SafeInputDirective } from '../../../../shared/ui/safe-input.directive';

import { Button } from '../../../../shared/ui/button/button.component';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoginStateService } from '../login-state.service';
import { KeyboardService } from '../../../../core/services/keyboard.service';
import { AppIconComponent } from '../../../../shared/ui/icon/app-icon.component';
import { Mail01Icon, UserIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-enter-email',
  standalone: true,
  imports: [FormsModule, AuthLayoutComponent, AutofocusDirective, SafeInputDirective, AppIconComponent],
  host: {
    class: 'block w-full h-full',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <app-auth-layout [isMpinScreen]="false" [showBackButton]="false">
      <div class="w-full flex flex-col h-full">
        @if (cachedName()) {
          <div class="mt-auto mb-8">
            <h2 class="text-4xl font-bold text-black mb-2">
              Welcome back, <br />
              <span class="text-indigo-600">{{ cachedName() }}</span>!
            </h2>
            <p class="text-gray-500 font-medium">{{ email() }}</p>
          </div>
          
          <div class="flex flex-col gap-4 w-full mb-4">
            <button
              (click)="onCachedLogin()"
              class="w-full h-[60px] bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors flex justify-center items-center"
            >
              Log in with MPIN
            </button>
            <button
              (click)="loginWithOther()"
              class="text-sm font-semibold text-indigo-600 hover:text-indigo-800 text-center w-full"
            >
              Log in with another account
            </button>
          </div>
        } @else {
          <div class="mt-auto mb-8">
            <h2 class="text-4xl font-bold text-black mb-2">
              Welcome to <br />
              <span class="text-indigo-600">Expensio</span>
            </h2>
            <p class="text-gray-500 font-medium">
              Your personal space, secured and private.
            </p>
          </div>

          <div class="flex flex-col gap-6">
            <div class="relative w-full pb-6">
              <div
                class="flex items-center bg-white border-2 border-gray-200 rounded-2xl focus-within:border-indigo-600 transition-colors overflow-hidden"
                [class.border-red-500]="emailError()"
              >
                <div class="pl-4 pr-1 text-gray-400 flex items-center justify-center">
                  @if (emailProxy.includes('@')) {
                    <app-icon [icon]="Mail01Icon" size="22"></app-icon>
                  } @else {
                    <app-icon [icon]="UserIcon" size="22"></app-icon>
                  }
                </div>
                <input
                  type="text"
                  inputmode="email"
                  [(ngModel)]="emailProxy"
                  (ngModelChange)="clearError()"
                  placeholder="Enter username or email"
                  class="w-full pl-2 pr-4 py-4 bg-transparent text-black placeholder-gray-400 font-medium focus:outline-none border-0 focus:ring-0 m-0"
                  appAutofocus
                  appSafeInput
                />
              </div>

              @if (suggestedDomains.length > 0) {
                <div class="absolute top-[62px] left-0 w-full flex gap-2.5 overflow-x-auto no-scrollbar z-10 py-1 px-0.5">
                  @for (domain of suggestedDomains; track domain) {
                    <button 
                      type="button" 
                      (click)="selectDomain(domain)" 
                      class="px-4 py-1.5 bg-white border border-gray-200 hover:border-indigo-600 hover:text-indigo-600 text-gray-600 text-sm font-medium rounded-full whitespace-nowrap transition-all shadow-sm"
                    >
                      <span class="text-gray-400 font-normal">&#64;</span>{{ domain }}
                    </button>
                  }
                </div>
              }

              <p
                class="text-red-500 text-xs font-medium absolute bottom-0 left-1 transition-opacity duration-200"
                [class.opacity-0]="!emailError()"
              >
                {{ emailError() || 'Error' }}
              </p>
            </div>
            
            <button
              (click)="onEmailSubmit()"
              [disabled]="isLoading()"
              class="w-full mt-4 h-[60px] bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors flex justify-center items-center"
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

          <div class="mt-8 mb-4 text-center">
             <!-- As per design, there is "New to Memoriq? Create Account" text but we don't need a separate route for it as we just use email to continue/create -->
             <p class="text-sm text-gray-500 font-medium">New to Expensio? <span class="text-indigo-600 font-semibold">Enter email above</span></p>
          </div>
        }
      </div>
    </app-auth-layout>
  `,
})
export class EnterEmailComponent implements OnInit {
  Mail01Icon = Mail01Icon;
  UserIcon = UserIcon;

  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private state = inject(LoginStateService);
  private keyboardService = inject(KeyboardService);

  isLoading = signal(false);
  emailError = signal('');

  cachedName = signal('');
  email = signal('');
  emailProxy = '';

  clearError() {
    this.emailError.set('');
  }

  get suggestedDomains(): string[] {
    const parts = this.emailProxy.split('@');
    if (parts.length === 2 && !parts[1].includes('.')) {
      const search = parts[1].toLowerCase();
      const domains = ['gmail.com', 'zohomail.in'];
      return domains.filter(d => d.startsWith(search));
    }
    return [];
  }

  selectDomain(domain: string) {
    const parts = this.emailProxy.split('@');
    this.emailProxy = parts[0] + '@' + domain;
    this.clearError();
  }

  ngOnInit() {
    const cached = localStorage.getItem('lastUser');
    if (cached) {
      try {
        const user = JSON.parse(cached);
        if (user && user.email) {
          this.cachedName.set(user.name || 'User');
          this.email.set(user.email);
          this.state.email.set(user.email);
          return;
        }
      } catch (e) {}
    }
  }

  onCachedLogin() {
    this.keyboardService.openKeyboardSync();
    this.state.email.set(this.email());
    this.router.navigate(['/mpin']);
  }

  loginWithOther() {
    this.cachedName.set('');
    this.email.set('');
    this.emailProxy = '';
  }

  async onEmailSubmit() {
    this.clearError();
    let finalEmail = this.emailProxy.trim();
    if (!finalEmail) {
      this.emailError.set('Username or Email is required.');
      return;
    }

    // Call openKeyboardSync right before we start awaiting, to satisfy iOS,
    // but only if validation passes
    this.keyboardService.openKeyboardSync();

    if (!finalEmail.includes('@')) {
      // First, attempt to map the username to an email using our new backend RPC
      this.isLoading.set(true);
      try {
        const { data: mappedEmail, error } = await this.supabaseService.client.rpc(
          'get_email_by_username',
          { p_username: finalEmail },
        );
        if (mappedEmail && !error) {
          finalEmail = mappedEmail;
        } else {
          // If RPC fails or no user found, it means the username does not exist.
          // We do not allow signing up with a plain username directly.
          this.emailError.set('Username does not exist.');
          this.isLoading.set(false);
          this.keyboardService.closeKeyboard();
          return;
        }
      } catch (e) {
        this.emailError.set('Username does not exist.');
        this.isLoading.set(false);
        this.keyboardService.closeKeyboard();
        return;
      }
      this.isLoading.set(false);
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalEmail)) {
        this.emailError.set('Please enter a valid email address.');
        return;
      }
    }

    this.isLoading.set(true);
    try {
      const exists = await this.supabaseService.checkEmailExists(finalEmail);
      this.state.email.set(finalEmail);
      if (exists) {
        this.router.navigate(['/mpin']);
      } else {
        this.router.navigate(['/set-mpin']);
      }
    } catch (err) {
      console.error(err);
      this.toastService.showError('Login Failed', 'Something went wrong. Please try again.');
      this.keyboardService.closeKeyboard();
    } finally {
      this.isLoading.set(false);
    }
  }
}
