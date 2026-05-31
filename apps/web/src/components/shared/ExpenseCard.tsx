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

const categoryMeta: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> =
  {
    Food: { icon: Coffee, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
    Travel: { icon: Car, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    Transport: { icon: Car, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    Entertainment: {
      icon: Tv,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    Shopping: {
      icon: ShoppingBag,
      color: 'text-pink-400',
      bg: 'bg-pink-500/10 border-pink-500/20',
    },
    Utilities: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    Income: {
      icon: Briefcase,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    Other: { icon: HelpCircle, color: 'text-zinc-400', bg: 'bg-zinc-800/60 border-zinc-700/60' },
  };

export default function ExpenseCard({
  expense,
  onDelete,
  onEdit,
  onTap,
  isSelectionMode = false,
  isSelected = false,
  onSelectToggle,
}: ExpenseCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const meta = categoryMeta[expense.category] || {
    icon: HelpCircle,
    color: 'text-zinc-400',
    bg: 'bg-zinc-800/60 border-zinc-700/60',
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

  return null;
}
