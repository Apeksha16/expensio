import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HapticService {
  private hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  selection() {
    if (this.hasVibration) navigator.vibrate(10);
  }

  success() {
    if (this.hasVibration) navigator.vibrate([15, 100, 30]);
  }

  warning() {
    if (this.hasVibration) navigator.vibrate([30, 50, 30]);
  }

  error() {
    if (this.hasVibration) navigator.vibrate([50, 50, 50, 50, 50]);
  }

  impactLight() {
    if (this.hasVibration) navigator.vibrate(15);
  }

  impactMedium() {
    if (this.hasVibration) navigator.vibrate(30);
  }

  impactHeavy() {
    if (this.hasVibration) navigator.vibrate(50);
  }
}
