'use client';

import React from 'react';
import { Budget, useFinanceStore } from '../../store/finance-store';
import { Coffee, ShoppingBag, Car, Tv, Zap, HelpCircle, Star, Trash2, Edit2 } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  onDelete: (id: string) => void;
  onEdit?: (budget: Budget) => void;
}

const categoryMeta: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  Food: { icon: Coffee, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  Shopping: { icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  Transport: { icon: Car, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  Entertainment: { icon: Tv, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  Utilities: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

export default function BudgetCard({ budget, onDelete, onEdit }: BudgetCardProps) {
  const { expenses } = useFinanceStore();

  // Dynamically calculate spent amount for this budget's category (only paid by me)
  const spent = expenses
    .filter((e) => e.category === budget.category && e.paidBy === 'me')
    .reduce((sum, e) => sum + e.amount, 0);

  const percent = budget.limitAmount > 0 
    ? Math.round((spent / budget.limitAmount) * 100)
    : 0;

  const isExceeded = spent > budget.limitAmount;
  const isWarning = spent > budget.limitAmount * 0.75 && spent <= budget.limitAmount;

  const meta = categoryMeta[budget.category] || { 
    icon: HelpCircle, 
    color: 'text-zinc-400', 
    bg: 'bg-zinc-800/60 border-zinc-700/60' 
  };

  const IconComponent = meta.icon;

  return (
    <div
      onClick={() => onEdit && onEdit(budget)}
      className={`p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl relative overflow-hidden group flex flex-col gap-3 ${
        onEdit
          ? 'cursor-pointer hover:border-zinc-700/80 active:scale-[0.99] transition-all duration-200'
          : ''
      }`}
    >
      
      {/* Category header row */}
      <div className="flex items-center justify-between">
        
        {/* Left side squircle category and details */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${meta.bg}`}>
            <IconComponent className={`w-5 h-5 ${meta.color}`} />
          </div>

          <div className="flex flex-col">
            <h4 className="text-xs font-black text-zinc-100">{budget.category}</h4>
            <div className="flex items-baseline gap-1 text-[10px] text-zinc-500 font-semibold mt-0.5">
              <span className="text-zinc-300 font-extrabold">${spent.toFixed(2)}</span>
              <span>of ${budget.limitAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right side safety badges and delete action */}
        <div className="flex items-center gap-2">
          {/* Mockup Good safety badge */}
          {!isExceeded && !isWarning && (
            <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              <Star className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
              <span>Good</span>
            </span>
          )}
          {isWarning && (
            <span className="text-[8px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
              Warning
            </span>
          )}
          {isExceeded && (
            <span className="text-[8px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20">
              Over Limit
            </span>
          )}

          {/* Edit button */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(budget);
              }}
              className="p-1.5 rounded-lg bg-zinc-950/40 border border-zinc-800 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
              aria-label="Edit Budget"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(budget.id);
            }}
            className="p-1.5 rounded-lg bg-zinc-950/40 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0"
            aria-label="Delete Budget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Progress slider bar matching mockup list view exactly! */}
      <div className="space-y-1.5">
        <div className="h-1.5 w-full bg-zinc-950 rounded-full p-[1px] border border-zinc-850 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isExceeded 
                ? 'bg-rose-500' 
                : isWarning 
                ? 'bg-amber-500' 
                : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-zinc-500">
          <span>{percent}% allocated</span>
          {isExceeded ? (
            <span className="text-rose-400 font-extrabold">Over by ${(spent - budget.limitAmount).toFixed(2)}</span>
          ) : (
            <span>${(budget.limitAmount - spent).toFixed(2)} remaining</span>
          )}
        </div>
      </div>

    </div>
  );
}
