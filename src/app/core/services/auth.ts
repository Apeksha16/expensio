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

        // Routing Logic
        const isNewUser = metadata['newUser'] !== 'N'; // defaults to true/y if not set
        const onboardingStatus = metadata['onboardingStatus'] || 'N'; 

        if (isNewUser) {
          if (onboardingStatus === 'N') {
            this.isOnboarded.set(false);
            this.router.navigate(['/onboarding']);
          } else {
            // Already onboarded somehow? User requested:
            // "else go to dashbaord page and update onbaodig status to N and newUser status to N also"
            this.isOnboarded.set(true);
            await this.markAsNotNewUser();
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.isOnboarded.set(true);
          // If already on login, redirect to dashboard
          if (this.router.url.includes('/login') || this.router.url === '/') {
            this.router.navigate(['/dashboard']);
          }
        }
      } else {
        this.isAuthenticated.set(false);
        this.currentUser.set(null);
        this.isOnboarded.set(false);
        if (!this.router.url.includes('/login')) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  async login(onboarded: boolean = false) {
    // Left for compatibility if called directly, but we rely on Google Auth mostly now
    await this.supabaseService.signInWithGoogle();
  }

  async completeOnboarding(profileData: Partial<UserProfile>): Promise<{success: boolean, error?: string}> {
    if (profileData.username) {
      const exists = await this.supabaseService.checkUsernameExists(profileData.username);
      if (exists) {
        return { success: false, error: 'username_taken' };
      }
    }

    const user = this.currentUser();
    if (!user) {
      return { success: false, error: 'not_authenticated' };
    }

    // Save to the public profiles table
    try {
      await this.supabaseService.saveUserProfile(user.id, {
        name: profileData.name,
        username: profileData.username,
        salary: profileData.salary,
        avatar_id: profileData.avatarId || 1
      });
    } catch (dbError) {
      console.error('Error saving profile to DB', dbError);
      return { success: false, error: 'db_error' };
    }

    // Update Auth Metadata
    const { error } = await this.supabaseService.client.auth.updateUser({
      data: {
        full_name: profileData.name,
        preferred_username: profileData.username,
        salary: profileData.salary,
        newUser: 'N',
        onboardingStatus: 'N'
      }
    });

    if (!error) {
      this.userProfile.update(current => ({ ...current, ...profileData }));
      this.isOnboarded.set(true);
      return { success: true };
    } else {
      console.error('Error updating onboarding metadata', error);
      return { success: false, error: 'metadata_error' };
    }
  }

  private async markAsNotNewUser() {
    const { error } = await this.supabaseService.client.auth.updateUser({
      data: {
        newUser: 'N',
        onboardingStatus: 'N'
      }
    });
    if (error) {
      console.error('Error updating user metadata', error);
    }
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
