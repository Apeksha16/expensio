import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Button } from '../../../../shared/ui/button/button';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoginStateService } from '../login-state.service';

@Component({
  selector: 'app-enter-email',
  standalone: true,
  imports: [Button, FormsModule, CommonModule, AuthLayoutComponent],
  host: {
    class: 'block w-full h-full'
  },
  template: `
    <app-auth-layout [isMpinScreen]="false" [showBackButton]="false">
      <div class="w-full">
        @if (cachedName()) {
          <div class="text-center mb-6">
            <p class="text-xl font-bold mb-2">Welcome back, {{ cachedName() }}!</p>
            <p class="text-gray-500 mb-6 font-medium">{{ email() }}</p>
            <app-button text="Log in with MPIN" (clicked)="onCachedLogin()"></app-button>
            <button (click)="loginWithOther()" class="mt-4 text-sm font-bold text-gray-500 hover:text-black underline block w-full text-center">Log in with another account</button>
          </div>
        } @else {
          <p class="text-gray-500 mt-2 text-center mb-6 font-medium">Enter your username or email to sign in or create an account</p>
          <div class="flex flex-col gap-2">
            
            <div class="relative w-full pb-6">
              <div class="w-full relative flex items-center bg-gray-50 border-2 border-black transition-colors" [class.border-red-500]="emailError()">
                <input type="text" [(ngModel)]="emailProxy" (ngModelChange)="clearError()" placeholder="Username or Email" class="w-full px-4 py-3 bg-transparent text-black placeholder-gray-500 font-bold focus:outline-none border-0 focus:ring-0 m-0" autofocus />
              </div>
              <p class="text-red-500 text-xs font-bold absolute bottom-1 left-1 transition-opacity duration-200" [class.opacity-0]="!emailError()">
                {{ emailError() || 'Error' }}
              </p>
            </div>
            <app-button [text]="'Continue'" [isLoading]="isLoading()" (clicked)="onEmailSubmit()"></app-button>
          </div>
        }
      </div>
    </app-auth-layout>
  `
})
export class EnterEmailComponent implements OnInit {
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private state = inject(LoginStateService);

  isLoading = signal(false);
  emailError = signal('');
  
  cachedName = signal('');
  email = signal('');
  emailProxy = '';

  clearError() {
    this.emailError.set('');
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
    
    if (!finalEmail.includes('@')) {
      // First, attempt to map the username to an email using our new backend RPC
      this.isLoading.set(true);
      try {
        const { data: mappedEmail, error } = await this.supabaseService.client.rpc('get_email_by_username', { p_username: finalEmail });
        if (mappedEmail && !error) {
          finalEmail = mappedEmail;
        } else {
          // If RPC fails or no user found, it means the username does not exist.
          // We do not allow signing up with a plain username directly.
          this.emailError.set('Username does not exist.');
          this.isLoading.set(false);
          return;
        }
      } catch (e) {
        this.emailError.set('Username does not exist.');
        this.isLoading.set(false);
        return;
      }
      this.isLoading.set(false);
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
      this.toastService.showError('Something went wrong checking email.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
