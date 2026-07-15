import {
  Component,
  inject,
  OnInit,
  computed,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { trigger, transition, style, animate, state } from '@angular/animations';
import { QuickActionsService, NavItem } from '../../../core/services/quick-actions.service';
import { AuthService } from '../../../core/services/auth.service';
import { KeyboardService } from '../../../core/services/keyboard.service';
import { SwipeToCloseDirective } from '../swipe-to-close.directive';

interface SelectableNavItem {
  navItem: NavItem;
  selected: boolean;
}

@Component({
  selector: 'app-quick-actions-sheet',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, SwipeToCloseDirective],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('400ms cubic-bezier(0.32, 0.72, 0, 1)', style({ transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('250ms cubic-bezier(0.7, 0, 0.84, 0)', style({ transform: 'translateY(100%)' })),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (quickActionsService.isSheetOpen()) {
      <!-- Backdrop -->
      <div
        @fadeIn
        class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        (click)="closeSheet()"
      ></div>

      <!-- Sheet -->
      <div
        @slideUp
        appSwipeToClose
        (swipeClose)="closeSheet()"
        class="fixed bottom-0 left-0 right-0 bg-black z-[70] max-h-[95vh] flex flex-col shadow-2xl"
      >
        <!-- Header -->
        <div
          class="flex justify-between items-center py-4 px-6 bg-black text-white sticky top-[-2px] z-10 shrink-0"
        >
          <h2 class="text-xl font-extrabold tracking-tight">Configure Quick Actions</h2>
        </div>

        <div class="p-6 flex flex-col gap-6 overflow-y-auto overscroll-none bg-white flex-1">
          <p class="text-[11px] font-semibold text-gray-500 tracking-widest uppercase">
            Select up to 4 items. Drag to reorder.
          </p>

          <div cdkDropList class="flex flex-col gap-2" (cdkDropListDropped)="drop($event)">
            @for (item of items(); track item.navItem.id) {
              <div
                cdkDrag
                class="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 cursor-grab hover:border-[#1a2e22] transition-colors rounded-none select-none touch-manipulation active:cursor-grabbing"
                [class.opacity-50]="!item.selected && selectedCount() >= 4"
              >
                <!-- Custom Drag Preview (shown while dragging) -->
                <div
                  *cdkDragPreview
                  class="flex items-center gap-3 p-3 bg-white border-2 border-[#1a2e22] shadow-2xl rounded-none select-none touch-manipulation box-border min-w-[300px]"
                >
                  <div class="text-gray-400 p-1">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                  </div>
                  <div
                    class="w-8 h-8 rounded-none border-2 border-black bg-gray-200 flex items-center justify-center text-black shrink-0"
                  >
                    <span
                      [innerHTML]="item.navItem.icon"
                      class="w-4 h-4 flex items-center justify-center"
                    ></span>
                  </div>
                  <div class="flex-1 font-bold text-sm text-gray-900 truncate">
                    {{ item.navItem.name }}
                  </div>
                  <input
                    type="checkbox"
                    [checked]="item.selected"
                    class="w-5 h-5 accent-[#1a2e22] border-2 border-gray-300 rounded-none focus:ring-0 mr-2"
                    readonly
                  />
                </div>

                <!-- Drag Handle SVG for Visual Indicator -->
                <div class="text-gray-400 p-1">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 8h16M4 16h16"
                    />
                  </svg>
                </div>

                <!-- Icon -->
                <div
                  class="w-8 h-8 rounded-none border-2 border-black bg-gray-200 flex items-center justify-center text-black shrink-0"
                >
                  <span
                    [innerHTML]="item.navItem.icon"
                    class="w-4 h-4 flex items-center justify-center"
                  ></span>
                </div>

                <!-- Name -->
                <div class="flex-1 font-bold text-sm text-gray-900 truncate">
                  {{ item.navItem.name }}
                </div>

                <!-- Checkbox -->
                <input
                  type="checkbox"
                  [checked]="item.selected"
                  [disabled]="!item.selected && selectedCount() >= 4"
                  (change)="toggleSelection(item)"
                  class="w-5 h-5 accent-[#1a2e22] border-2 border-gray-300 rounded-none focus:ring-0 mr-2"
                />
              </div>
            }
          </div>

          <div class="mt-4 flex gap-4 shrink-0">
            <button
              type="button"
              (click)="closeSheet()"
              class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-300 text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              (click)="save()"
              class="flex-1 font-medium rounded-none transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 touch-manipulation font-sans px-4 py-2 text-sm min-h-[44px] bg-[#1a2e22] hover:bg-[#2f4d3b] text-white disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class QuickActionsSheetComponent {
  quickActionsService = inject(QuickActionsService);
  private authService = inject(AuthService);

  items = signal<SelectableNavItem[]>([]);

  selectedCount = computed(() => this.items().filter((i) => i.selected).length);

  constructor() {
    // Use proper native effect
    effect(() => {
      if (this.quickActionsService.isSheetOpen()) {
        this.initializeItems();
      }
    });
  }

  initializeItems() {
    const sequence = this.authService.userProfile().quickActions || [
      'expenses',
      'splits',
      'friends',
      'budgets',
    ];
    const allModules = this.quickActionsService.navItems.filter(
      (m) => m.id !== 'dashboard' && m.id !== 'profile' && !m.hideFromBottomNav,
    );

    const newItems: SelectableNavItem[] = [];

    // First add the selected ones in order
    for (const id of sequence) {
      const navItem = allModules.find((m) => m.id === id);
      if (navItem) {
        newItems.push({ navItem, selected: true });
      }
    }

    // Then add the remaining ones
    for (const navItem of allModules) {
      if (!sequence.includes(navItem.id)) {
        newItems.push({ navItem, selected: false });
      }
    }

    this.items.set(newItems);
  }

  toggleSelection(item: SelectableNavItem) {
    if (!item.selected && this.selectedCount() >= 4) {
      return; // Max reached
    }

    this.items.update((current) => {
      const idx = current.findIndex((i) => i.navItem.id === item.navItem.id);
      if (idx !== -1) {
        const newArr = [...current];
        newArr[idx] = { ...newArr[idx], selected: !newArr[idx].selected };
        return newArr;
      }
      return current;
    });
  }

  drop(event: CdkDragDrop<SelectableNavItem[]>) {
    const currentItems = [...this.items()];
    moveItemInArray(currentItems, event.previousIndex, event.currentIndex);
    this.items.set(currentItems);
  }

  async save() {
    // Extract the ordered list of selected IDs
    const selectedIds = this.items()
      .filter((i) => i.selected)
      .map((i) => i.navItem.id);

    await this.authService.updateProfile({ quickActions: selectedIds });
    this.closeSheet();
  }

  closeSheet() {
    this.quickActionsService.closeSheet();
  }
}
