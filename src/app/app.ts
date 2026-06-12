import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, ChildrenOutletContexts, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { slideInAnimation } from './core/animations/route-animations';
import { CommonModule } from '@angular/common';
import { PwaService } from './core/services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [slideInAnimation]
})
export class App {
  protected readonly title = signal('expensio');
  private contexts = inject(ChildrenOutletContexts);
  pwaService = inject(PwaService);
  isTransitioning = signal(false);

  constructor() {
    const router = inject(Router);
    router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Only trigger global overlay when navigating from root screens
        if (router.url.includes('/login') || router.url.includes('/onboarding')) {
          this.isTransitioning.set(true);
        }
      } else if (
        event instanceof NavigationEnd || 
        event instanceof NavigationCancel || 
        event instanceof NavigationError
      ) {
        // Keep overlay for 350ms to cover the slide animation duration (300ms)
        setTimeout(() => this.isTransitioning.set(false), 350);
      }
    });
  }

  getAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animationIndex'];
  }
}
