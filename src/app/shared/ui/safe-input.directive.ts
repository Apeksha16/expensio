import { Directive, HostListener, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appSafeInput]',
  standalone: true
})
export class SafeInputDirective {
  // Allow letters, numbers, space, underscore, slash, dot, comma, hyphen, @
  private allowedRegex = /^[a-zA-Z0-9_\ \/\.,\-@]*$/;

  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('input', ['$event']) onInputChange(event: Event) {
    const input = this.el.nativeElement as HTMLInputElement;
    let originalValue = input.value;
    let newValue = '';
    
    for (let i = 0; i < originalValue.length; i++) {
      if (this.allowedRegex.test(originalValue[i])) {
        newValue += originalValue[i];
      }
    }
    
    if (newValue !== originalValue) {
      input.value = newValue;
      if (this.control && this.control.control) {
        this.control.control.setValue(newValue, { emitEvent: false });
      }
    }
  }
}
