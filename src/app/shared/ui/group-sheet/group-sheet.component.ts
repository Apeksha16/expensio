import { Component, inject, effect, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { SplitService, SplitGroup } from '../../../core/services/split.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { FriendService } from '../../../core/services/friend.service';
import { AuthService } from '../../../core/services/auth.service';

import { SwipeToCloseDirective } from '../swipe-to-close.directive';
import { HapticService } from '../../../core/services/haptic.service';
import { AutofocusDirective } from '../autofocus.directive';
import { SafeInputDirective } from '../safe-input.directive';

@Component({
  selector: 'app-group-sheet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SwipeToCloseDirective,
    AutofocusDirective,
    SafeInputDirective,
  ],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(100%)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('300ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    @if (splitService.isGroupSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        (click)="close()"
        class="active:scale-[0.98] transition-all duration-200 fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>
      <!-- Sheet Content -->
      <div
        @slideUp
        appSwipeToClose
        (swipeClose)="close()"
        class="fixed bottom-0 left-0 right-0 z-[70] max-h-[95vh] flex flex-col rounded-t-[32px] shadow-2xl bg-white overflow-hidden"
        style="padding-bottom: env(safe-area-inset-bottom);"
      >
        <!-- Header -->
        <div class="flex justify-between items-center py-4 px-6 text-white bg-splits-primary rounded-t-[32px] sticky top-0 z-10 shrink-0 shadow-sm">
          <h2 class="text-lg font-bold tracking-wide">
            {{ isEditing ? 'Edit Group' : 'Create Group' }}
          </h2>
          @if (isEditing) {
            <button
              type="button"
              (click)="onDelete()"
              [disabled]="isDeleting()"
              class="w-8 h-8 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 transition-all rounded-full flex items-center justify-center disabled:opacity-50 active:scale-95"
            >
              @if (isDeleting()) {
                <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              } @else {
                <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            </button>
          }
        </div>

        <div class="p-6 bg-white flex-1 overflow-y-auto overscroll-none pb-6" style="scrollbar-width: none;">
          @if (isEditing) {
            <div class="flex justify-center mb-5">
              <div class="relative inline-flex items-center justify-center group">
                <input 
                  type="datetime-local" 
                  [value]="getDatetimeLocal(selectedDate())"
                  (change)="onDateChange($event)"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <span class="text-[10px] font-bold tracking-wide uppercase text-splits-dark bg-splits-surface px-3 py-1 rounded-full border border-splits-primary/10 flex items-center gap-1 group-active:scale-95 transition-transform">
                  <svg class="w-3 h-3 text-splits-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Updated at {{ selectedDate() | date: 'medium' }}
                </span>
              </div>
            </div>
          } @else {
            <div class="flex justify-center mb-5">
              <div class="relative inline-flex items-center justify-center group">
                <input 
                  type="datetime-local" 
                  [value]="getDatetimeLocal(selectedDate())"
                  (change)="onDateChange($event)"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <span class="text-[10px] font-bold tracking-wide uppercase text-splits-dark bg-splits-surface px-3 py-1 rounded-full border border-splits-primary/10 flex items-center gap-1 group-active:scale-95 transition-transform">
                  <svg class="w-3 h-3 text-splits-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Adding at {{ selectedDate() | date: 'medium' }}
                </span>
              </div>
            </div>
          }
          @if (friendService.acceptedFriends().length > 0) {
            <form [formGroup]="groupForm" (ngSubmit)="onSubmit()" class="space-y-5">
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase ml-1"
                  >Group Name</label
                >
                <div class="relative flex items-center">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <input
                    [appAutofocus]="!splitService.editingGroup()?.id"
                    appSafeInput
                    type="text"
                    formControlName="name"
                    placeholder="e.g. Goa Trip"
                    class="w-full bg-slate-50 border-2 border-slate-100 text-slate-900 font-bold text-base rounded-2xl pl-11 pr-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400 focus:border-splits-primary focus:ring-4 focus:ring-splits-primary/15 focus:bg-white"
                  />
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase ml-1"
                  >Group Members</label
                >
                <div class="flex flex-col gap-2">
                  <label
                    class="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-not-allowed opacity-70"
                  >
                    <div class="w-5 h-5 rounded-md border bg-slate-300 border-slate-300 text-white flex items-center justify-center">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div
                      class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-sm text-slate-500 shrink-0"
                    >
                      Me
                    </div>
                    <span class="font-bold text-sm text-slate-600">Me (Admin)</span>
                  </label>
                  @for (friend of friendService.acceptedFriends(); track friend.id) {
                    <div
                      (click)="toggleGroupMember(friend.profile.id)"
                      class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all shadow-sm active:scale-[0.98]"
                      [ngClass]="isGroupMember(friend.profile.id) ? 'bg-splits-primary/5 border-2 border-splits-primary/30' : 'bg-white border-2 border-slate-100'"
                    >
                      <div 
                        class="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                        [ngClass]="isGroupMember(friend.profile.id) ? 'bg-splits-primary border-splits-primary text-white' : 'bg-white border-slate-300 text-transparent'"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors"
                        [ngClass]="isGroupMember(friend.profile.id) ? 'bg-splits-primary text-white' : 'bg-slate-100 text-slate-600'"
                      >
                        {{ friend.profile.name.charAt(0) }}
                      </div>
                      <div class="flex flex-col flex-1 min-w-0">
                        <span class="font-bold text-sm text-gray-900 truncate">{{
                          friend.profile.name
                        }}</span>
                        <span class="text-[10px] font-semibold text-gray-500 truncate">{{
                          '@' + friend.profile.username
                        }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
              <div class="mt-6 flex gap-3 pt-2">
                <button
                  type="button"
                  (click)="close()"
                  class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-slate-100 text-slate-700 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!groupForm.valid || isSaving() || isDeleting()"
                  class="flex-1 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-4 py-4 text-sm bg-splits-primary text-white shadow-md shadow-splits-primary/30 disabled:opacity-50 disabled:active:scale-100"
                >
                  @if (isSaving()) {
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
                  }
                  {{ isEditing ? 'Update' : 'Save' }}
                </button>
              </div>
            </form>
          } @else {
            <div class="flex flex-col items-center justify-center py-10 text-center gap-4">
              <div class="w-20 h-20 rounded-full bg-splits-surface border-4 border-white shadow-sm flex items-center justify-center">
                <svg
                  class="w-10 h-10 text-splits-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 class="text-xl font-extrabold text-gray-900 mb-1">No friends yet</h3>
                <p class="text-sm font-medium text-gray-500 max-w-[240px] mx-auto">
                  You need to add friends before you can create a group to share expenses with.
                </p>
              </div>
              <button
                type="button"
                (click)="close()"
                class="mt-6 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-8 py-3 text-sm bg-splits-primary text-white shadow-md shadow-splits-primary/30"
              >
                Got it
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class GroupSheetComponent implements OnInit {
  haptic = inject(HapticService);
  splitService = inject(SplitService);
  friendService = inject(FriendService);
  confirmService = inject(ConfirmService);
  authService = inject(AuthService);
  fb = inject(FormBuilder);

  groupForm!: FormGroup;
  isEditing = false;
  isSaving = signal(false);
  isDeleting = signal(false);
  selectedGroupMembers = signal<string[]>([]);
  selectedDate = signal<string>(new Date().toISOString());

  constructor() {
    effect(() => {
      const group = this.splitService.editingGroup();
      if (group) {
        this.isEditing = true;
        const currentUserId = this.authService.userProfile().id;
        this.groupForm.patchValue({
          name: group.name,
        });
        this.selectedGroupMembers.set(group.members.filter((m) => m !== currentUserId));
        this.selectedDate.set(group.created_at || new Date().toISOString());
      } else {
        this.isEditing = false;
        if (this.groupForm) {
          this.groupForm.reset();
        }
        this.selectedGroupMembers.set([]);
        this.selectedDate.set(new Date().toISOString());
      }
    });
  }

  ngOnInit() {
    this.groupForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  toggleGroupMember(id: string) {
    const current = this.selectedGroupMembers();
    if (current.includes(id)) {
      this.selectedGroupMembers.set(current.filter((u) => u !== id));
    } else {
      this.selectedGroupMembers.set([...current, id]);
    }
  }

  isGroupMember(id: string) {
    return this.selectedGroupMembers().includes(id);
  }

  getDatetimeLocal(isoString: string): string {
    if (!isoString) return '';
    const d = new Date(isoString);
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
  }

  onDateChange(event: any) {
    const val = event.target.value;
    if (val) {
      this.selectedDate.set(new Date(val).toISOString());
    }
  }

  close() {
    this.haptic.impactLight();
    this.splitService.closeGroupSheet();
  }

  onDelete() {
    this.confirmService.open({
      title: 'Delete group',
      message:
        'Are you sure you want to delete this group? The split expenses will remain, but the group will be removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        const group = this.splitService.editingGroup();
        if (group) {
          this.isDeleting.set(true);
          await this.splitService.deleteGroup(group.id);
          this.isDeleting.set(false);
        }
        this.close();
      },
    });
  }

  async onSubmit() {
    if (this.groupForm.invalid || this.selectedGroupMembers().length === 0) return;
    this.isSaving.set(true);

    const v = this.groupForm.value;
    const currentUserId = this.authService.userProfile().id;

    if (this.isEditing) {
      const group: SplitGroup = {
        ...this.splitService.editingGroup()!,
        name: v.name,
        members: [currentUserId, ...this.selectedGroupMembers()],
        created_at: this.selectedDate(),
      };
      await this.splitService.updateGroup(group);
    } else {
      const group: Omit<SplitGroup, 'id'> = {
        name: v.name,
        creator_id: currentUserId,
        members: [currentUserId, ...this.selectedGroupMembers()],
        created_at: this.selectedDate(),
      };
      await this.splitService.createGroup(group);
    }

    this.isSaving.set(false);
    this.close();
  }
}
