import { Component, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { ExpenseService } from '../../../core/services/expense.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { DatePickerComponent } from '../date-picker/date-picker';

@Component({
  selector: 'app-bottom-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatePickerComponent],
  animations: [
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(100%)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ],
  template: `
    <ng-container *ngIf="expenseService.isBottomSheetOpen()">
      <!-- Backdrop -->
      <div 
        @fadeIn
        (click)="close()"
        class="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
      ></div>

      <!-- Sheet Content -->
      <div 
        @slideUp
        class="fixed bottom-0 left-0 right-0 bg-white z-[70] 
               rounded-t-none max-h-[95vh] overflow-y-auto overscroll-contain flex flex-col"
      >
        <!-- Header -->
        <div class="flex justify-between items-center py-3 px-6 bg-black text-white sticky top-0 z-10">
          <h2 class="text-xl font-extrabold tracking-tight">{{ isEditing ? 'Edit expense' : 'Add expense' }}</h2>
          <div class="flex gap-2">
            <button *ngIf="isEditing" type="button" (click)="delete()" class="w-8 h-8 bg-red-500 flex items-center justify-center border-2 border-transparent hover:border-white transition-colors rounded-none text-white">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <div class="p-6">
          <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <!-- Amount -->
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Amount</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-extrabold text-black">₹</span>
                <input type="number" formControlName="amount" placeholder="0"
                  (keydown)="preventE($event)"
                  class="w-full bg-white border-2 border-black rounded-none p-4 pl-12 text-3xl font-extrabold focus:outline-none focus:bg-gray-50 transition-colors">
              </div>
            </div>

            <!-- Name -->
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Expense Name</label>
              <input type="text" formControlName="title" placeholder="e.g. Coffee"
                class="w-full bg-white border-2 border-black rounded-none p-4 font-bold text-lg focus:outline-none focus:bg-gray-50 transition-colors">
            </div>

            <!-- Categories -->
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Category</label>
              <div class="grid grid-cols-4 gap-2">
                <button *ngFor="let cat of categories" type="button" (click)="expenseForm.patchValue({category: cat.name})"
                  class="flex flex-col items-center justify-center gap-1 p-2 border-2 rounded-none transition-all h-20"
                  [ngClass]="expenseForm.get('category')?.value === cat.name ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black'">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                    <path [attr.d]="cat.path"></path>
                  </svg>
                  <span class="text-[9px] font-bold uppercase tracking-wider text-center line-clamp-1 w-full overflow-hidden text-ellipsis">{{ cat.name }}</span>
                </button>
              </div>
            </div>
            
            <!-- Date -->
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Date</label>
              <button type="button" (click)="isDatePickerOpen = true"
                class="w-full text-left bg-white border-2 border-black rounded-none p-4 font-bold text-lg focus:outline-none hover:bg-gray-50 transition-colors flex justify-between items-center">
                <span>{{ expenseForm.get('date')?.value | date:'MMM d, yyyy' }}</span>
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
            </div>

            <!-- Bottom Buttons -->
            <div class="pt-2 flex gap-2">
              <button type="button" (click)="close()"
                class="flex-1 bg-white text-black border-2 border-black rounded-none p-4 font-bold text-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button type="submit" [disabled]="!expenseForm.valid"
                class="flex-1 bg-black text-white border-2 border-black rounded-none p-4 font-bold text-lg 
                       hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white">
                {{ isEditing ? 'Update' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ng-container>

    <!-- Global Date Picker for Form -->
    <app-date-picker 
      [isOpen]="isDatePickerOpen" 
      [initialDate]="expenseForm.get('date')?.value"
      (dateSelected)="onDateSelected($event)"
      (closed)="isDatePickerOpen = false">
    </app-date-picker>
  `
})
export class BottomSheetComponent implements OnInit {
  expenseService = inject(ExpenseService);
  private confirmService = inject(ConfirmService);
  private fb = inject(FormBuilder);

  expenseForm!: FormGroup;
  isEditing = false;
  isDatePickerOpen = false;

  categories = [
    { name: 'Food', path: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2 M7 2v20 M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7' },
    { name: 'Transport', path: 'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2 M7 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z' },
    { name: 'Shopping', path: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z M3 6h18 M16 10a4 4 0 0 1-8 0' },
    { name: 'Utilities', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
    { name: 'Entertain', path: 'M2 10h20 M8 2v4 M16 2v4 M2 14h20 M2 18h20 M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z' },
    { name: 'Health', path: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    { name: 'Travel', path: 'M22 2 11 13 M22 2l-7 20-4-9-9-4Z' },
    { name: 'Education', path: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z' },
    { name: 'Bills', path: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
    { name: 'Gifts', path: 'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z' },
    { name: 'Invest', path: 'M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6' },
    { name: 'Other', path: 'M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0 M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0' }
  ];

  constructor() {
    effect(() => {
      const isOpen = this.expenseService.isBottomSheetOpen();
      const editing = this.expenseService.editingExpense();
      
      if (isOpen) {
        if (!this.expenseForm) {
          this.initForm();
        } else {
          this.isEditing = !!editing;
          this.expenseForm.reset({
            title: editing?.title || '',
            amount: editing?.amount || null,
            category: editing?.category || 'Food',
            date: editing?.date ? new Date(editing.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10)
          });
        }
      }
    });
  }

  ngOnInit() {
    if (!this.expenseForm) {
      this.initForm();
    }
  }

  private initForm() {
    const editing = this.expenseService.editingExpense();
    this.isEditing = !!editing;

    this.expenseForm = this.fb.group({
      title: [editing?.title || '', Validators.required],
      amount: [editing?.amount || null, [Validators.required, Validators.min(0.01)]],
      category: [editing?.category || 'Food', Validators.required],
      date: [editing?.date ? new Date(editing.date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10), Validators.required]
    });
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  close() {
    this.expenseService.closeBottomSheet();
  }

  onDateSelected(dateStr: string) {
    this.expenseForm.patchValue({ date: dateStr });
  }

  delete() {
    if (this.isEditing) {
      this.confirmService.open({
        title: 'Delete Expense',
        message: 'Are you sure you want to delete this expense? This action cannot be undone.',
        confirmText: 'Delete',
        onConfirm: () => {
          const id = this.expenseService.editingExpense()!.id;
          this.expenseService.deleteExpense(id);
          this.close();
        }
      });
    }
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      const formValue = this.expenseForm.value;
      const expenseData = {
        title: formValue.title,
        amount: Number(formValue.amount),
        category: formValue.category,
        date: new Date(formValue.date).toISOString()
      };

      if (this.isEditing) {
        const id = this.expenseService.editingExpense()!.id;
        this.expenseService.updateExpense(id, expenseData);
      } else {
        this.expenseService.addExpense(expenseData);
      }

      this.close();
    }
  }
}
