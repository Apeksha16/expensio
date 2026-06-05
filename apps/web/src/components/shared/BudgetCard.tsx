'use client';

import React from 'react';
import { Budget, useFinanceStore } from '../../store/finance-store';
import {
  Coffee,
  ShoppingBag,
  Car,
  Tv,
  Zap,
  HelpCircle,
  Trash2,
  Edit2,
  UtensilsCrossed,
  Heart,
  TrendingUp,
  GraduationCap,
  CreditCard,
  Handshake,
  Home,
  Plane,
  Gift,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface BudgetCardProps {
  budget: Budget;
  onDelete: (id: string) => void;
  onEdit?: (budget: Budget) => void;
  selectedDate: Date;
}

const categoryMeta: Record<
  string,
  { icon: React.ComponentType<any>; color: string; bg: string; border: string }
> = {
  Food: {
    icon: UtensilsCrossed,
    color: 'text-indigo-650 dark:text-indigo-400',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    border: 'border-indigo-500/20 dark:border-indigo-500/25',
  },
  Shopping: {
    icon: ShoppingBag,
    color: 'text-pink-650 dark:text-pink-400',
    bg: 'bg-pink-500/10 dark:bg-pink-500/15',
    border: 'border-pink-500/20 dark:border-pink-500/25',
  },
  'Bills & Utilities': {
    icon: Zap,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/20 dark:border-rose-500/25',
  },
  Health: {
    icon: Heart,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    border: 'border-cyan-500/20 dark:border-cyan-500/25',
  },
  Investments: {
    icon: TrendingUp,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/20 dark:border-emerald-500/25',
  },
  Entertainment: {
    icon: Tv,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    border: 'border-indigo-500/20 dark:border-indigo-500/25',
  },
  Education: {
    icon: GraduationCap,
    color: 'text-yellow-600 dark:text-yellow-500',
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/15',
    border: 'border-yellow-500/20 dark:border-yellow-500/25',
  },
  Transport: {
    icon: Car,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-500/20 dark:border-amber-500/25',
  },
  'Credit Card': {
    icon: CreditCard,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/20 dark:border-rose-500/25',
  },
  Udhaari: {
    icon: Handshake,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    border: 'border-purple-500/20 dark:border-purple-500/25',
  },
  Rent: {
    icon: Home,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    border: 'border-blue-500/20 dark:border-blue-500/25',
  },
  Travel: {
    icon: Plane,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/15',
    border: 'border-cyan-500/20 dark:border-cyan-500/25',
  },
  Gifts: {
    icon: Gift,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-500/10 dark:bg-pink-500/15',
    border: 'border-pink-500/20 dark:border-pink-500/25',
  },
  Others: {
    icon: HelpCircle,
    color: 'text-zinc-550 dark:text-zinc-400',
    bg: 'bg-zinc-800/40 dark:bg-zinc-800/50',
    border: 'border-zinc-800/40 dark:border-zinc-800/50',
  },
  // Legacy / Store Compatibility fallback
  Utilities: {
    icon: Zap,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-500/20 dark:border-emerald-500/25',
  },
  Bills: {
    icon: CreditCard,
    color: 'text-rose-600 dark:text-rose-455',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-500/20 dark:border-rose-500/25',
  },
};

const categoryBarColors: Record<string, string> = {
  Food: 'bg-indigo-500 dark:bg-indigo-400',
  Shopping: 'bg-pink-500 dark:bg-pink-400',
  'Bills & Utilities': 'bg-rose-500 dark:bg-rose-400',
  Health: 'bg-cyan-500 dark:bg-cyan-400',
  Investments: 'bg-emerald-500 dark:bg-emerald-400',
  Entertainment: 'bg-indigo-500 dark:bg-indigo-400',
  Education: 'bg-yellow-500 dark:bg-yellow-400',
  Transport: 'bg-amber-500 dark:bg-amber-400',
  'Credit Card': 'bg-rose-500 dark:bg-rose-400',
  Udhaari: 'bg-purple-500 dark:bg-purple-400',
  Rent: 'bg-blue-500 dark:bg-blue-400',
  Travel: 'bg-cyan-500 dark:bg-cyan-400',
  Gifts: 'bg-pink-500 dark:bg-pink-400',
  Others: 'bg-zinc-500 dark:bg-zinc-400',
  Utilities: 'bg-emerald-500 dark:bg-emerald-400',
  Bills: 'bg-rose-500 dark:bg-rose-400',
};

export default function BudgetCard({ budget, onDelete, onEdit, selectedDate }: BudgetCardProps) {
  const { expenses } = useFinanceStore();

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

  // Dynamically calculate spent amount for this budget's category (only paid by me) in the selected month/year
  const spent = expenses
    .filter((e) => {
      if (e.category !== budget.category || e.paidBy !== 'me') return false;
      if (!e.date) return false;
      const parts = e.date.split('-');
      if (parts.length < 2) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      return y === selectedYear && m === selectedMonth;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const percent = budget.limitAmount > 0 ? Math.round((spent / budget.limitAmount) * 100) : 0;

  const isExceeded = spent > budget.limitAmount;
  const isWarning = spent > budget.limitAmount * 0.75 && spent <= budget.limitAmount;

  const meta = categoryMeta[budget.category] || {
    icon: HelpCircle,
    color: 'text-zinc-550 dark:text-zinc-400',
    bg: 'bg-zinc-800/40 dark:bg-zinc-800/50',
    border: 'border-zinc-800/40 dark:border-zinc-800/50',
  };

  const barColor = categoryBarColors[budget.category] || 'bg-zinc-500 dark:bg-zinc-450';
  const IconComponent = meta.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="p-4 rounded-3xl bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:border-zinc-200/80 dark:hover:border-zinc-750/80 transition-all duration-300 flex gap-4 relative group"
    >
      {/* Squircle Category Icon with background gradient & glow */}
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.border} border transition-transform duration-300 group-hover:scale-105`}
      >
        <IconComponent className={`w-5.5 h-5.5 ${meta.color}`} />
      </div>

      {/* Main Details Area */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        {/* Row 1: Title & Status (stacked) + Quick Actions on the right */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5 min-w-0">
            <h4 className="text-xs font-black text-theme-text uppercase tracking-wider truncate">
              {budget.category}
            </h4>
            <div className="flex select-none">
              {isExceeded ? (
                <span className="text-[8.5px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1 shrink-0 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Over Limit
                </span>
              ) : isWarning ? (
                <span className="text-[8.5px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 shrink-0 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Caution
                </span>
              ) : (
                <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1 shrink-0 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  On Track
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions (Elegant action buttons) */}
          <div className="flex items-center gap-1.5 select-none shrink-0 pt-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(budget)}
                className="p-1.5 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-800 border border-zinc-100 dark:border-zinc-850 text-theme-secondary hover:text-theme-text active:scale-90 transition-all cursor-pointer flex items-center justify-center shrink-0 outline-none"
                aria-label="Edit Budget"
              >
                <Edit2 className="w-2.5 h-2.5 transition-colors duration-150" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(budget.id)}
              className="p-1.5 rounded-lg bg-zinc-50 hover:bg-rose-50 dark:bg-zinc-950 dark:hover:bg-rose-955 border border-zinc-100 dark:border-zinc-855 hover:border-rose-100 dark:hover:border-rose-900/30 text-zinc-400 hover:text-rose-500 active:scale-90 transition-all cursor-pointer flex items-center justify-center shrink-0 outline-none"
              aria-label="Delete Budget"
            >
              <Trash2 className="w-2.5 h-2.5 transition-colors duration-150" />
            </button>
          </div>
        </div>

        {/* Row 2: Spent of Limit & Amount Left */}
        <div className="flex items-center justify-between text-[10px] font-bold text-theme-secondary leading-none">
          <div>
            <span className="text-theme-text font-extrabold text-[11px]">
              ₹{spent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[9px] text-theme-secondary/80 font-semibold">
              {' '}
              of ₹{budget.limitAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} limit
            </span>
          </div>
          <span
            className={`font-black text-[9px] uppercase tracking-wider ${isExceeded ? 'text-rose-500' : 'text-theme-text'}`}
          >
            {isExceeded
              ? `₹${Math.round(spent - budget.limitAmount).toLocaleString('en-IN')} over`
              : `₹${Math.round(budget.limitAmount - spent).toLocaleString('en-IN')} left`}
          </span>
        </div>

        {/* Row 3: Progress Bar & Percentage */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-950/20 rounded-full overflow-hidden p-[0.5px] border border-zinc-200/20 dark:border-zinc-850">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, percent)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                isExceeded
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600'
                  : isWarning
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                    : barColor
              }`}
            />
          </div>
          <span className="text-[10px] font-black text-theme-text shrink-0 leading-none min-w-[28px] text-right">
            {percent}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
