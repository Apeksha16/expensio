import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {
  private hiddenInput: HTMLInputElement | null = null;

  registerInput(input: HTMLInputElement) {
    this.hiddenInput = input;
  }

  openKeyboardSync() {
    if (this.hiddenInput) {
      // Execute focus synchronously to trick iOS into opening the keyboard
      this.hiddenInput.focus();
    }
  }

  closeKeyboard() {
    if (this.hiddenInput) {
      this.hiddenInput.blur();
    }
  }
}
