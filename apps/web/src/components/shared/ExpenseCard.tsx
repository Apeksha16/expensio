'use client';

import React, { useRef, useState } from 'react';
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
  Gift
} from 'lucide-react';
import { Expense } from '../../store/finance-store';
import { motion } from 'framer-motion';

interface ExpenseCardProps {
  expense: Expense;
  onDelete: (id: string) => void;
  onEdit?: (expense: Expense) => void;
  onTap?: (expense: Expense) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectToggle?: (id: string) => void;
}

const categoryMeta: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  Food: { icon: Coffee, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  Travel: { icon: Car, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  Transport: { icon: Car, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  Entertainment: { icon: Tv, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  Shopping: { icon: ShoppingBag, color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
  Utilities: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  Income: { icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  Other: { icon: HelpCircle, color: 'text-zinc-400', bg: 'bg-zinc-800/60 border-zinc-700/60' }
};

export default function ExpenseCard({ 
  expense, 
  onDelete, 
  onEdit, 
  onTap,
  isSelectionMode = false,
  isSelected = false,
  onSelectToggle
}: ExpenseCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const meta = categoryMeta[expense.category] || { 
    icon: HelpCircle, 
    color: 'text-zinc-400', 
    bg: 'bg-zinc-800/60 border-zinc-700/60' 
  };

  const IconComponent = meta.icon;

  const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  const handleTouchStart = () => {
    if (isSelectionMode) return;
    setLongPressTriggered(false);
    timerRef.current = setTimeout(() => {
      setLongPressTriggered(true);
      if (onSelectToggle) onSelectToggle(expense.id);
    }, 800);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleCardClick = () => {
    if (longPressTriggered) return;
    if (isSelectionMode) {
      if (onSelectToggle) onSelectToggle(expense.id);
    } else {
      if (onTap) onTap(expense);
    }
  };

  const isIncome = expense.category === 'Income';

  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/20 backdrop-blur-md group select-none touch-none"
    >
      {/* Swipe background panels */}
      <div className="absolute inset-0 flex items-center justify-between px-6 z-0">
        <button
          onClick={() => onEdit && onEdit(expense)}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-500 text-zinc-950 font-bold active:scale-95 transition-transform"
          aria-label="Edit"
        >
          <Edit2 className="w-3.5 h-3.5 stroke-[3]" />
          <span className="text-[9px] uppercase font-bold tracking-wider">Edit</span>
        </button>

        <button 
          onClick={() => onDelete(expense.id)}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500 text-zinc-950 font-bold active:scale-95 transition-transform"
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5 stroke-[3]" />
          <span className="text-[9px] uppercase font-bold tracking-wider">Delete</span>
        </button>
      </div>

      {/* Foreground slidable panel */}
      <motion.div
        drag={isSelectionMode ? false : 'x'}
        dragDirectionLock
        dragConstraints={{ right: 80, left: -80 }}
        dragElastic={0.15}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        className={`relative z-10 flex items-center justify-between p-4 bg-zinc-900 border-0 cursor-pointer transition-colors duration-200 ₹{
          isSelected 
            ? 'bg-zinc-800 border-indigo-500/20' 
            : 'hover:bg-zinc-800'
        }`}
      >
        <div className="flex items-center gap-3.5">
          {/* Checkbox triggers when in selection mode */}
          {isSelectionMode && (
            <div className="text-indigo-400 animate-fade-in shrink-0">
              {isSelected ? (
                <CheckCircle2 className="w-5 h-5 fill-indigo-400 text-zinc-950 stroke-[2.5]" />
              ) : (
                <Circle className="w-5 h-5 text-zinc-600 stroke-[2.5]" />
              )}
            </div>
          )}

          {/* Category Icon */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ₹{meta.bg}`}>
            <IconComponent className={`w-5 h-5 ₹{meta.color}`} />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
              {expense.title}
            </span>
            
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-zinc-500">{formattedDate}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700" />
              <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-800/40">
                {expense.category}
              </span>
            </div>
          </div>
        </div>

        {/* Amount & split info (matches green/red positive/negative color tags!) */}
        <div className="flex flex-col items-end gap-1">
          <span className={`text-sm font-black ₹{isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isIncome ? `+₹₹{expense.amount.toFixed(2)}` : `-₹₹{expense.amount.toFixed(2)}`}
          </span>

          {expense.splitWith && expense.splitWith.length > 0 ? (
            <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-semibold bg-zinc-800/30 px-1.5 py-0.5 rounded-full border border-zinc-800/20">
              <Share2 className="w-2.5 h-2.5 text-indigo-400" />
              <span>Split w/ {expense.splitWith[0].split(' ')[0]}{expense.splitWith.length > 1 ? ` +₹{expense.splitWith.length - 1}` : ''}</span>
            </div>
          ) : (
            <span className="text-[8px] font-black tracking-wider uppercase text-zinc-600">Personal</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
