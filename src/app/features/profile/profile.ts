import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../core/services/auth';
import { ConfirmService } from '../../core/services/confirm.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 p-6 flex flex-col gap-8 pb-12">
      
      <!-- Top Selected Avatar & Selection List -->
      <div class="flex flex-col items-center gap-6 mt-4">
        <div class="w-32 h-32 border-2 border-black rounded-none bg-gray-200 overflow-hidden">
           <img [src]="getSelectedAvatarUrl()" alt="Active Avatar" class="w-full h-full object-cover">
        </div>

        <div class="w-full flex flex-col gap-3">
          <h3 class="text-sm font-extrabold tracking-widest uppercase text-black">Choose Avatar</h3>
          <div class="flex overflow-x-auto gap-4 py-2 px-1 no-scrollbar">
            <button 
              *ngFor="let avatar of avatars" 
              (click)="selectAvatar(avatar.id)"
              class="flex-shrink-0 w-20 h-20 border-2 rounded-none flex items-center justify-center transition-transform duration-300 overflow-hidden"
              [ngClass]="pendingProfile().avatarId === avatar.id ? 'border-black scale-110 bg-white' : 'border-transparent hover:scale-105 bg-gray-200'"
            >
              <img [src]="avatar.url" alt="Avatar" class="w-full h-full object-cover">
            </button>
          </div>
        </div>
      </div>

      <!-- Form Elements -->
      <div class="flex flex-col gap-6">
        
        <!-- Editable Name -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-extrabold tracking-widest uppercase text-black">Full Name</label>
          <input 
            type="text" 
            [ngModel]="pendingProfile().name" 
            (ngModelChange)="updateField('name', $event)"
            class="w-full bg-white border-2 border-black rounded-none p-4 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all"
            placeholder="Your Name"
          >
        </div>

        <!-- Non-editable Username -->
        <div class="flex flex-col gap-2 opacity-60">
          <label class="text-sm font-extrabold tracking-widest uppercase text-black">Username</label>
          <input 
            type="text" 
            [value]="pendingProfile().username"
            disabled
            class="w-full bg-gray-200 border-2 border-gray-400 text-gray-500 rounded-none p-4 font-bold text-lg cursor-not-allowed"
          >
        </div>

        <!-- Non-editable Email -->
        <div class="flex flex-col gap-2 opacity-60">
          <label class="text-sm font-extrabold tracking-widest uppercase text-black">Email</label>
          <input 
            type="text" 
            [value]="pendingProfile().email"
            disabled
            class="w-full bg-gray-200 border-2 border-gray-400 text-gray-500 rounded-none p-4 font-bold text-lg cursor-not-allowed"
          >
        </div>

        <!-- Editable Salary -->
        <div class="flex flex-col gap-2 mt-4">
          <label class="text-sm font-extrabold tracking-widest uppercase text-blue-600">Monthly Salary</label>
          <input 
            type="number" 
            [ngModel]="pendingProfile().salary" 
            (ngModelChange)="updateField('salary', $event)"
            (keydown)="preventE($event)"
            class="w-full bg-white border-2 border-blue-600 rounded-none p-4 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all"
            placeholder="e.g. 50000"
          >
        </div>

      </div>

      <!-- Update Button -->
      <button 
        [disabled]="!isDirty()"
        (click)="handleUpdate()"
        class="w-full mt-4 p-4 font-extrabold text-lg transition-colors border-2 rounded-none"
        [ngClass]="isDirty() ? 'bg-black text-white border-black hover:bg-gray-800' : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'"
      >
        UPDATE PROFILE
      </button>
    </div>
  `
})
export class Profile {
  authService = inject(AuthService);
  private confirmService = inject(ConfirmService);

  pendingProfile = signal<UserProfile>({ ...this.authService.userProfile() });

  isDirty = computed(() => {
    const current = this.authService.userProfile();
    const pending = this.pendingProfile();
    return current.name !== pending.name || 
           current.salary !== pending.salary || 
           current.avatarId !== pending.avatarId;
  });

  avatars = [
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

  getSelectedAvatarUrl(): string {
    const avatar = this.avatars.find(a => a.id === this.pendingProfile().avatarId);
    return avatar ? avatar.url : this.avatars[0].url;
  }

  selectAvatar(id: number) {
    this.pendingProfile.update(p => ({ ...p, avatarId: id }));
  }

  updateField(field: keyof UserProfile, value: any) {
    this.pendingProfile.update(p => ({ ...p, [field]: value }));
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  handleUpdate() {
    if (!this.isDirty()) return;

    const current = this.authService.userProfile();
    const pending = this.pendingProfile();

    if (current.salary !== pending.salary) {
      this.confirmService.open({
        title: 'Update Salary',
        message: 'Applying the monthly salary will take effect from the 1st of the upcoming month only.',
        confirmText: 'Apply Updates',
        cancelText: 'Cancel',
        onConfirm: () => {
          this.authService.updateProfile(this.pendingProfile());
        }
      });
    } else {
      this.authService.updateProfile(this.pendingProfile());
    }
  }
}
