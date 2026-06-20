import { Component, inject, OnInit, signal, input, computed, effect } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthLayoutComponent } from './auth-layout.component';
import { FormsModule } from '@angular/forms';
import { Button } from '../../../../shared/ui/button/button.component';
import { PinInputComponent } from '../../../../shared/ui/pin-input/pin-input.component';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoginStateService } from '../login-state.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { KeyboardService } from '../../../../core/services/keyboard.service';

export type MpinStep = 'login' | 'forgot' | 'reset' | 'set-mpin' | 'confirm-mpin';

@Component({
  selector: 'app-mpin-flow',
  imports: [Button, PinInputComponent, FormsModule, AuthLayoutComponent],
  host: {
    class: 'block w-full h-full'
  },
  template: `
    <app-auth-layout [isMpinScreen]="true" [quoteMessage]="quoteMessage()">
      <div class="w-full">
      <div class="mb-6 flex flex-col items-center">
         <h3 class="text-black font-extrabold text-center text-xl mb-1">{{ heading() }}</h3>
         <p class="text-gray-500 text-center font-semibold text-sm leading-relaxed" [innerHTML]="subheading()"></p>
      </div>

      <div class="flex flex-col gap-2">
        
        <div class="relative w-full pb-8">
          <app-pin-input [(ngModel)]="pin1" (ngModelChange)="clearError()" [autofocus]="true"></app-pin-input>
          @if (step() === 'reset') {
            <div class="mt-4">
              <app-pin-input [(ngModel)]="pin2" (ngModelChange)="clearError()"></app-pin-input>
            </div>
          }
          
          <p class="text-red-500 text-xs font-bold absolute bottom-1 left-1 transition-opacity duration-200" [class.opacity-0]="!mpinError()">
            {{ mpinError() || 'Error' }}
          </p>
        </div>
        
        <app-button [text]="buttonText()" [isLoading]="isLoading()" (clicked)="onSubmit()"></app-button>
        
        @if (step() === 'login') {
          <button (click)="startForgotMpin()" class="mt-2 text-sm font-bold text-gray-500 hover:text-black block w-full text-center">Forgot MPIN?</button>
        }
      </div>
    </div>
    </app-auth-layout>
  `
})
export class MpinFlowComponent implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private state = inject(LoginStateService);
  private keyboardService = inject(KeyboardService);

  step = computed<MpinStep>(() => {
    const url = this.router.url;
    if (url.includes('/forgot')) return 'forgot';
    if (url.includes('/reset')) return 'reset';
    if (url.includes('/set-mpin')) return 'set-mpin';
    if (url.includes('/confirm-mpin')) return 'confirm-mpin';
    return 'login';
  });
  isLoading = signal(false);
  email = signal('');
  
  pin1 = signal('');
  pin2 = signal('');
  mpinError = signal('');

  clearError() {
    this.mpinError.set('');
  }

  buttonText = computed(() => {
    switch (this.step()) {
      case 'login': return 'Log in';
      case 'forgot': return 'Verify Code';
      case 'reset': return 'Reset MPIN';
      case 'set-mpin':
      case 'confirm-mpin': return 'Next';
      default: return 'Continue';
    }
  });

  heading = computed(() => {
    switch(this.step()) {
      case 'login': return 'Welcome Back';
      case 'forgot': return 'Check your Email';
      case 'reset': return 'Set New MPIN';
      case 'set-mpin': return 'Create 4-Digit MPIN';
      case 'confirm-mpin': return 'Confirm MPIN';
      default: return '';
    }
  });

  subheading = computed(() => {
    const boldEmail = `<span class="text-black font-bold">${this.email()}</span>`;
    switch (this.step()) {
      case 'login': return `Enter your 4-digit MPIN for <br/>${boldEmail}`;
      case 'forgot': return `We sent a 4-digit code to <br/>${boldEmail}`;
      case 'reset': return 'Enter a strong 4-digit PIN for your account.';
      case 'set-mpin': return 'You will use this PIN to log in quickly.';
      case 'confirm-mpin': return 'Re-enter your PIN to ensure it is correct.';
      default: return '';
    }
  });

  constructor() {
    effect(() => {
      // Reactively clear pins when step changes
      const currentStep = this.step();
      // Wait for next tick to avoid setting signal during computation if needed,
      // but in an effect setting a signal is technically allowed via allowSignalWrites,
      // or we can just use untracked. Actually, since setting pin1/pin2 triggers no 
      // other synchronous computations here, it's fine. Wait, Angular 16+ requires 
      // allowSignalWrites for setting signals in effects. Let's just use standard
      // untracked if needed. In Angular 19 setting signals in effects is allowed again!
      this.pin1.set('');
      this.pin2.set('');
    });
  }

  ngOnInit() {
    const e = this.state.email();
    if (!e) {
      this.router.navigate(['/login']);
      return;
    }
    this.email.set(e);
  }

  async onSubmit() {
    this.clearError();
    const s = this.step();
    
    if (s === 'login') {
      if (!this.pin1() || this.pin1().length < 4) {
        this.mpinError.set('Please enter your 4-digit MPIN.');
        return;
      }
      this.keyboardService.openKeyboardSync();
      await this.handleLogin();
    } else if (s === 'forgot') {
      this.keyboardService.openKeyboardSync();
      await this.handleForgot();
    } else if (s === 'reset') {
      this.keyboardService.openKeyboardSync();
      await this.handleReset();
    } else if (s === 'set-mpin') {
      if (!this.pin1() || this.pin1().length < 4) {
        this.mpinError.set('Please enter a 4-digit MPIN.');
        return;
      }
      this.keyboardService.openKeyboardSync();
      this.state.mpin.set(this.pin1());
      this.router.navigate(['/confirm-mpin']);
    } else if (s === 'confirm-mpin') {
      if (!this.pin1() || this.pin1().length < 4) {
        this.mpinError.set('Please re-enter your MPIN.');
        return;
      }
      if (this.state.mpin() !== this.pin1()) {
        this.mpinError.set('MPINs do not match.');
        return;
      }
      this.keyboardService.openKeyboardSync();
      this.router.navigate(['/onboarding-profile']);
    }
  }

  async handleLogin() {
    this.isLoading.set(true);
    try {
      const status = await this.supabaseService.preLoginCheck(this.email());
      if (!status.allowed) {
        const date = new Date(status.locked_until!);
        this.mpinError.set(`Account locked. Try again after ${date.toLocaleTimeString()}`);
        this.isLoading.set(false);
        this.keyboardService.closeKeyboard();
        return;
      }

      try {
        await this.supabaseService.signInWithMpin(this.email(), this.pin1());
        // Schema hasn't been applied to DB yet, skipping to avoid 400 errors
        // await this.supabaseService.client.rpc('reset_failed_login', { p_email: this.email() });
      } catch (authError: any) {
        const failStatus = await this.supabaseService.recordFailedLogin(this.email());
        if (failStatus.success) {
          if (failStatus.failed_attempts! >= 3) {
            this.mpinError.set('Locked due to 3 failed attempts. Try later or reset.');
          } else {
            this.mpinError.set(`Incorrect MPIN. ${3 - failStatus.failed_attempts!} attempts left.`);
          }
        } else {
          this.mpinError.set('Invalid login credentials.');
        }
      }
    } catch (e) {
      this.mpinError.set('An error occurred during login.');
      this.keyboardService.closeKeyboard();
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleForgot() {
    if (!this.pin1() || this.pin1().length < 4) {
      this.mpinError.set('Please enter the 4-digit code.');
      return;
    }
    this.isLoading.set(true);
    try {
      await this.supabaseService.verifyMpinResetOtp(this.email(), this.pin1());
      this.state.otpCode.set(this.pin1());
      this.router.navigate(['/reset']);
    } catch (e) {
      this.mpinError.set('Invalid or expired code.');
      this.keyboardService.closeKeyboard();
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleReset() {
    if (this.pin1() !== this.pin2()) {
      this.mpinError.set('MPINs do not match.');
      return;
    }
    if (!/^\d{4}$/.test(this.pin2())) {
      this.mpinError.set('MPIN must be exactly 4 numeric digits.');
      return;
    }

    this.isLoading.set(true);
    try {
      await this.supabaseService.updateMpin(this.pin1(), this.email(), this.state.otpCode());
      await this.supabaseService.client.rpc('reset_failed_login', { p_email: this.email() });
      this.toastService.showSuccess('MPIN reset successfully! You are now logged in.');
      this.state.clearAll();
      this.router.navigate(['/dashboard']);
    } catch (e) {
      this.mpinError.set('Failed to reset MPIN.');
      this.keyboardService.closeKeyboard();
    } finally {
      this.isLoading.set(false);
    }
  }

  async startForgotMpin() {
    this.keyboardService.openKeyboardSync();
    this.isLoading.set(true);
    try {
      await this.supabaseService.sendMpinResetOtp(this.email());
      this.toastService.showSuccess('Recovery code sent to your email.');
      this.router.navigate(['/forgot']);
    } catch (e) {
      this.mpinError.set('Failed to send recovery code.');
      this.keyboardService.closeKeyboard();
    } finally {
      this.isLoading.set(false);
    }
  }

  quoteMessage = computed(() => {
    const s = this.step();
    if (s === 'set-mpin') {
      return 'Start your journey to smarter spending and bigger savings.';
    }
    if (s === 'confirm-mpin') {
      return 'Master your budget. Watch your savings grow.';
    }
    return 'Control your expenses, before they control you.';
  });
}
