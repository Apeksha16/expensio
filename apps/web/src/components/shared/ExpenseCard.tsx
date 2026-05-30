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
  Briefcase
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
}

const categoryMeta: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  Food: { icon: Coffee, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
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
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

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
    <div className="relative overflow-hidden group select-none transition-colors duration-200">
      
      {/* 1. Main Static Card Layout (Clean list row style, fully transparent background by default) */}
      <div
        onClick={handleCardClick}
        className={`relative z-10 flex items-center justify-between py-3.5 px-1 bg-transparent cursor-pointer transition-colors duration-200 ${
          isSelected 
            ? 'bg-zinc-800/20' 
            : 'hover:bg-zinc-900/30'
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

          {/* Category Icon backing: simple borderless rounded squircle */}
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg.split(' ')[0]} shrink-0`}>
            <IconComponent className={`w-4.5 h-4.5 ${meta.color}`} />
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-extrabold text-zinc-150 group-hover:text-cyan-400 transition-colors tracking-tight">
              {expense.title.replace(/\p{Extended_Pictographic}/gu, '').trim()}
            </span>
            
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-550 font-bold">
              <span>{formattedDate}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-800" />
              <span>{expense.category}</span>
            </div>
          </div>
        </div>

        {/* Amount & split info (matches green/red positive/negative color tags!) */}
        <div className="flex flex-col items-end gap-1.5 group-hover:opacity-20 transition-opacity duration-200">
          <span className={`text-xs font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isIncome ? `+₹${expense.amount.toFixed(2)}` : `-₹${expense.amount.toFixed(2)}`}
          </span>

          {expense.splitWith && expense.splitWith.length > 0 && (
            <div className="flex items-center gap-1 text-[8px] text-indigo-400 font-extrabold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 shrink-0">
              <Share2 className="w-2.5 h-2.5 text-indigo-400" />
              <span>Split w/ {expense.splitWith[0].split(' ')[0]}{expense.splitWith.length > 1 ? ` +${expense.splitWith.length - 1}` : ''}</span>
            </div>
          )}
        </div>

        {!isSelectionMode && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-4 top-1/2 -translate-y-1/2 z-20">
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
              className="p-2 rounded-xl bg-zinc-950/90 border border-zinc-800 hover:bg-rose-500/15 hover:border-rose-500/30 text-zinc-400 hover:text-rose-450 transition-all cursor-pointer shadow-lg outline-none"
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

      {/* 3. Micro-Modal Inline Delete Confirmation Overlay */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md z-30 rounded-2xl flex items-center justify-between px-5 py-3 border border-rose-500/20"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider">Delete transaction?</span>
              <span className="text-[10px] text-zinc-400 font-semibold truncate max-w-44">{expense.title.replace(/\p{Extended_Pictographic}/gu, '').trim()}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirmDelete(false);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-zinc-800 text-zinc-450 hover:text-zinc-200 text-[10px] font-black uppercase active:scale-95 transition-all cursor-pointer bg-zinc-900/60"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConfirm();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 text-zinc-950 text-[10px] font-black uppercase active:scale-95 transition-all cursor-pointer shadow-md shadow-rose-500/10 hover:bg-rose-400"
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
