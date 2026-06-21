import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../core/services/auth.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-gray-50 p-6 flex flex-col gap-8">
      <!-- Top Selected Avatar & Selection List -->
      <div class="flex flex-col items-center gap-6 mt-4">
        <div class="w-32 h-32 border-2 border-black rounded-none bg-gray-200 overflow-hidden">
          <img
            [src]="getSelectedAvatarUrl()"
            alt="Active Avatar"
            class="w-full h-full object-cover"
          />
        </div>

        <div class="w-full flex flex-col gap-3">
          <h3 class="text-sm font-extrabold tracking-widest uppercase text-black">Choose Avatar</h3>
          <div class="flex overflow-x-auto gap-4 py-2 px-1 no-scrollbar">
            @for (avatar of authService.avatars; track avatar) {
              <button
                (click)="selectAvatar(avatar.id)"
                class="flex-shrink-0 w-20 h-20 border-2 rounded-none flex items-center justify-center transition-transform duration-300 overflow-hidden"
                [ngClass]="
                  pendingProfile().avatarId === avatar.id
                    ? 'border-black scale-110 bg-white'
                    : 'border-transparent hover:scale-105 bg-gray-200'
                "
              >
                <img [src]="avatar.url" alt="Avatar" class="w-full h-full object-cover" />
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Form Elements -->
      <div class="flex flex-col gap-6">
        <!-- Editable Name -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
            >Full Name</label
          >
          <div class="relative group">
            <input
              type="text"
              [ngModel]="pendingProfile().name"
              (ngModelChange)="updateField('name', $event)"
              class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans"
              placeholder="e.g. Jane Doe"
            />
          </div>
        </div>

        <!-- Non-editable Username -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
            >Username</label
          >
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500 font-medium">@</span>
            </div>
            <input
              type="text"
              [value]="pendingProfile().username"
              disabled
              class="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8 opacity-50 cursor-not-allowed"
            />
          </div>
        </div>

        <!-- Non-editable Email -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
            >Email</label
          >
          <div class="relative group">
            <input
              type="text"
              [value]="pendingProfile().email"
              disabled
              class="w-full bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans opacity-50 cursor-not-allowed"
            />
          </div>
        </div>

        <!-- Editable Salary -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase"
            >Monthly Salary</label
          >
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-gray-500 font-medium">₹</span>
            </div>
            <input
              type="text"
              inputmode="numeric"
              [ngModel]="formattedSalary"
              (ngModelChange)="formatSalary($event)"
              class="w-full bg-white border-2 border-gray-200 text-gray-900 text-sm rounded-none focus:ring-0 focus:border-[#1a2e22] hover:border-gray-300 block p-2.5 outline-none transition-all placeholder-gray-300 min-h-[44px] touch-manipulation font-sans pl-8 pr-12"
              placeholder="0"
            />
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span class="text-gray-400 text-xs">INR</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Update Button -->
      <button
        [disabled]="!isDirty() || isUpdating()"
        (click)="handleUpdate()"
        class="w-full bg-black text-white p-3.5 font-bold text-sm tracking-wide transition-all border-2 border-transparent active:scale-[0.98] mt-4 rounded-none disabled:opacity-50 disabled:bg-black disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        @if (isUpdating()) {
          <svg
            class="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Updating...
        } @else {
          Update Profile
        }
      </button>
    </div>
  `,
})
export class Profile {
  authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);

  pendingProfile = signal<UserProfile>({ ...this.authService.userProfile() });
  isUpdating = signal(false);

  isDirty = computed(() => {
    const current = this.authService.userProfile();
    const pending = this.pendingProfile();
    return (
      current.name !== pending.name ||
      current.salary !== pending.salary ||
      current.avatarId !== pending.avatarId
    );
  });

  getSelectedAvatarUrl(): string {
    return this.authService.getAvatarUrl(this.pendingProfile().avatarId);
  }

  selectAvatar(id: number) {
    this.pendingProfile.update((p) => ({ ...p, avatarId: id }));
  }

  updateField(field: keyof UserProfile, value: any) {
    this.pendingProfile.update((p) => ({ ...p, [field]: value }));
  }

  get formattedSalary(): string {
    const val = this.pendingProfile().salary;
    if (!val) return '';
    return new Intl.NumberFormat('en-IN').format(val);
  }

  formatSalary(value: string) {
    if (!value) {
      this.updateField('salary', 0);
      return;
    }
    let rawValue = value.toString().replace(/[^0-9]/g, '');
    if (!rawValue) {
      this.updateField('salary', 0);
      return;
    }
    if (parseInt(rawValue) > 999999) {
      rawValue = '999999';
    }
    this.updateField('salary', parseInt(rawValue));
  }

  async handleUpdate() {
    if (!this.isDirty() || this.isUpdating()) return;

    this.isUpdating.set(true);
    const current = this.authService.userProfile();
    const pending = this.pendingProfile();

    try {
      if (current.salary !== pending.salary) {
        this.confirmService.open({
          title: 'Update Salary',
          message:
            'Applying the monthly salary will take effect from the 1st of the upcoming month only.',
          confirmText: 'Apply Updates',
          cancelText: 'Cancel',
          onConfirm: async () => {
            this.isUpdating.set(true);
            const success = await this.authService.updateProfile(this.pendingProfile());
            if (success) {
              this.toastService.showSuccess('Profile updated successfully!', 2000);
            } else {
              this.toastService.showError('Failed to update profile');
            }
            this.isUpdating.set(false);
          },
        });
        this.isUpdating.set(false);
      } else {
        const success = await this.authService.updateProfile(this.pendingProfile());
        if (success) {
          this.toastService.showSuccess('Profile updated successfully!', 2000);
        } else {
          this.toastService.showError('Failed to update profile');
        }
        this.isUpdating.set(false);
      }
    } catch (e) {
      this.isUpdating.set(false);
      this.toastService.showError('Failed to update profile');
    }
  }
}
