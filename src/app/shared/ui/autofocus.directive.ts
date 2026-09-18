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

    // Focus immediately
    this.el.nativeElement.focus();

    // Focus again after animation to ensure focus is not lost and page doesn't scroll weirdly.
    // iOS will allow this async focus transfer because the dummy input in SplitService already opened the keyboard!
    setTimeout(() => {
      this.el.nativeElement.focus();
    }, 50);

    setTimeout(() => {
      this.el.nativeElement.focus();
    }, 400);
  }
}
