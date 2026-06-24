import { Injectable, signal, PLATFORM_ID, inject, ApplicationRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';
import { fromEvent, merge, of } from 'rxjs';
import { map, first, filter } from 'rxjs/operators';
import { ConfirmService } from './confirm.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private platformId = inject(PLATFORM_ID);
  private updates = inject(SwUpdate);
  private appRef = inject(ApplicationRef);
  private confirmService = inject(ConfirmService);
  private toastService = inject(ToastService);

  readonly isOffline = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initNetworkStatus();
      this.initUpdateCheck();
    }
  }

  private initNetworkStatus() {
    // Check initial status
    this.isOffline.set(!navigator.onLine);

    merge(
      fromEvent(window, 'online').pipe(map(() => false)),
      fromEvent(window, 'offline').pipe(map(() => true))
    ).subscribe(offline => {
      this.isOffline.set(offline);
    });
  }

  private initUpdateCheck() {
    if (!this.updates.isEnabled) return;

    // Check for updates when the app stabilizes
    this.appRef.isStable.pipe(
      first(isStable => isStable === true)
    ).subscribe(() => {
      this.updates.checkForUpdate();
    });

    // Listen for available updates
    this.updates.versionUpdates.pipe(
      filter((evt): evt is any => evt.type === 'VERSION_READY')
    ).subscribe(evt => {
      this.promptUpdate();
    });
  }

  private promptUpdate() {
    this.confirmService.open({
      title: 'Update Available',
      message: 'A new version of the app is available. Would you like to update now?',
      confirmText: 'Update',
      cancelText: 'Later',
      onConfirm: async () => {
        try {
          await this.updates.activateUpdate();
        } catch (e) {}
        window.location.reload();
      }
    });
  }

  async backgroundCheck(): Promise<void> {
    if (!this.updates.isEnabled) return;
    try {
      await this.updates.checkForUpdate();
    } catch (e) {}
  }

  async checkForManualUpdate(): Promise<void> {
    if (!this.updates.isEnabled) {
      this.toastService.showInfo("App updates aren't available on this device.");
      return;
    }

    try {
      this.toastService.showInfo('Checking for updates...');
      let updateFound = await this.updates.checkForUpdate();
      if (!updateFound) {
        // Retry once
        updateFound = await this.updates.checkForUpdate();
      }

      if (!updateFound) {
        this.toastService.showInfo("You're already using the latest version.");
      }
    } catch (err) {
      this.toastService.showError("Couldn't check for updates.");
    }
  }
}
