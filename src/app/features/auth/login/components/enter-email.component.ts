import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';
import { FormsModule } from '@angular/forms';
import { AutofocusDirective } from '../../../../shared/ui/autofocus.directive';


import { Button } from '../../../../shared/ui/button/button.component';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoginStateService } from '../login-state.service';
import { KeyboardService } from '../../../../core/services/keyboard.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AppIconComponent } from '../../../../shared/ui/icon/app-icon.component';
import { Mail01Icon, UserIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-enter-email',
  standalone: true,
  imports: [FormsModule, AuthLayoutComponent, AutofocusDirective, AppIconComponent],
  host: {
    class: 'block w-full h-full',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <app-auth-layout [isMpinScreen]="false" [showBackButton]="false">
      <div class="w-full flex flex-col h-full pb-2">
        
        <!-- Top Branding / Logo Area -->
        <div class="flex-1 flex flex-col items-center justify-center pb-10 animate-[title-slide-up_0.5s_ease-out_both]">
          <div class="w-24 h-24 bg-white rounded-[28px] shadow-sm flex items-center justify-center mb-6 border border-slate-100 shrink-0">
            <img src="expensio-logo-2.png" alt="Expensio" class="w-14 h-14 object-contain" />
          </div>
          <h1 class="text-3xl font-[900] text-slate-900 tracking-tight mb-1">Expensio</h1>
          <p class="text-violet-600 font-bold text-[10px] tracking-[0.25em] uppercase">Expenses made simple</p>
        </div>

        <!-- Bottom Action Card -->
        <div class="w-full bg-white p-6 sm:p-8 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col animate-[title-slide-up_0.6s_ease-out_0.1s_both]">
          
          @if (cachedName()) {
            <div class="mb-8 text-center">
              <div class="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center text-violet-600 text-2xl font-bold mx-auto mb-4 border border-violet-100 shadow-sm overflow-hidden">
                @if (cachedAvatarId()) {
                  <img [src]="authService.getAvatarUrl(cachedAvatarId())" alt="Profile" class="w-full h-full object-cover" />
                } @else {
                  {{ cachedName().charAt(0).toUpperCase() }}
                }
              </div>
              <h2 class="text-2xl font-bold text-slate-900 mb-1">
                Welcome back, <span class="text-violet-600">{{ cachedName() }}</span>!
              </h2>
              <p class="text-slate-500 font-medium text-sm">{{ email() }}</p>
            </div>
            
            <div class="flex flex-col gap-3 w-full mb-2">
              <button
                (click)="onCachedLogin()"
                class="active:scale-[0.98] transition-all duration-200 w-full h-[56px] bg-violet-600 text-white rounded-2xl font-bold text-[17px] shadow-sm flex justify-center items-center"
              >
                Log in with MPIN
              </button>
              <button
                (click)="loginWithOther()"
                class="active:scale-[0.98] transition-all duration-200 h-[48px] text-sm font-semibold text-violet-600 text-center w-full mt-1 bg-violet-50 rounded-xl"
              >
                Log in with another account
              </button>
            </div>
          } @else {
            <div class="mb-6 text-center">
              <h2 class="text-2xl font-extrabold text-slate-900 mb-1">Let's get started</h2>
              <p class="text-slate-500 font-medium text-sm">
                Enter your email to log in or create an account
              </p>
            </div>

            <div class="flex flex-col gap-4">
              <div class="flex flex-col w-full">
                <div
                  class="flex items-center bg-slate-50 border border-slate-200 rounded-[20px] focus-within:border-violet-600 focus-within:bg-white transition-colors overflow-hidden"
                  [class.border-red-500]="emailError()"
                  [class.bg-red-50]="emailError()"
                >
                  <div class="pl-4 pr-1 text-slate-400 flex items-center justify-center">
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
                    (keydown.enter)="onEmailSubmit()"
                    placeholder="Enter username or email"
                    class="w-full pl-2 pr-4 py-4 bg-transparent text-slate-900 placeholder-slate-400 font-medium focus:outline-none border-0 focus:ring-0 m-0 text-[16px]"
                    appAutofocus
                  />
                </div>

                <div 
                  class="grid transition-all duration-300 ease-out"
                  [style.grid-template-rows]="suggestedDomains.length > 0 ? '1fr' : '0fr'"
                  [style.opacity]="suggestedDomains.length > 0 ? '1' : '0'"
                >
                  <div class="overflow-hidden">
                    <div class="w-full flex gap-2 overflow-x-auto no-scrollbar pt-3 pb-1">
                      @for (domain of suggestedDomains; track domain) {
                        <button 
                          type="button" 
                          (click)="selectDomain(domain)" 
                          class="active:scale-[0.98] px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-full whitespace-nowrap transition-all shadow-sm shrink-0"
                        >
                          <span class="text-slate-400 font-medium">&#64;</span>{{ domain }}
                        </button>
                      }
                    </div>
                  </div>
                </div>

                <div 
                  class="grid transition-all duration-300 ease-out"
                  [style.grid-template-rows]="emailError() ? '1fr' : '0fr'"
                  [style.opacity]="emailError() ? '1' : '0'"
                >
                  <div class="overflow-hidden">
                    <p class="text-red-500 text-xs font-semibold mt-2 pl-1 pb-1">
                      {{ emailError() }}
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                (click)="onEmailSubmit()"
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
          }
        </div>
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
  authService = inject(AuthService);

  isLoading = signal(false);
  emailError = signal('');

  cachedName = signal('');
  cachedAvatarId = signal<number | undefined>(undefined);
  email = signal('');
  emailProxy = '';

  clearError() {
    this.emailError.set('');
  }

  get suggestedDomains(): string[] {
    const parts = this.emailProxy.split('@');
    // Only show suggestions if there is text before the '@' symbol
    if (parts.length === 2 && parts[0].trim().length > 0 && !parts[1].includes('.')) {
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
          this.cachedAvatarId.set(user.avatarId);
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
