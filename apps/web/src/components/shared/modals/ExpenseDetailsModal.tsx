'use client';

import React from 'react';
import BottomSheet from '../BottomSheet';
import { Button } from '@expensio/ui';

interface ExpenseDetailsModalProps {
  expense: any | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export default function ExpenseDetailsModal({
  expense,
  onClose,
  onDelete,
  isDeleting = false,
}: ExpenseDetailsModalProps) {
  if (!expense) return null;

  return (
    <BottomSheet isOpen={expense !== null} onClose={onClose} title="Expense Details">
      <div className="space-y-6 select-none">
        <div className="p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between shadow-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest leading-none">
              Total Value
            </span>
            <span className="text-3xl font-black text-theme-text mt-1.5 leading-none">
              ₹{expense.amount.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full shrink-0">
            {expense.category}
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/20 p-4 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/60 dark:border-zinc-800/60 text-xs">
            <span className="font-semibold text-zinc-400 dark:text-zinc-500">Merchant Name</span>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">
              {expense.title}
            </span>
          </div>
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/60 dark:border-zinc-800/60 text-xs">
            <span className="font-semibold text-zinc-400 dark:text-zinc-500">Date</span>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
              {new Date(expense.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/60 dark:border-zinc-800/60 text-xs">
            <span className="font-semibold text-zinc-400 dark:text-zinc-500">Payment Method</span>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
              {expense.paymentMethod || 'UPI / Cash'}
            </span>
          </div>
          {expense.note && (
            <div className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-zinc-400 dark:text-zinc-500">Notes</span>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold leading-relaxed border border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 px-3 py-2 rounded-xl">
                {expense.note}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {expense.isOffline ? (
            <div className="col-span-2 text-center py-2">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                Action unavailable for offline records until synced
              </span>
            </div>
          ) : (
            <Button
              variant="danger"
              fullWidth
              isLoading={isDeleting}
              loadingText="Deleting..."
              onClick={() => onDelete(expense.id)}
            >
              Delete Expense
            </Button>
          )}
          <Button
            variant="secondary"
            fullWidth
            className={expense.isOffline ? 'col-span-2' : ''}
            onClick={onClose}
          >
            Close Details
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
