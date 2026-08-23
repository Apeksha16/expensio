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
              <span
                class="text-[10px] font-bold tracking-wide uppercase text-splits-dark bg-splits-surface px-3 py-1 rounded-full border border-splits-primary/10"
              >
                Added
                {{
                  $safeNavigationMigration(splitService.editingGroup()?.created_at) | date: 'medium'
                }}
              </span>
            </div>
          }
          @if (friendService.acceptedFriends().length > 0) {
            <form [formGroup]="groupForm" (ngSubmit)="onSubmit()" class="space-y-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Group Name</label
                >
                <input
                  [appAutofocus]="!splitService.editingGroup()?.id"
                  appSafeInput
                  type="text"
                  formControlName="name"
                  placeholder="e.g. Goa Trip"
                  class="w-full bg-white border-2 border-gray-100 text-slate-900 font-semibold text-base rounded-2xl px-4 py-3 outline-none transition-all touch-manipulation shadow-sm placeholder-slate-400 focus:border-splits-primary focus:ring-4 focus:ring-splits-primary/15"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase"
                  >Group Members</label
                >
                <div class="flex flex-col gap-2">
                  <label
                    class="flex items-center gap-3 p-3 bg-gray-100 border border-gray-200 rounded-xl cursor-not-allowed opacity-80"
                  >
                    <input
                      type="checkbox"
                      checked
                      disabled
                      class="w-5 h-5 accent-splits-primary border border-gray-300 rounded-md"
                    />
                    <span class="font-bold text-sm text-gray-600">Me (Admin)</span>
                  </label>
                  @for (friend of friendService.acceptedFriends(); track friend.id) {
                    <label
                      class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl cursor-pointer transition-all shadow-sm active:scale-95"
                    >
                      <input
                        type="checkbox"
                        (change)="toggleGroupMember(friend.profile.id)"
                        [checked]="isGroupMember(friend.profile.id)"
                        class="w-5 h-5 accent-splits-primary border border-gray-300 rounded-md"
                      />
                      <span class="font-bold text-sm text-gray-900 truncate">{{
                        friend.profile.name.split(' ')[0]
                      }}</span>
                    </label>
                  }
                </div>
              </div>
              <div class="mt-6 flex gap-3">
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
            <div class="flex flex-col items-center justify-center py-8 text-center gap-4">
              <div class="w-16 h-16 rounded-full bg-splits-surface border border-splits-primary/20 flex items-center justify-center shadow-inner">
                <svg
                  class="w-8 h-8 text-splits-primary"
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
                <h3 class="text-lg font-bold text-gray-900 mb-1">No friends yet</h3>
                <p class="text-sm text-gray-500">
                  You need to add friends before you can create a group.
                </p>
              </div>
              <button
                type="button"
                (click)="close()"
                class="mt-4 font-bold rounded-2xl transition-all active:scale-95 flex justify-center items-center gap-2 touch-manipulation px-6 py-4 text-sm bg-splits-primary text-white shadow-md shadow-splits-primary/30"
              >
                Okay
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
      };
      await this.splitService.updateGroup(group);
    } else {
      const group: Omit<SplitGroup, 'id' | 'created_at'> = {
        name: v.name,
        creator_id: currentUserId,
        members: [currentUserId, ...this.selectedGroupMembers()],
      };
      await this.splitService.createGroup(group);
    }

    this.isSaving.set(false);
    this.close();
  }
}
