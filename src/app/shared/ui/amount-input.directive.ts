import { Directive, ElementRef, HostListener, inject, OnInit, OnDestroy } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

@Directive({
  selector: '[appAmountInput]',
  standalone: true
})
export class AmountInputDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private ngControl = inject(NgControl, { optional: true });
  private destroy$ = new Subject<void>();

  ngOnInit() {
    if (this.ngControl && this.ngControl.valueChanges) {
      // Format initial value if present
      this.formatAndSet(this.ngControl.value);

      // Listen for programmatic updates
      this.ngControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
        this.formatAndSet(val);
      });
    }
  }

  private formatAndSet(val: any) {
    if (val !== null && val !== undefined && val !== '') {
      const formatted = new Intl.NumberFormat('en-IN').format(Number(val));
      if (this.el.nativeElement.value !== formatted) {
        this.el.nativeElement.value = formatted;
      }
    } else {
      if (this.el.nativeElement.value !== '') {
        this.el.nativeElement.value = '';
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const rawValue = value.replace(/[^0-9]/g, '');
    const numValue = rawValue ? parseInt(rawValue, 10) : null;
    
    // Update the native input to show commas
    if (numValue !== null) {
      this.el.nativeElement.value = new Intl.NumberFormat('en-IN').format(numValue);
    } else {
      this.el.nativeElement.value = '';
    }
    
    // Update the form control with the raw number
    if (this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(numValue, { emitEvent: false });
    }
  }
}
