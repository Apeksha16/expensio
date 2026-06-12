import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { Button } from '../../../shared/ui/button/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [Button],
  host: {
    class: 'block w-full h-full'
  },
  template: `
    @if (isCallback() || isLoading()) {
      <div class="min-h-[100dvh] flex flex-col items-center justify-center p-8 bg-black text-center relative overflow-hidden">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-8"></div>
        <p class="text-white text-xl font-medium max-w-md italic leading-relaxed">
          "Fetching your details to put into the world of clean expense management for your safe future..."
        </p>
      </div>
    } @else {
      <div class="min-h-[100dvh] flex flex-col items-center justify-end p-4 pb-12 bg-black relative overflow-hidden">
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
    }
  `,
  styles: ``,
})
export class Login implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  isCallback = signal(false);

  ngOnInit() {
    // Check if we are in an OAuth callback flow (hash contains access_token or url has code/error)
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('access_token') || hash.includes('error') || search.includes('code') || search.includes('error')) {
      this.isCallback.set(true);
    }
  }

  onGoogleSignIn() {
    this.isLoading.set(true);
    // This will redirect to Google immediately
    this.authService.login();
  }
}

