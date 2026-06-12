import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast.service';
import { Button } from '../../../shared/ui/button/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [Button, FormsModule],
  host: {
    class: 'block w-full h-full'
  },
  template: `
    @if (isCallback()) {
      <div class="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-black border-r-transparent border-b-black border-l-transparent"></div>
      </div>
    } @else {
      <div class="min-h-[100dvh] flex flex-col items-center justify-end p-4 pb-12 bg-black relative overflow-hidden">
        <div class="max-w-md w-full bg-white p-10 rounded-none border-2 border-black">
          <div class="text-center mb-6 flex flex-col items-center">
            <img src="logo.png" alt="Expensio Logo" class="w-16 h-16 mb-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-contain bg-white">
            <h2 class="text-3xl font-extrabold text-black tracking-tight">Expensio</h2>
            <p class="text-gray-500 mt-2">Sign in to manage your expenses</p>
          </div>
          
          <div class="flex flex-col gap-4">
            @if (emailSent()) {
              <div class="bg-green-100 border-2 border-black p-4 text-center">
                <p class="font-bold text-black text-lg">Check your inbox!</p>
                <p class="text-sm text-gray-700 mt-2 font-medium">We've sent a magic link to your email to log in securely.</p>
              </div>
            } @else {
              <input type="email" [(ngModel)]="email" placeholder="Email address" class="w-full px-4 py-3 bg-gray-50 border-2 border-black text-black placeholder-gray-500 font-medium focus:outline-none focus:ring-0 transition-all rounded-none" />
              <app-button
                [text]="'Send Magic Link'"
                [isLoading]="isLoading()"
                (clicked)="onSendMagicLink()"
              ></app-button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: ``,
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  isLoading = signal(false);
  isCallback = signal(false);
  emailSent = signal(false);
  email = '';

  ngOnInit() {
    // Parse hash parameters to check for errors from Supabase magic link
    const hash = window.location.hash.substring(1);
    const search = window.location.search;
    
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(search);
    
    const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
    
    if (errorDescription) {
      this.toastService.showError(errorDescription.replace(/\+/g, ' '));
      // Remove hash from URL so it doesn't persist on refresh
      window.history.replaceState(null, '', window.location.pathname);
    } else if (hash.includes('access_token') || search.includes('code')) {
      this.isCallback.set(true);
    }
  }

  onGoogleSignIn() {
    this.isLoading.set(true);
    this.authService.login();
  }

  async onSendMagicLink() {
    let finalEmail = this.email.trim();
    if (!finalEmail) return;
    
    if (!finalEmail.includes('@')) {
      finalEmail += '@gmail.com';
      this.email = finalEmail;
    }
    
    this.isLoading.set(true);
    try {
      await this.authService.loginWithEmail(finalEmail);
      this.emailSent.set(true);
    } catch (err: any) {
      console.error('Magic link error', err);
      // Display the error message to the user via toast
      this.toastService.showError(err.message || 'Failed to send magic link. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }
}

