import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Button } from '../../shared/ui/button/button';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule, CommonModule, Button],
  template: `
    <div class="min-h-screen flex flex-col justify-end gap-2 bg-black p-4 pb-8 sm:items-center sm:justify-center sm:p-4">
      
      <div class="max-w-md w-full bg-white p-8 sm:p-10 rounded-none text-left sm:text-center">
        <h2 class="text-3xl font-extrabold text-black tracking-tight mb-2">Almost there!</h2>
        <p class="text-gray-500">
          Let's set up your profile.
        </p>
      </div>

      <div class="max-w-md w-full bg-white p-8 sm:p-10 rounded-none">
        
        <form #onboardingForm="ngForm" class="space-y-4 text-left" (ngSubmit)="onCompleteOnboarding(onboardingForm)" novalidate>
          
          <div class="flex flex-col gap-1">
            <label for="name" class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">Name</label>
            <div class="relative group">
              <input type="text" id="name" name="name" required
                [disabled]="isLoading()"
                [(ngModel)]="formData.name" #nameModel="ngModel"
                [ngClass]="{
                  'border-red-500 focus:border-red-500 hover:border-red-500': nameModel.invalid && (nameModel.touched || onboardingForm.submitted),
                  'border-gray-200 focus:border-[#1a2e22] hover:border-gray-300': !(nameModel.invalid && (nameModel.touched || onboardingForm.submitted))
                }"
                class="w-full bg-white border-2 text-gray-900 text-sm rounded-none focus:ring-0 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans disabled:opacity-50 disabled:bg-gray-50" 
                placeholder="e.g. Jane Doe">
            </div>
            <p class="text-[10px] text-red-500 min-h-[16px] transition-opacity duration-200"
               [class.opacity-0]="!nameModel.invalid || (!nameModel.touched && !onboardingForm.submitted)"
               [class.opacity-100]="nameModel.invalid && (nameModel.touched || onboardingForm.submitted)">
               Please enter your legal name.
            </p>
          </div>

          <div class="flex flex-col gap-1">
            <label for="username" class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">Username</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 font-medium">@</span>
              </div>
              <input type="text" id="username" name="username" required
                [disabled]="isLoading()"
                pattern="^[a-zA-Z0-9_]+$"
                [(ngModel)]="formData.username" #usernameModel="ngModel"
                [ngClass]="{
                  'border-red-500 focus:border-red-500 hover:border-red-500': usernameModel.invalid && (usernameModel.touched || onboardingForm.submitted),
                  'border-gray-200 focus:border-[#1a2e22] hover:border-gray-300': !(usernameModel.invalid && (usernameModel.touched || onboardingForm.submitted))
                }"
                class="w-full bg-white border-2 text-gray-900 text-sm rounded-none focus:ring-0 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8 disabled:opacity-50 disabled:bg-gray-50" 
                placeholder="janedoe">
            </div>
            <p class="text-[10px] text-red-500 min-h-[16px] transition-opacity duration-200"
               [class.opacity-0]="!usernameModel.invalid || (!usernameModel.touched && !onboardingForm.submitted)"
               [class.opacity-100]="usernameModel.invalid && (usernameModel.touched || onboardingForm.submitted)">
               Letters, numbers, and underscores only. No spaces.
            </p>
          </div>

          <div class="flex flex-col gap-1">
            <label for="salary" class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">Monthly Salary</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 font-medium">₹</span>
              </div>
              <input type="text" id="salary" name="salary" required
                [disabled]="isLoading()"
                inputmode="numeric"
                [ngModel]="formData.salary"
                (ngModelChange)="formatSalary($event)"
                #salaryModel="ngModel"
                [ngClass]="{
                  'border-red-500 focus:border-red-500 hover:border-red-500': salaryModel.invalid && (salaryModel.touched || onboardingForm.submitted),
                  'border-gray-200 focus:border-[#1a2e22] hover:border-gray-300': !(salaryModel.invalid && (salaryModel.touched || onboardingForm.submitted))
                }"
                class="w-full bg-white border-2 text-gray-900 text-sm rounded-none focus:ring-0 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8 pr-12 disabled:opacity-50 disabled:bg-gray-50" 
                placeholder="0">
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span class="text-gray-400 text-xs">INR</span>
              </div>
            </div>
            <p class="text-[10px] text-red-500 min-h-[16px] transition-opacity duration-200"
               [class.opacity-0]="!salaryModel.invalid || (!salaryModel.touched && !onboardingForm.submitted)"
               [class.opacity-100]="salaryModel.invalid && (salaryModel.touched || onboardingForm.submitted)">
               Enter a valid amount (max 999,999).
            </p>
          </div>

          <div class="mt-4">
            <app-button
              [type]="'submit'"
              [text]="'Complete Setup'"
              [isLoading]="isLoading()"
            ></app-button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: ``,
})
export class Onboarding {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);

  formData = {
    name: '',
    username: '',
    salary: ''
  };

  formatSalary(value: string) {
    if (!value) {
      this.formData.salary = '';
      return;
    }
    let rawValue = value.toString().replace(/[^0-9]/g, '');
    if (!rawValue) {
      this.formData.salary = '';
      return;
    }
    if (parseInt(rawValue) > 999999) {
      rawValue = '999999';
    }
    this.formData.salary = new Intl.NumberFormat('en-IN').format(parseInt(rawValue));
  }

  onCompleteOnboarding(form: NgForm) {
    if (form.invalid) return;
    
    this.isLoading.set(true);
    
    setTimeout(() => {
      this.isLoading.set(false);
      this.authService.completeOnboarding();
      this.router.navigate(['/dashboard']);
    }, 3000);
  }
}
