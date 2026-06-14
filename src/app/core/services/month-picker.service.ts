import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MonthPickerService {
  isOpen = signal(false);
  activeMonth = signal('');
  
  private monthSelectedSubject = new Subject<string>();
  monthSelected$ = this.monthSelectedSubject.asObservable();

  open(activeMonth: string) {
    this.activeMonth.set(activeMonth);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }

  selectMonth(month: string) {
    this.monthSelectedSubject.next(month);
    this.close();
  }
}
