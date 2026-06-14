import { Component, inject, signal } from '@angular/core';
import {
  RouterOutlet,
  ChildrenOutletContexts,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
} from '@angular/router';
import { slideInAnimation } from './core/animations/route-animations';

import { PwaService } from './core/services/pwa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [slideInAnimation],
})
export class App {
  protected readonly title = signal('expensio');
  pwaService = inject(PwaService);
  private contexts = inject(ChildrenOutletContexts);
  constructor() {}
  getAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animationIndex'];
  }
}
