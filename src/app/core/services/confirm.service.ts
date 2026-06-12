import { Injectable, signal } from '@angular/core';

export interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  isOpen = signal(false);
  config = signal<ConfirmConfig | null>(null);

  open(config: ConfirmConfig) {
    this.config.set({
      ...config,
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel'
    });
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    setTimeout(() => this.config.set(null), 300); // clear after animation
  }
}
