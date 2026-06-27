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
  maskValues: boolean;
  quickActions?: string[];
  emailReportFrequency?: 'none' | 'weekly' | 'monthly';
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

  readonly avatars = [
    { id: 1, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4&mouth=smile,default' },
    { id: 2, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede&mouth=smile,default' },
    { id: 3, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jocelyn&backgroundColor=d1d4f9&mouth=smile,default' },
    { id: 4, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert&backgroundColor=ffdfbf&mouth=smile,default' },
    { id: 5, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=ffdfbf&mouth=smile,default' },
    { id: 6, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=b6e3f4&mouth=smile,default' },
    { id: 7, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=c0aede&mouth=smile,default' },
    { id: 8, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=d1d4f9&mouth=smile,default' },
    { id: 9, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amelia&backgroundColor=ffdfbf&mouth=smile,default' },
    { id: 10, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George&backgroundColor=b6e3f4&mouth=smile,default' },
    { id: 11, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=c0aede&mouth=smile,default' },
    { id: 12, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Harry&backgroundColor=d1d4f9&mouth=smile,default' },
    { id: 13, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily&backgroundColor=ffdfbf&mouth=smile,default' },
    { id: 14, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=b6e3f4&mouth=smile,default' },
    { id: 15, url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Grace&backgroundColor=c0aede&mouth=smile,default' },
  ];

  getAvatarUrl(id?: number): string {
    const avatar = this.avatars.find(a => a.id === id);
    return avatar ? avatar.url : this.avatars[0].url;
  }
  readonly isInitialized = signal<boolean>(false);
  
  private appStartTime = Date.now();
  readonly currentUser = signal<User | null>(null, {
    equal: (a, b) => a?.id === b?.id && a?.updated_at === b?.updated_at
  });
  
  readonly userProfile = signal<UserProfile>({
    id: '',
    name: 'User',
    username: 'user',
    email: '',
    salary: 0,
    avatarId: 1,
    maskValues: false,
    quickActions: ['expenses', 'splits', 'friends', 'budgets'],
    emailReportFrequency: 'none'
  }, {
    equal: (a, b) => a.name === b.name && a.username === b.username && a.salary === b.salary && a.avatarId === b.avatarId && a.email === b.email && a.maskValues === b.maskValues && JSON.stringify(a.quickActions) === JSON.stringify(b.quickActions) && a.emailReportFrequency === b.emailReportFrequency
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initAuthListener();
    }
  }

  private initAuthListener() {
    this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') return; // Ignore token refreshes to prevent redundant UI/Network updates

      const handleInitialization = () => {
        if (!this.isInitialized()) {
          const elapsed = Date.now() - this.appStartTime;
          const delay = Math.max(0, 1500 - elapsed);
          setTimeout(() => {
            this.isInitialized.set(true);
          }, delay);
        }
      };

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
          avatarId: metadata['avatar_id'] || 1,
          maskValues: metadata['mask_values'] === true,
          quickActions: metadata['quick_actions'] || ['expenses', 'splits', 'friends', 'budgets'],
          emailReportFrequency: metadata['email_report_frequency'] || 'none'
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
        handleInitialization();
      } else {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.isOnboarded.set(false);
        
        const isAuthRoute = ['/login', '/mpin', '/forgot', '/reset', '/onboarding', '/set-mpin', '/confirm-mpin'].some(route => this.router.url.includes(route));
        if (!isAuthRoute) {
          this.router.navigate(['/login']);
        }
        handleInitialization();
      }
    });
  }

  async logout() {
    await this.supabaseService.signOut();
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<boolean> {
    const { data, error } = await this.supabaseService.client.auth.updateUser({
      data: {
        full_name: profile.name,
        preferred_username: profile.username,
        salary: profile.salary,
        avatar_id: profile.avatarId,
        mask_values: profile.maskValues,
        quick_actions: profile.quickActions,
        email_report_frequency: profile.emailReportFrequency
      }
    });

    if (error) {
      return false;
    }

    this.userProfile.update(current => ({ ...current, ...profile }));
    return true;
  }
}
