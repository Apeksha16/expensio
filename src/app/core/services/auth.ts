import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  salary: number;
  avatarId: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);

  readonly isAuthenticated = signal<boolean>(false);
  readonly isOnboarded = signal<boolean>(false);
  readonly currentUser = signal<User | null>(null, {
    equal: (a, b) => a?.id === b?.id && a?.updated_at === b?.updated_at
  });
  
  readonly userProfile = signal<UserProfile>({
    id: '',
    name: 'User',
    username: 'user',
    email: '',
    salary: 0,
    avatarId: 1
  }, {
    equal: (a, b) => a.name === b.name && a.username === b.username && a.salary === b.salary && a.avatarId === b.avatarId && a.email === b.email
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initAuthListener();
    }
  }

  private initAuthListener() {
    this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') return; // Ignore token refreshes to prevent redundant UI/Network updates

      if (session?.user) {
        this.isAuthenticated.set(true);
        this.currentUser.set(session.user);
        
        const metadata = session.user.user_metadata || {};
        
        // Map user profile from metadata
        this.userProfile.set({
          id: session.user.id,
          name: metadata['full_name'] || metadata['name'] || 'User',
          username: metadata['preferred_username'] || metadata['username'] || session.user.email?.split('@')[0] || 'user',
          email: session.user.email || '',
          salary: metadata['salary'] || 0,
          avatarId: metadata['avatarId'] || 1
        });

        // Always onboarded since onboarding happens pre-signup now
        this.isOnboarded.set(true);

        // Update local storage cache for device persistence
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('lastUser', JSON.stringify({
            email: session.user.email,
            name: metadata['full_name'] || metadata['name'] || 'User',
            avatarId: metadata['avatarId'] || 1
          }));
        }

        // If on login/auth routes, redirect to dashboard
        const isAuthRoute = ['/login', '/mpin', '/forgot', '/reset', '/onboarding', '/set-mpin', '/confirm-mpin'].some(route => this.router.url.includes(route));
        if (isAuthRoute || this.router.url === '/') {
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.isOnboarded.set(false);
        
        const isAuthRoute = ['/login', '/mpin', '/forgot', '/reset', '/onboarding', '/set-mpin', '/confirm-mpin'].some(route => this.router.url.includes(route));
        if (!isAuthRoute) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  async logout() {
    await this.supabaseService.signOut();
  }

  async updateProfile(profile: Partial<UserProfile>) {
    this.userProfile.update(current => ({ ...current, ...profile }));
    await this.supabaseService.client.auth.updateUser({
      data: {
        full_name: profile.name,
        preferred_username: profile.username,
        salary: profile.salary,
        avatarId: profile.avatarId
      }
    });
  }
}
