import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root' // or 'any' if we want it tied to login flow, but root is easier for sharing
})
export class LoginStateService {
  email = signal<string>('');
  cachedName = signal<string>('');
  mpin = signal<string>('');
  otpCode = signal<string>('');
  
  // Profile signals
  profileName = signal<string>('');
  profileSalary = signal<number | null>(null);

  clearAll() {
    this.email.set('');
    this.cachedName.set('');
    this.mpin.set('');
    this.otpCode.set('');
    this.profileName.set('');
    this.profileSalary.set(null);
  }
}
