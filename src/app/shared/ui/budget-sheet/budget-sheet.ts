import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { BudgetService } from '../../../core/services/budget.service';
import { ConfirmService } from '../../../core/services/confirm.service';

@Component({
  selector: 'app-budget-sheet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
    <ng-container *ngIf="budgetService.isBottomSheetOpen()">
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
          <h2 class="text-xl font-extrabold tracking-tight">{{ isEditing ? 'Edit budget' : 'Add budget' }}</h2>
          <div class="flex gap-2">
            <button *ngIf="isEditing" type="button" (click)="onDelete()" class="w-8 h-8 bg-red-500 flex items-center justify-center border-2 border-transparent hover:border-white transition-colors rounded-none text-white">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <div class="p-6">
          <form [formGroup]="budgetForm" (ngSubmit)="onSubmit()" class="space-y-6">
            
            <!-- Budget Name -->
            <div class="space-y-1">
              <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Goal Name</label>
              <input 
                type="text" 
                formControlName="name"
                class="w-full bg-white border-2 border-black rounded-none p-4 font-bold text-lg focus:outline-none focus:bg-gray-50 transition-colors"
                placeholder="e.g. Groceries"
              >
            </div>

            <!-- Allocated Amount -->
            <div class="space-y-1">
              <div class="flex justify-between items-end">
                <label class="block text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Allocated Amount</label>
                <span class="text-xs font-bold text-blue-600">
                  Max Available: {{ maxAllowedAmount | currency:'INR':'symbol':'1.0-0' }}
                </span>
              </div>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-extrabold text-black">₹</span>
                <input 
                  type="number" 
                  formControlName="amount"
                  (keydown)="preventE($event)"
                  class="w-full bg-white border-2 border-black rounded-none p-4 pl-12 text-3xl font-extrabold focus:outline-none focus:bg-gray-50 transition-colors"
                  placeholder="0"
                >
              </div>
            </div>

            <!-- Bottom Buttons -->
            <div class="pt-2 flex gap-2">
              <button type="button" (click)="close()"
                class="flex-1 bg-white text-black border-2 border-black rounded-none p-4 font-bold text-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button type="submit" [disabled]="budgetForm.invalid || !isAmountValid"
                class="flex-1 bg-black text-white border-2 border-black rounded-none p-4 font-bold text-lg 
                       hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white">
                {{ isEditing ? 'Update' : 'Save' }}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </ng-container>
  `
})
export class BudgetSheetComponent {
  budgetService = inject(BudgetService);
  private fb = inject(FormBuilder);
  private confirmService = inject(ConfirmService);
  
  budgetForm: FormGroup;
  maxAllowedAmount = 0;

  constructor() {
    this.budgetForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      amount: ['', [Validators.required, Validators.min(1)]],
    });

    effect(() => {
      if (this.budgetService.isBottomSheetOpen()) {
        this.setupForm();
      }
    });
  }

  get isEditing(): boolean {
    return !!this.budgetService.editingBudget();
  }

  get isAmountValid(): boolean {
    const amount = this.budgetForm.get('amount')?.value || 0;
    return amount <= this.maxAllowedAmount && amount > 0;
  }

  preventE(event: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  private setupForm() {
    const editing = this.budgetService.editingBudget();
    this.maxAllowedAmount = this.budgetService.remainingSalary() + (editing ? editing.amount : 0);

    if (editing) {
      this.budgetForm.patchValue({
        name: editing.name,
        amount: editing.amount
      });
    } else {
      this.budgetForm.reset({
        name: '',
        amount: ''
      });
    }
  }

  close() {
    this.budgetService.closeBottomSheet();
  }

  onSubmit() {
    if (this.budgetForm.invalid || !this.isAmountValid) return;

    const data = this.budgetForm.value;
    const editing = this.budgetService.editingBudget();

    if (editing) {
      this.budgetService.updateBudget(editing.id, data);
    } else {
      this.budgetService.addBudget(data);
    }
    this.close();
  }

  onDelete() {
    const editing = this.budgetService.editingBudget();
    if (!editing) return;

    this.confirmService.open({
      title: 'Delete Budget',
      message: 'Are you sure you want to delete this budget goal? Your expenses will remain but no longer track against this goal.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.budgetService.deleteBudget(editing.id);
        this.close();
      }
    });
  }
}
