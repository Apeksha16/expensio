import { Component, inject, signal, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
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
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  animations: [
    slideInAnimation,
    trigger('fadeOut', [
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ],
})
export class App implements AfterViewInit {
  protected readonly title = signal('expensio');
  pwaService = inject(PwaService);
  authService = inject(AuthService);
  private contexts = inject(ChildrenOutletContexts);
  private keyboardService = inject(KeyboardService);

  @ViewChild('globalHiddenInput') globalHiddenInput!: ElementRef<HTMLInputElement>;

  motivationalQuotes = [
    "Every rupee you spend is a vote for what matters most in your life.",
    "A budget is not a restriction; it's a plan for your priorities.",
    "Save first, spend what's left—not the other way around.",
    "Every saved amount is a gift to your future self.",
    "Saving is not about having less today; it's about having more choices later.",
    "Don't focus only on returns; focus on staying invested.",
    "Every long-term investor experiences uncertainty; successful ones keep going.",
    "Compounding rewards those who are patient and disciplined.",
    "Financial planning turns dreams into achievable milestones.",
    "Your future is shaped by today's financial decisions.",
    "Review your finances regularly; what gets measured gets managed."
  ];
  randomQuote = signal('');

  constructor() {
    this.randomQuote.set(this.motivationalQuotes[Math.floor(Math.random() * this.motivationalQuotes.length)]);
  }

  ngAfterViewInit() {
    if (this.globalHiddenInput) {
      this.keyboardService.registerInput(this.globalHiddenInput.nativeElement);
    }
  }

  getAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animationIndex'];
  }
}
