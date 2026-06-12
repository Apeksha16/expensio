import { Component, inject, effect, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { SplitService, SplitGroup } from '../../../core/services/split.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { FriendService } from '../../../core/services/friend.service';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-group-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(100%)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ],
  template: `
    <ng-container *ngIf="splitService.isGroupSheetOpen()">
      <!-- Backdrop -->
      <div 
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>

      <!-- Sheet Content -->
      <div 
        @slideUp
        class="fixed bottom-0 left-0 right-0 bg-white z-[70] 
               rounded-t-none max-h-[95vh] overflow-y-auto overscroll-contain flex flex-col"
      >
        <!-- Header -->
        <div class="flex justify-between items-center py-3 px-6 bg-black text-white sticky top-0 z-10">
          <h2 class="text-xl font-extrabold tracking-tight">{{ isEditing ? 'Edit group' : 'Create group' }}</h2>
          <div class="flex gap-2">
            <button *ngIf="isEditing" type="button" (click)="onDelete()" class="w-8 h-8 bg-red-500 flex items-center justify-center border-2 border-transparent hover:border-white transition-colors rounded-none text-white">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <div class="p-6">
          <form [formGroup]="groupForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Group Name</label>
              <input type="text" formControlName="name" placeholder="Goa Trip, Roommates..." 
                class="w-full bg-white border-2 border-black rounded-none p-4 font-bold text-lg focus:outline-none focus:bg-gray-50 transition-colors">
            </div>

            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Group Members</label>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-3 p-4 bg-white border-2 border-black cursor-not-allowed">
                  <input type="checkbox" checked disabled class="w-6 h-6 accent-black border-2 border-black">
                  <span class="font-bold text-lg text-gray-500">Me (Admin)</span>
                </label>
                
                <label *ngFor="let friend of friendService.friends()" class="flex items-center gap-3 p-4 bg-white border-2 border-black cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" (change)="toggleGroupMember(friend.username)" [checked]="isGroupMember(friend.username)" class="w-6 h-6 accent-black border-2 border-black">
                  <span class="font-bold text-lg">{{ friend.name }}</span>
                </label>
              </div>
            </div>

            <div class="pt-2 flex gap-2">
              <button type="button" (click)="close()"
                class="flex-1 bg-white text-black border-2 border-black rounded-none p-4 font-bold text-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button type="submit" [disabled]="groupForm.invalid || selectedGroupMembers().length === 0"
                class="flex-1 bg-black text-white border-2 border-black rounded-none p-4 font-bold text-lg hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white">
                {{ isEditing ? 'Update' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ng-container>
  `
})
export class GroupSheetComponent implements OnInit {
  splitService = inject(SplitService);
  friendService = inject(FriendService);
  confirmService = inject(ConfirmService);
  authService = inject(AuthService);
  fb = inject(FormBuilder);

  groupForm!: FormGroup;
  isEditing = false;
  selectedGroupMembers = signal<string[]>([]);

  constructor() {
    effect(() => {
      const group = this.splitService.editingGroup();
      if (group) {
        this.isEditing = true;
        const currentUsername = this.authService.userProfile().username;
        this.groupForm.patchValue({
          name: group.name
        });
        this.selectedGroupMembers.set(group.members.filter(m => m !== currentUsername));
      } else {
        this.isEditing = false;
        if (this.groupForm) {
          this.groupForm.reset();
        }
        this.selectedGroupMembers.set([]);
      }
    });
  }

  ngOnInit() {
    this.groupForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  toggleGroupMember(username: string) {
    const current = this.selectedGroupMembers();
    if (current.includes(username)) {
      this.selectedGroupMembers.set(current.filter(u => u !== username));
    } else {
      this.selectedGroupMembers.set([...current, username]);
    }
  }

  isGroupMember(username: string) {
    return this.selectedGroupMembers().includes(username);
  }

  close() {
    this.splitService.closeGroupSheet();
  }

  onDelete() {
    this.confirmService.open({
      title: 'Delete group',
      message: 'Are you sure you want to delete this group? The split expenses will remain, but the group will be removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        const group = this.splitService.editingGroup();
        if (group) {
          this.splitService.deleteGroup(group.id);
        }
        this.close();
      }
    });
  }

  onSubmit() {
    if (this.groupForm.invalid || this.selectedGroupMembers().length === 0) return;

    const v = this.groupForm.value;
    const currentUsername = this.authService.userProfile().username;

    const group: SplitGroup = {
      id: this.isEditing ? this.splitService.editingGroup()!.id : Date.now().toString(),
      name: v.name,
      members: [currentUsername, ...this.selectedGroupMembers()]
    };

    if (this.isEditing) {
      this.splitService.updateGroup(group);
    } else {
      this.splitService.createGroup(group);
    }

    this.close();
  }
}
