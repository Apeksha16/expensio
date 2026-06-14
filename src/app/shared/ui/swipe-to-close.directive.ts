import { Directive, ElementRef, Output, EventEmitter, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appSwipeToClose]',
  standalone: true
})
export class SwipeToCloseDirective {
  @Output() swipeClose = new EventEmitter<void>();
  @Input() swipeThreshold = 100;

  private startY = 0;
  private currentY = 0;
  private isDragging = false;
  private contentEl: HTMLElement;

  constructor(private el: ElementRef) {
    this.contentEl = this.el.nativeElement;
    this.contentEl.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    const target = event.target as HTMLElement;
    
    // Don't intercept scroll if we are scrolling inside an element
    // But if we are pulling down from the top of a scroll container, allow it
    if (this.isScrollable(target) && target.scrollTop > 0) {
      return;
    }

    this.startY = event.touches[0].clientY;
    this.currentY = 0;
    this.isDragging = true;
    this.contentEl.style.transition = 'none'; // Disable transition while dragging
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;

    const y = event.touches[0].clientY;
    const deltaY = y - this.startY;

    // Only allow dragging downwards
    if (deltaY > 0) {
      this.currentY = deltaY;
      
      // Add rubber band resistance effect after threshold
      let transformY = this.currentY;
      if (transformY > this.swipeThreshold) {
        const extra = transformY - this.swipeThreshold;
        transformY = this.swipeThreshold + (extra * 0.4);
      }
      
      this.contentEl.style.transform = `translateY(${transformY}px)`;
      
      // Prevent default scrolling when dragging down the sheet
      event.preventDefault();
    }
  }

  @HostListener('touchend')
  onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.contentEl.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';

    if (this.currentY > this.swipeThreshold) {
      // Swipe threshold met, close sheet
      this.contentEl.style.transform = `translateY(100%)`;
      this.swipeClose.emit();
    } else {
      // Spring back to original position
      this.contentEl.style.transform = `translateY(0)`;
    }
  }

  private isScrollable(el: HTMLElement): boolean {
    if (!el) return false;
    const overflowY = window.getComputedStyle(el).overflowY;
    const isScrollableNode = overflowY === 'scroll' || overflowY === 'auto';
    return isScrollableNode && el.scrollHeight > el.clientHeight;
  }
}
