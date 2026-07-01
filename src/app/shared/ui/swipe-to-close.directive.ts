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
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
      return;
    }

    const target = event.target as HTMLElement;
    
    // Check if any parent up to contentEl is scrolled down
    let current: HTMLElement | null = target;
    let isScrolledDown = false;
    while (current && current !== document.body) {
      if (current.scrollTop > 0) {
        isScrolledDown = true;
        break;
      }
      if (current === this.contentEl) break;
      current = current.parentElement;
    }

    if (isScrolledDown) {
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

    // If the content is currently scrolled down, we should not be dragging the sheet
    if (this.contentEl.scrollTop > 0) {
      this.isDragging = false;
      return;
    }

    const y = event.touches[0].clientY;
    const deltaY = y - this.startY;

    // If the user pulled UP, they intend to scroll the content. 
    // Cancel sheet dragging for this touch session.
    if (deltaY < -2) {
      this.isDragging = false;
      return;
    }

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


}
