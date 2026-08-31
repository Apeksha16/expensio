import { Injectable, signal, untracked } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'offline' | 'sync_success' | 'loading' | 'banner';

export interface ToastAction {
  label: string;
  action: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  action?: ToastAction;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, typeOrOptions: ToastType | ToastOptions = 'info', duration: number = 3000) {
    const id = Math.random().toString(36).substring(2, 9);
    
    let options: ToastOptions = {};
    if (typeof typeOrOptions === 'string') {
      options = { type: typeOrOptions, duration };
    } else {
      options = typeOrOptions;
    }
    
    const type = options.type || 'info';
    
    // Prevent duplicate active toasts with exactly the same message and type
    const currentToasts = untracked(() => this.toasts());
    if (currentToasts.some(t => t.message === message && t.type === type)) {
      return '';
    }
    
    this.toasts.update(current => [...current, { 
      id, 
      type, 
      message, 
      action: options.action
    }]);

    const finalDuration = options.duration !== undefined ? options.duration : 3000;
    if (finalDuration > 0) {
      setTimeout(() => this.remove(id), finalDuration);
    }
    
    return id; // Return ID in case caller wants to remove it manually (e.g. loading)
  }

  showSuccess(titleOrMsg: string, subtitleOrDuration?: string | number, duration?: number) {
    let msg = titleOrMsg;
    let dur = 3000;
    if (typeof subtitleOrDuration === 'number') {
      dur = subtitleOrDuration;
    } else if (typeof subtitleOrDuration === 'string') {
      msg = subtitleOrDuration; // Prefer subtitle as the main message if provided
      if (typeof duration === 'number') dur = duration;
    }
    this.show(msg, { type: 'success', duration: dur });
  }

  showError(titleOrMsg: string, subtitleOrDuration?: string | number, action?: ToastAction) {
    let msg = titleOrMsg;
    let dur = 4000;
    if (typeof subtitleOrDuration === 'number') {
      dur = subtitleOrDuration;
    } else if (typeof subtitleOrDuration === 'string') {
      msg = subtitleOrDuration;
    }
    this.show(msg, { type: 'error', duration: dur, action });
  }

  showInfo(titleOrMsg: string, subtitle?: string, action?: ToastAction) {
    const msg = subtitle ? subtitle : titleOrMsg;
    this.show(msg, { type: 'info', action });
  }

  showWarning(titleOrMsg: string, subtitle?: string) {
    const msg = subtitle ? subtitle : titleOrMsg;
    this.show(msg, { type: 'warning' });
  }

  showOffline(titleOrMsg: string = 'Working Offline', subtitle: string = 'Changes will sync when you\'re back online') {
    this.show(subtitle, { type: 'offline' });
  }

  showSyncSuccess(titleOrMsg: string = 'All changes synced', subtitle: string = 'Everything is up to date') {
    this.show(subtitle, { type: 'sync_success', duration: 2000 });
  }

  showLoading(title: string = 'Saving changes...', subtitle: string = 'Please don\'t close the app') {
    const msg = subtitle ? subtitle : title;
    return this.show(msg, { type: 'loading', duration: 0 }); // indefinite until removed
  }

  showBanner(titleOrMsg: string, subtitle?: string, action?: ToastAction) {
    const msg = subtitle ? subtitle : titleOrMsg;
    this.show(msg, { type: 'banner', action });
  }

  remove(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
