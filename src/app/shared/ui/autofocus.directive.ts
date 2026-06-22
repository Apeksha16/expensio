import { Directive, ElementRef, AfterViewInit, input } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
  standalone: true
})
export class AutofocusDirective implements AfterViewInit {
  appAutofocus = input<boolean | string>(true);

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    const shouldFocus = this.appAutofocus() !== false && this.appAutofocus() !== 'false';
    if (!shouldFocus) return;

    // Attempt immediate focus to satisfy mobile browser user-interaction requirements
    this.el.nativeElement.focus();
    
    // Attempt delayed focus to ensure it works after bottom sheet slide-up animations
    setTimeout(() => {
      this.el.nativeElement.focus();
    }, 50);
    
    setTimeout(() => {
      this.el.nativeElement.focus();
    }, 350);
  }
}
