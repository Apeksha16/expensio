import { Component, input, inject } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [],
  host: {
    class: 'block w-full h-full',
  },
  template: `
    <div
      class="min-h-[100dvh] flex flex-col items-center justify-end p-4 bg-black relative overflow-hidden"
    >
      @if (isMpinScreen()) {
        <!-- Top Box for MPIN Screens -->
        <div
          class="max-w-md w-full bg-white p-6 pt-10 rounded-none border-2 border-black relative flex flex-col items-center justify-center mb-4"
        >
          <button
            (click)="goBack()"
            class="absolute top-4 left-4 text-black font-bold flex items-center hover:underline z-10"
          >
            <svg
              class="w-4 h-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="3"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <img
            src="logo.png"
            alt="Expensio Logo"
            class="w-16 h-16 mb-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-contain bg-white"
          />
          <p class="text-sm text-gray-500 font-semibold text-center leading-relaxed">
            {{ quoteMessage() }}
          </p>
        </div>
      }

      <!-- Bottom/Main Box -->
      <div
        class="max-w-md w-full bg-white p-8 rounded-none border-2 border-black relative overflow-hidden flex flex-col"
      >
        @if (!isMpinScreen()) {
          <!-- Back button for non-initial, non-MPIN screens -->
          @if (showBackButton()) {
            <button
              (click)="goBack()"
              class="absolute top-4 left-4 text-black font-bold flex items-center hover:underline z-10"
            >
              <svg
                class="w-4 h-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          }

          <!-- Standard Logo for single box layout -->
          <div class="text-center mb-6 flex flex-col items-center mt-4">
            <img
              src="logo.png"
              alt="Expensio Logo"
              class="w-16 h-16 mb-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-contain bg-white"
            />
            <h2 class="text-3xl font-extrabold text-black tracking-tight">Expensio</h2>
          </div>
        }

        <div class="w-full relative flex-1">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent {
  private location = inject(Location);

  isMpinScreen = input<boolean>(false);
  quoteMessage = input<string>('Control your expenses, before they control you.');
  showBackButton = input<boolean>(true);

  goBack() {
    this.location.back();
  }
}
