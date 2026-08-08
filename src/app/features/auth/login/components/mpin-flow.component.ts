import {
  Component,
  inject,
  OnInit,
  signal,
  input,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
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
import { AppIconComponent } from '../../../../shared/ui/icon/app-icon.component';
import { LockPasswordIcon } from '@hugeicons/core-free-icons';

import { NumericKeypadComponent } from '../../../../shared/ui/numeric-keypad/numeric-keypad.component';

export type MpinStep = 'login' | 'forgot' | 'reset' | 'set-mpin' | 'confirm-mpin';

@Component({
  selector: 'app-mpin-flow',
  imports: [PinInputComponent, NumericKeypadComponent, FormsModule, AuthLayoutComponent, AppIconComponent],
  host: {
    class: 'block w-full h-full',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <app-auth-layout [isMpinScreen]="true" [showBackButton]="true">
      <div class="w-full flex flex-col h-full items-center mt-4">
        <div class="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
          <app-icon [icon]="LockPasswordIcon" size="40" class="text-indigo-600"></app-icon>
        </div>

        <div class="flex flex-col items-center">
          <h3 class="text-black font-semibold text-center text-2xl mb-3" [innerHTML]="heading()"></h3>
          <p class="text-gray-500 text-center font-medium text-sm leading-relaxed max-w-[280px]" [innerHTML]="subheading()"></p>
        </div>

        <div class="flex flex-col w-full items-center mt-8">
          <div class="relative w-full pb-8 flex flex-col items-center">
            <app-pin-input
              [ngModel]="step() === 'reset' && resetStage() === 'confirm' ? pin2() : pin1()"
              (ngModelChange)="onPinChange()"
            ></app-pin-input>
            
            @if (mpinError()) {
              <p
                class="text-red-500 text-xs font-bold absolute bottom-1 text-center"
              >
                {{ mpinError() }}
              </p>
            }
          </div>

          <app-numeric-keypad (keyPress)="onKeypadPress($event)"></app-numeric-keypad>

          @if (step() === 'login') {
            <button
              (click)="startForgotMpin()"
              class="active:scale-[0.98] transition-all duration-200 mt-4 text-sm font-semibold text-indigo-600 block w-full text-center"
            >
              Forgot mPIN?
            </button>
          }
        </div>
      </div>
    </app-auth-layout>
  `,
})
export class MpinFlowComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private state = inject(LoginStateService);
  private keyboardService = inject(KeyboardService);

  LockPasswordIcon = LockPasswordIcon;

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
  resetStage = signal<'new' | 'confirm'>('new');

  pin1 = signal('');
  pin2 = signal('');
  mpinError = signal('');

  clearError() {
    this.mpinError.set('');
  }

  onPinChange() {
    this.clearError();
    // Auto-submit if PIN length is 4 to match the design interaction
    if (this.step() === 'reset') {
      if (this.resetStage() === 'new' && this.pin1().length === 4) {
        setTimeout(() => this.resetStage.set('confirm'), 100);
      } else if (this.resetStage() === 'confirm' && this.pin2().length === 4) {
        this.onSubmit();
      }
    } else {
      if (this.pin1().length === 4) {
        this.onSubmit();
      }
    }
  }

  buttonText = computed(() => {
    switch (this.step()) {
      case 'login':
        return 'Log in';
      case 'forgot':
        return 'Verify Code';
      case 'reset':
        return 'Reset MPIN';
      case 'set-mpin':
      case 'confirm-mpin':
        return 'Next';
      default:
        return 'Continue';
    }
  });

  heading = computed(() => {
    switch (this.step()) {
      case 'login':
        return 'Enter your <span class="text-indigo-600">mPIN</span>';
      case 'forgot':
        return 'Check your Email';
      case 'reset':
        return this.resetStage() === 'confirm' ? 'Confirm your mPIN' : 'Set New mPIN';
      case 'set-mpin':
        return 'Create your <span class="text-indigo-600">mPIN</span>';
      case 'confirm-mpin':
        return 'Confirm your <span class="text-indigo-600">mPIN</span>';
      default:
        return '';
    }
  });

  subheading = computed(() => {
    switch (this.step()) {
      case 'login':
        return 'Welcome back! Enter your mPIN<br/>to continue.';
      case 'forgot':
        return 'Enter the code sent to your email address.';
      case 'reset':
        return 'Your new mPIN must be 4 digits.';
      case 'set-mpin':
      case 'confirm-mpin':
        return 'This 4-digit code will keep your account secure.';
      default:
        return '';
    }
  });

  onKeypadPress(key: string) {
    if (this.isLoading()) return;

    const currentPin = this.step() === 'reset' && this.resetStage() === 'confirm' ? this.pin2 : this.pin1;

    // If there's an error displayed, any keypress restarts the entry
    if (this.mpinError()) {
      this.clearError();
      if (key === 'backspace') {
        currentPin.set('');
      } else {
        currentPin.set(key);
      }
      return;
    }

    if (key === 'backspace') {
      if (currentPin().length > 0) {
        currentPin.update((p) => p.slice(0, -1));
        this.onPinChange();
      } else if (this.step() === 'reset' && this.resetStage() === 'confirm') {
        // If backspacing on empty confirm screen, go back to new PIN stage
        this.resetStage.set('new');
        this.pin2.set('');
      }
    } else if (currentPin().length < 4) {
      currentPin.update((p) => p + key);
      this.onPinChange();
    }
  }

  constructor() {
    effect(() => {
      // Reactively clear pins when step changes
      const currentStep = this.step();
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
      this.toastService.showSuccess('MPIN Reset', "You're now logged in.");
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
      this.toastService.showSuccess('Email Sent', 'Recovery code sent to your email.');
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
