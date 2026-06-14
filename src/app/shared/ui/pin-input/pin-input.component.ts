import { Component, forwardRef, ElementRef, HostListener, input, viewChildren, effect, inject } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';
import { HapticService } from '../../../core/services/haptic.service';

@Component({
  selector: 'app-pin-input',
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PinInputComponent),
      multi: true
    }
  ],
  template: `
    <style>
      .pin-input {
        line-height: 1;
        padding-top: 10px; /* Adjust to center the asterisk perfectly */
      }
    </style>
    <div class="flex items-center justify-between w-full">
      @for (digit of digits; track $index) {
        <input
          #pinInput
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="one-time-code"
          maxlength="2"
          placeholder="*"
          [value]="digits[$index] ? '*' : ''"
          (input)="onInput($event, $index)"
          (keydown)="onKeyDown($event, $index)"
          (paste)="onPaste($event)"
          (focus)="onFocus($index)"
          [attr.autofocus]="(autofocus() && $index === 0) ? '' : null"
          class="pin-input w-14 h-16 text-center text-3xl font-extrabold bg-gray-50 border-2 border-black focus:outline-none focus:bg-white text-black placeholder-gray-400 rounded-none transition-colors"
        />
      }
    </div>
  `
})
export class PinInputComponent implements ControlValueAccessor {
  length = input<number>(4);
  autofocus = input<boolean>(false);
  inputs = viewChildren<ElementRef<HTMLInputElement>>('pinInput');

  digits: string[] = [];
  disabled = false;
  private haptic = inject(HapticService);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.digits = Array(this.length()).fill('');
    
    effect(() => {
      const len = this.length();
      if (this.digits.length !== len) {
        this.digits = Array(len).fill('');
      }
    });
  }

  // ControlValueAccessor methods
  writeValue(value: string): void {
    if (value === null || value === undefined || value === '') {
      this.digits = Array(this.length()).fill('');
      return;
    }
    
    const valStr = value.toString();
    for (let i = 0; i < this.length(); i++) {
      this.digits[i] = valStr[i] || '';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Handlers
  onInput(event: Event, index: number) {
    const inputElement = event.target as HTMLInputElement;
    let val = inputElement.value;

    // Keep only the last typed character and ensure it's a digit
    val = val.replace(/\D/g, '');
    if (val.length > 1) {
      val = val[val.length - 1];
    }
    
    if (val) this.haptic.impactLight();

    this.digits[index] = val;
    inputElement.value = val ? '*' : '';

    if (val && index < this.length() - 1) {
      this.focusInput(index + 1);
    }

    this.emitChange();
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        // If current is empty, go to previous and clear it
        this.digits[index - 1] = '';
        this.focusInput(index - 1);
        event.preventDefault();
      } else {
        // Clear current
        this.digits[index] = '';
      }
      this.haptic.impactLight();
      this.emitChange();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
      event.preventDefault();
    } else if (event.key === 'ArrowRight' && index < this.length() - 1) {
      this.focusInput(index + 1);
      event.preventDefault();
    } else if (
      event.key !== 'Tab' &&
      event.key !== 'Enter' &&
      !event.metaKey &&
      !event.ctrlKey &&
      !/^[0-9]$/.test(event.key)
    ) {
      event.preventDefault(); // Prevent non-numeric characters from being typed
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text');
    if (!pasteData) return;

    // Filter to only digits
    const digitsOnly = pasteData.replace(/\D/g, '');
    
    for (let i = 0; i < this.length(); i++) {
      if (i < digitsOnly.length) {
        this.digits[i] = digitsOnly[i];
      }
    }
    
    // Focus the next empty input or the last input
    const nextIndex = Math.min(digitsOnly.length, this.length() - 1);
    this.focusInput(nextIndex);
    
    this.emitChange();
  }

  onFocus(index: number) {
    // Select the content on focus
    const inputsArr = this.inputs();
    if (inputsArr[index]) {
      setTimeout(() => {
        inputsArr[index].nativeElement.select();
      });
    }
  }

  private focusInput(index: number) {
    const inputsArr = this.inputs();
    if (inputsArr[index]) {
      inputsArr[index].nativeElement.focus();
    }
  }

  private emitChange() {
    const fullValue = this.digits.join('');
    this.onChange(fullValue);
    this.onTouched();
  }
}
