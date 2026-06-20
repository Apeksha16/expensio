import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
import { KeyboardService } from './core/services/keyboard.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [slideInAnimation],
})
export class App implements AfterViewInit {
  protected readonly title = signal('expensio');
  pwaService = inject(PwaService);
  private contexts = inject(ChildrenOutletContexts);
  private keyboardService = inject(KeyboardService);

  @ViewChild('globalHiddenInput') globalHiddenInput!: ElementRef<HTMLInputElement>;

  constructor() {}

  ngAfterViewInit() {
    if (this.globalHiddenInput) {
      this.keyboardService.registerInput(this.globalHiddenInput.nativeElement);
    }
  }

  getAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animationIndex'];
  }
}
