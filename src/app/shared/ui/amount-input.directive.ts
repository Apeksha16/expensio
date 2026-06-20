import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appAmountInput]',
  standalone: true
})
export class AmountInputDirective {
  private el = inject(ElementRef);
  private ngControl = inject(NgControl, { optional: true });

  constructor() {
    // Inject all value accessors on this element
    const accessors = inject(NG_VALUE_ACCESSOR, { optional: true, self: true }) as any[];
    if (accessors && accessors.length > 0) {
      const accessor = accessors[0]; // Get the DefaultValueAccessor

      // Intercept registerOnChange to clean the value before it reaches the FormControl
      const originalRegisterOnChange = accessor.registerOnChange.bind(accessor);
      accessor.registerOnChange = (fn: any) => {
        originalRegisterOnChange((val: any) => {
          if (val !== null && val !== undefined && val !== '') {
            const rawValue = String(val).replace(/[^0-9]/g, '');
            const numValue = rawValue ? parseInt(rawValue, 10) : null;
            fn(numValue);
          } else {
            fn(null);
          }
        });
      };

      // Intercept writeValue to format the value with commas before displaying it
      const originalWriteValue = accessor.writeValue.bind(accessor);
      accessor.writeValue = (val: any) => {
        if (val !== null && val !== undefined && val !== '') {
          const rawValue = String(val).replace(/[^0-9]/g, '');
          const numValue = rawValue ? parseInt(rawValue, 10) : null;
          if (numValue !== null) {
            const formatted = new Intl.NumberFormat('en-IN').format(numValue);
            if (this.el.nativeElement.value !== formatted) {
              originalWriteValue(formatted);
            }
          } else {
            if (this.el.nativeElement.value !== '') originalWriteValue('');
          }
        } else {
          if (this.el.nativeElement.value !== '') originalWriteValue('');
        }
      };
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    let selectionStart = inputEl.selectionStart || 0;
    
    const value = inputEl.value;
    const beforeCursor = value.substring(0, selectionStart);
    const digitsBeforeCursor = beforeCursor.replace(/[^0-9]/g, '').length;

    const rawValue = value.replace(/[^0-9]/g, '');
    const numValue = rawValue ? parseInt(rawValue, 10) : null;
    
    let formatted = '';
    if (numValue !== null) {
      formatted = new Intl.NumberFormat('en-IN').format(numValue);
    }

    inputEl.value = formatted;
    
    // Restore cursor position
    let newCursorPos = 0;
    let digitsSeen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/[0-9]/.test(formatted[i])) {
        digitsSeen++;
      }
      if (digitsSeen === digitsBeforeCursor) {
        newCursorPos = i + 1;
        break;
      }
    }
    
    if (digitsBeforeCursor === 0) {
      newCursorPos = 0;
    }
    
    if (document.activeElement === inputEl) {
      inputEl.setSelectionRange(newCursorPos, newCursorPos);
    }
  }
}
