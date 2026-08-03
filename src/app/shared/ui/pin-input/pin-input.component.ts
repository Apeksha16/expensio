import {
  Component,
  forwardRef,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-pin-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PinInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center gap-6 w-full">
      @for (digit of digitsArray; track $index) {
        <div 
          class="w-5 h-5 rounded-full transition-all duration-200"
          [class.bg-indigo-600]="digit"
          [class.border-2]="!digit"
          [class.border-indigo-200]="!digit"
          [class.border-transparent]="digit"
        ></div>
      }
    </div>
  `,
})
export class PinInputComponent implements ControlValueAccessor {
  length = input<number>(4);
  autofocus = input<boolean>(false); // No-op now, kept for API compat
  
  digitsArray: boolean[] = [false, false, false, false];
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    const valStr = value || '';
    const len = this.length();
    
    // Create an array of booleans representing whether a digit is present at each index
    this.digitsArray = Array.from({ length: len }, (_, i) => i < valStr.length);
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
}
