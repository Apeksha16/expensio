import { Component, input, output, computed, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService, IconData } from '../../../core/services/icon.service';
import { HapticService } from '../../../core/services/haptic.service';

@Component({
  selector: 'app-icon-suggester',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col gap-1.5 w-full">
      <div class="flex justify-between items-center px-1">
        <label class="text-[11px] font-bold text-gray-500 tracking-wider uppercase">
          Suggested Icon
        </label>
        @if (selectedIconId()) {
          <button 
            type="button" 
            (click)="clearSelection()"
            [ngClass]="themeClasses().clearText"
            class="text-[10px] font-bold uppercase tracking-widest active:scale-95"
          >
            Clear
          </button>
        }
      </div>
      
      <div #scrollContainer class="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 -mx-1 snap-x scrollbar-hide" style="scrollbar-width: none;">
        @for (icon of suggestedIcons(); track icon.id) {
          <button
            type="button"
            (click)="selectIcon(icon.id)"
            class="relative shrink-0 w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-90 snap-start"
            [ngClass]="isSelected(icon.id) ? themeClasses().activeBtn : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path [attr.d]="icon.svg"></path>
            </svg>
          </button>
        }
      </div>
      <p class="text-[10px] text-slate-400 px-1 font-medium">
        @if (!selectedIconId()) {
          Select an icon to override the category default.
        } @else {
          Custom icon locked.
        }
      </p>
    </div>
  `
})
export class IconSuggesterComponent {
  iconService = inject(IconService);
  haptic = inject(HapticService);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLDivElement>;

  inputText = input<string>('');
  selectedIconId = input<string | null | undefined>(null);
  themeColor = input<'subscriptions' | 'goals' | 'expenses' | 'splits' | 'budgets'>('subscriptions');
  
  iconSelected = output<string>();
  iconCleared = output<void>();

  constructor() {
    effect(() => {
      // Only reset scroll when the input text changes, not when selection changes
      this.inputText();
      if (this.scrollContainer?.nativeElement) {
        setTimeout(() => {
          this.scrollContainer.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
        }, 10);
      }
    });
  }

  suggestedIcons = computed(() => {
    let icons = this.iconService.getSuggestedIcons(this.inputText() || '', 6);
    const selectedId = this.selectedIconId();
    
    if (selectedId) {
      const existingIndex = icons.findIndex(i => i.id === selectedId);
      // If the selected icon is not in the natural suggestions, inject it
      if (existingIndex === -1) {
        const selectedIcon = this.iconService.getIconById(selectedId);
        if (selectedIcon) {
          icons.unshift(selectedIcon);
          if (icons.length > 6) icons.pop();
        }
      }
      // If it is already in the list, leave it exactly where it is so it doesn't shift
    }
    return icons;
  });

  themeClasses = computed(() => {
    const theme = this.themeColor();
    switch (theme) {
      case 'goals':
        return {
          clearText: 'text-goals-primary',
          activeBtn: 'bg-goals-primary text-white border border-transparent shadow-md shadow-goals-primary/30'
        };
      case 'expenses':
        return {
          clearText: 'text-expense-primary',
          activeBtn: 'bg-expense-primary text-white border border-transparent shadow-md shadow-expense-primary/30'
        };
      case 'splits':
        return {
          clearText: 'text-splits-primary',
          activeBtn: 'bg-splits-primary text-white border border-transparent shadow-md shadow-splits-primary/30'
        };
      case 'budgets':
        return {
          clearText: 'text-budget-primary',
          activeBtn: 'bg-budget-primary text-white border border-transparent shadow-md shadow-budget-primary/30'
        };
      case 'subscriptions':
      default:
        return {
          clearText: 'text-subscriptions-primary',
          activeBtn: 'bg-subscriptions-primary text-white border border-transparent shadow-md shadow-subscriptions-primary/30'
        };
    }
  });

  isSelected(id: string): boolean {
    return this.selectedIconId() === id;
  }

  selectIcon(id: string) {
    this.haptic.impactLight();
    this.iconSelected.emit(id);
  }

  clearSelection() {
    this.haptic.impactLight();
    this.iconCleared.emit();
  }
}
