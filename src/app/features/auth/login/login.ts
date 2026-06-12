import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { Button } from '../../../shared/ui/button/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [Button],
  template: `
    <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gray-50 relative overflow-hidden">
      <div class="max-w-md w-full bg-white p-10 rounded-none border-2 border-black">
        <div class="text-center mb-6">
          <h2 class="text-3xl font-extrabold text-black tracking-tight">Expensio</h2>
          <p class="text-gray-500 mt-2">Sign in to manage your expenses</p>
        </div>
        
        <div class="space-y-6">
          <app-button
            [text]="'Sign in with Google'"
            [isGoogle]="true"
            [isLoading]="isLoading()"
            (clicked)="onGoogleSignIn()"
          ></app-button>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);

  onGoogleSignIn() {
    this.isLoading.set(true);
    
    // Simulate 3-second network request
    setTimeout(() => {
      this.isLoading.set(false);
      // For testing, we log them in and set them as NOT onboarded to trigger the flow
      this.authService.login(false);
      this.router.navigate(['/onboarding']);
    }, 3000);
  }
}
