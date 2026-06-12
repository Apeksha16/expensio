import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface UserProfile {
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

  // Foundational signal-based state initialized from localStorage
  readonly isAuthenticated = signal<boolean>(this.getStoredBool('auth_is_authenticated'));
  readonly isOnboarded = signal<boolean>(this.getStoredBool('auth_is_onboarded'));
  readonly userProfile = signal<UserProfile>({
    name: 'Pranav Kumar',
    username: 'pranav_dev',
    email: 'pranav@expensio.app',
    salary: 85000,
    avatarId: 1
  });

  private getStoredBool(key: string): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key) === 'true';
    }
    return false;
  }

  private setStoredBool(key: string, value: boolean) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, String(value));
    }
  }

  login(onboarded: boolean = false) {
    this.isAuthenticated.set(true);
    this.isOnboarded.set(onboarded);
    this.setStoredBool('auth_is_authenticated', true);
    this.setStoredBool('auth_is_onboarded', onboarded);
  }

  completeOnboarding() {
    this.isOnboarded.set(true);
    this.setStoredBool('auth_is_onboarded', true);
  }

  logout() {
    this.isAuthenticated.set(false);
    this.isOnboarded.set(false);
    this.setStoredBool('auth_is_authenticated', false);
    this.setStoredBool('auth_is_onboarded', false);
  }

  updateProfile(profile: Partial<UserProfile>) {
    this.userProfile.update(current => ({ ...current, ...profile }));
  }
}
