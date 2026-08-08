import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { AppIconComponent } from '../../../../shared/ui/icon/app-icon.component';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [AppIconComponent],
  host: {
    class: 'block w-full h-full bg-white',
  },
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div
      class="min-h-[100dvh] flex flex-col px-6 py-8 bg-white relative w-full h-full"
    >
      @if (showBackButton()) {
        <button
          (click)="goBack()"
          class="active:scale-[0.98] transition-all duration-200 absolute top-10 left-6 text-black font-medium flex items-center z-10 p-2 -ml-2"
        >
          <app-icon [icon]="ArrowLeft01Icon" size="20"></app-icon>
        </button>
      }

      <div class="w-full relative flex-1 flex flex-col mt-12 h-full">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {
  private location = inject(Location);

  isMpinScreen = input<boolean>(false);
  quoteMessage = input<string>('Control your expenses, before they control you.');
  showBackButton = input<boolean>(true);

  ArrowLeft01Icon = ArrowLeft01Icon;

  goBack() {
    this.location.back();
  }
}
