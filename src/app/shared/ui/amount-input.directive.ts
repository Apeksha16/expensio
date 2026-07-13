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
            const rawValue = String(val).replace(/[^0-9.]/g, '');
            const numValue = rawValue ? parseFloat(rawValue) : null;
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
          const numValue = Number(val);
          if (!isNaN(numValue)) {
            const strVal = String(val);
            const numParts = strVal.split('.');
            const integerPart = parseInt(numParts[0] || '0', 10);
            let formatted = new Intl.NumberFormat('en-IN').format(integerPart);
            if (numParts.length > 1) {
              formatted += '.' + numParts[1].substring(0, 2);
            }
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
    const charsBeforeCursor = beforeCursor.replace(/[^0-9.]/g, '').length;

    let rawValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one dot exists
    const parts = rawValue.split('.');
    if (parts.length > 2) {
      rawValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    const finalParts = rawValue.split('.');
    if (finalParts.length === 2 && finalParts[1].length > 2) {
      rawValue = finalParts[0] + '.' + finalParts[1].substring(0, 2);
    }

    let formatted = '';
    if (rawValue) {
      const numParts = rawValue.split('.');
      const integerPart = numParts[0] ? parseInt(numParts[0], 10) : 0;
      formatted = new Intl.NumberFormat('en-IN').format(integerPart);
      if (numParts.length > 1) {
        formatted += '.' + numParts[1];
      }
    }

    inputEl.value = formatted;
    
    // Restore cursor position
    let newCursorPos = 0;
    let charsSeen = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/[0-9.]/.test(formatted[i])) {
        charsSeen++;
      }
      if (charsSeen === charsBeforeCursor) {
        newCursorPos = i + 1;
        break;
      }
    }
    
    if (charsBeforeCursor === 0) {
      newCursorPos = 0;
    }
    
    if (document.activeElement === inputEl) {
      inputEl.setSelectionRange(newCursorPos, newCursorPos);
    }
  }
}
