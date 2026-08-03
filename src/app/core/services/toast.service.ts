import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'offline' | 'sync_success' | 'loading' | 'banner';

export interface ToastAction {
  label: string;
  action: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  subtitle?: string;
  action?: ToastAction;
}

export interface ToastOptions {
  subtitle?: string;
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(title: string, typeOrOptions: ToastType | ToastOptions = 'info', duration: number = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    
    let options: ToastOptions = {};
    if (typeof typeOrOptions === 'string') {
      options = { type: typeOrOptions, duration };
    } else {
      options = typeOrOptions;
    }
    
    const type = options.type || 'info';
    
    this.toasts.update(current => [...current, { 
      id, 
      type, 
      title, 
      subtitle: options.subtitle,
      action: options.action
    }]);

    const finalDuration = options.duration !== undefined ? options.duration : 3000;
    if (finalDuration > 0) {
      setTimeout(() => this.remove(id), finalDuration);
    }
    
    return id; // Return ID in case caller wants to remove it manually (e.g. loading)
  }

  showSuccess(title: string, subtitleOrDuration?: string | number, duration?: number) {
    let sub: string | undefined;
    let dur = 3000;
    if (typeof subtitleOrDuration === 'number') {
      dur = subtitleOrDuration;
    } else if (typeof subtitleOrDuration === 'string') {
      sub = subtitleOrDuration;
      if (typeof duration === 'number') dur = duration;
    }
    this.show(title, { subtitle: sub, type: 'success', duration: dur });
  }

  showError(title: string, subtitleOrDuration?: string | number, action?: ToastAction) {
    let sub: string | undefined;
    let dur = 4000;
    if (typeof subtitleOrDuration === 'number') {
      dur = subtitleOrDuration;
    } else if (typeof subtitleOrDuration === 'string') {
      sub = subtitleOrDuration;
    }
    this.show(title, { subtitle: sub, type: 'error', duration: dur, action });
  }

  showInfo(title: string, subtitle?: string, action?: ToastAction) {
    this.show(title, { subtitle, type: 'info', action });
  }

  showWarning(title: string, subtitle?: string) {
    this.show(title, { subtitle, type: 'warning' });
  }

  showOffline(title: string = 'Working Offline', subtitle: string = 'Changes will sync when you\'re back online') {
    this.show(title, { subtitle, type: 'offline' });
  }

  showSyncSuccess(title: string = 'All changes synced', subtitle: string = 'Everything is up to date') {
    this.show(title, { subtitle, type: 'sync_success' });
  }

  showLoading(title: string = 'Saving changes...', subtitle: string = 'Please don\'t close the app') {
    return this.show(title, { subtitle, type: 'loading', duration: 0 }); // indefinite until removed
  }

  showBanner(title: string, subtitle: string, action?: ToastAction) {
    this.show(title, { subtitle, type: 'banner', action });
  }

  remove(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
