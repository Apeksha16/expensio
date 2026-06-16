import { Directive, ElementRef, AfterViewInit } from '@angular/core';

@Directive({
  selector: '[appAutofocus]',
  standalone: true
})
export class AutofocusDirective implements AfterViewInit {
  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
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
