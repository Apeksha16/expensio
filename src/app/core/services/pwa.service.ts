import { Injectable, signal, PLATFORM_ID, inject, ApplicationRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';
import { fromEvent, merge, of } from 'rxjs';
import { map, first, filter } from 'rxjs/operators';
import { ConfirmService } from './confirm.service';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private platformId = inject(PLATFORM_ID);
  private updates = inject(SwUpdate);
  private appRef = inject(ApplicationRef);
  private confirmService = inject(ConfirmService);

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
      onConfirm: () => {
        window.location.reload();
      }
    });
  }
}
