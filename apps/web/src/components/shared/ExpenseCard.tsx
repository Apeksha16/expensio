'use client';

import React, { useState } from 'react';
import {
  Coffee,
  Car,
  Tv,
  ShoppingBag,
  Zap,
  HelpCircle,
  Trash2,
  Share2,
  Edit2,
  CheckCircle2,
  Circle,
  Briefcase,
  Calendar,
  ChevronRight,
  Heart,
  GraduationCap,
  CreditCard,
  UtensilsCrossed,
  TrendingUp,
  Handshake,
  Home,
  Plane,
  Gift,
} from 'lucide-react';
import { Expense } from '../../store/finance-store';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpenseCardProps {
  expense: Expense;
  onDelete: (id: string) => void;
  onEdit?: (expense: Expense) => void;
  onTap?: (expense: Expense) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectToggle?: (id: string) => void;
  timelineMode?: boolean;
}

const categoryMeta: Record<
  string,
  { icon: React.ComponentType<any>; color: string; bg: string; accentBg: string }
> = {
  Food: {
    icon: UtensilsCrossed,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/15',
    accentBg: 'bg-indigo-500',
  },
  Shopping: {
    icon: ShoppingBag,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/15',
    accentBg: 'bg-pink-500',
  },
  Transport: {
    icon: Car,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10 border-amber-500/15',
    accentBg: 'bg-amber-500',
  },
  Entertainment: {
    icon: Tv,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/15',
    accentBg: 'bg-indigo-500',
  },
  'Bills & Utilities': {
    icon: Zap,
    color: 'text-rose-450',
    bg: 'bg-rose-500/10 border-rose-500/15',
    accentBg: 'bg-rose-500',
  },
  Bills: {
    icon: CreditCard,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10 border-rose-500/15',
    accentBg: 'bg-rose-500',
  },
  Utilities: {
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/15',
    accentBg: 'bg-amber-500',
  },
  Health: {
    icon: Heart,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/15',
    accentBg: 'bg-cyan-500',
  },
  Education: {
    icon: GraduationCap,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/15',
    accentBg: 'bg-yellow-500',
  },
  Investments: {
    icon: TrendingUp,
    color: 'text-emerald-450',
    bg: 'bg-emerald-500/10 border-emerald-500/15',
    accentBg: 'bg-emerald-500',
  },
  'Credit Card': {
    icon: CreditCard,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/15',
    accentBg: 'bg-rose-500',
  },
  Udhaari: {
    icon: Handshake,
    color: 'text-purple-405',
    bg: 'bg-purple-500/10 border-purple-500/15',
    accentBg: 'bg-purple-500',
  },
  Rent: {
    icon: Home,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/15',
    accentBg: 'bg-blue-500',
  },
  Travel: {
    icon: Plane,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/15',
    accentBg: 'bg-cyan-500',
  },
  Gifts: {
    icon: Gift,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10 border-pink-500/15',
    accentBg: 'bg-pink-500',
  },
  Income: {
    icon: Briefcase,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/15',
    accentBg: 'bg-emerald-500',
  },
  Others: {
    icon: HelpCircle,
    color: 'text-zinc-400',
    bg: 'bg-zinc-800/60 border-zinc-700/60',
    accentBg: 'bg-zinc-500',
  },
  Other: {
    icon: HelpCircle,
    color: 'text-zinc-400',
    bg: 'bg-zinc-800/60 border-zinc-700/60',
    accentBg: 'bg-zinc-500',
  },
};

