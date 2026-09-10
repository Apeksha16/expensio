import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BalancePromptService {
  isOpen = signal(false);

  open() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }
}