export default function ExpenseCard({
  expense,
  onDelete,
  onEdit,
  onTap,
  isSelectionMode = false,
  isSelected = false,
  onSelectToggle,
  timelineMode = false,
}: ExpenseCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const meta = categoryMeta[expense.category] || {
    icon: HelpCircle,
    color: 'text-zinc-400',
    bg: 'bg-zinc-800/60 border-zinc-700/60',
    accentBg: 'bg-zinc-500',
  };

  const IconComponent = meta.icon;

  const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const handleCardClick = () => {
    if (isSelectionMode) {
      if (onSelectToggle) onSelectToggle(expense.id);
    } else {
      if (onTap) onTap(expense);
    }
  };

  const handleDeleteConfirm = () => {
    onDelete(expense.id);
    setShowConfirmDelete(false);
  };

  const isIncome = expense.category === 'Income';

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-white/[0.04] bg-[#0c0d12]/30 shadow-[0_4px_16px_rgba(0,0,0,0.1)] active:scale-[0.99] transition-all duration-200 group select-none card-clean ${
        isSelected ? 'ring-2 ring-indigo-500/35 bg-white/[0.02]' : 'hover:border-white/[0.08]'
      }`}
    >
      {/* Colorful Category Accent Left Boundary */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${meta.accentBg} rounded-l-[20px] z-20`}
      />

      {/* Main Card Content */}
      <div
        onClick={handleCardClick}
        className="relative z-10 flex items-center justify-between p-3.5 pl-4 cursor-pointer min-w-0"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {/* Selection Checkbox */}
          {isSelectionMode && (
            <div className="text-indigo-400 animate-fade-in shrink-0 mr-0.5">
              {isSelected ? (
                <CheckCircle2 className="w-4.5 h-4.5 fill-indigo-400 text-zinc-950 stroke-[2.5]" />
              ) : (
                <Circle className="w-4.5 h-4.5 text-zinc-650 stroke-[2.5]" />
              )}
            </div>
          )}

          {/* Squircle Category Icon Container */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg} border shrink-0`}
          >
            <IconComponent className={`w-4.5 h-4.5 ${meta.color}`} />
          </div>

          {/* Text Information block */}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span
                className={`text-xs font-bold text-theme-text tracking-tight group-hover:text-cyan-400 transition-colors leading-none truncate ${
                  timelineMode ? 'max-w-[75px] sm:max-w-none' : ''
                }`}
              >
                {expense.title.replace(/\p{Extended_Pictographic}/gu, '').trim()}
              </span>
              {timelineMode && (
                <div
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full ${meta.bg} text-[7.5px] font-black uppercase tracking-wider shrink-0 leading-none`}
                >
                  <span>{expense.category}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-550 font-semibold mt-1 min-w-0">
              {!timelineMode && (
                <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <Calendar className="w-3 h-3 text-zinc-600 shrink-0" />
                  <span>{formattedDate}</span>
                </div>
              )}
              {!timelineMode && (
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${meta.bg} text-[9px] font-black uppercase tracking-wider shrink-0`}
                >
                  <span>{expense.category}</span>
                </div>
              )}
              {expense.splitWith && expense.splitWith.length > 0 && (
                <div className="flex items-center gap-1 text-[7.5px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 max-w-[120px] shrink-0">
                  <Share2 className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                  <span className="truncate">
                    Split w/ {expense.splitWith[0].split(' ')[0]}
                    {expense.splitWith.length > 1 ? ` +${expense.splitWith.length - 1}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Amount and Chevron Indicators */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1.5 group-hover:opacity-0 transition-opacity duration-200">
          <div className="flex flex-col items-end gap-1">
            <div
              className={`px-1.5 py-0.75 rounded-full text-[10px] sm:text-[11px] font-bold border ${
                isIncome
                  ? 'bg-emerald-500/8 border-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/8 border-rose-500/15 text-rose-400'
              }`}
            >
              {isIncome
                ? `+₹${expense.amount % 1 === 0 ? expense.amount.toLocaleString('en-IN') : expense.amount.toFixed(2)}`
                : `-₹${expense.amount % 1 === 0 ? expense.amount.toLocaleString('en-IN') : expense.amount.toFixed(2)}`}
            </div>
          </div>

          <div className="w-5 h-5 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center shrink-0">
            <ChevronRight className="w-3 h-3 text-zinc-550" />
          </div>
        </div>

        {/* Hover Action Buttons */}
        {!isSelectionMode && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-3.5 top-1/2 -translate-y-1/2 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit && onEdit(expense);
              }}
              className="p-2 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:bg-indigo-500/15 hover:border-indigo-500/30 text-zinc-400 hover:text-cyan-400 transition-all cursor-pointer shadow-lg outline-none"
              title="Edit"
            >
              <motion.div
                whileTap={{ scale: 0.65, rotate: -15 }}
                transition={{ type: 'spring', stiffness: 500, damping: 10 }}
              >
                <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </motion.div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowConfirmDelete(true);
              }}
              className="p-2 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:bg-rose-500/15 hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 transition-all cursor-pointer shadow-lg outline-none"
              title="Delete"
            >
              <motion.div
                whileTap={{ scale: 0.65, rotate: 15 }}
                transition={{ type: 'spring', stiffness: 500, damping: 10 }}
              >
                <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
              </motion.div>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 bg-white/95 dark:bg-zinc-955/95 border border-rose-500/20 backdrop-blur-sm z-30 rounded-[20px] flex items-center justify-between px-5 py-3 shadow-md"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest leading-none">
                Delete transaction?
              </span>
              <span className="text-xs text-zinc-100 font-bold truncate max-w-36 mt-1 leading-none">
                {expense.title.replace(/\p{Extended_Pictographic}/gu, '').trim()}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDelete(false);
                }}
                className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-[9px] font-black uppercase active:scale-95 transition-all cursor-pointer bg-zinc-50 dark:bg-zinc-900/60"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConfirm();
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-[9px] font-black uppercase active:scale-95 transition-all cursor-pointer shadow-md shadow-rose-500/10 hover:bg-rose-600"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
