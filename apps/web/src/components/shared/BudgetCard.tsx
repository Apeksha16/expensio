'use client';

import React from 'react';
import { Budget, useFinanceStore } from '../../store/finance-store';
import { Coffee, ShoppingBag, Car, Tv, Zap, HelpCircle, Star, Trash2, Edit2 } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  onDelete: (id: string) => void;
  onEdit?: (budget: Budget) => void;
}

const categoryMeta: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> =
  {
    Food: {
      icon: Coffee,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    Shopping: {
      icon: ShoppingBag,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
    Transport: { icon: Car, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    Entertainment: {
      icon: Tv,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    Utilities: { icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  };

export default function BudgetCard({ budget, onDelete, onEdit }: BudgetCardProps) {
  const { expenses } = useFinanceStore();

  // Dynamically calculate spent amount for this budget's category (only paid by me)
  const spent = expenses
    .filter((e) => e.category === budget.category && e.paidBy === 'me')
    .reduce((sum, e) => sum + e.amount, 0);

  const percent = budget.limitAmount > 0 ? Math.round((spent / budget.limitAmount) * 100) : 0;

  const isExceeded = spent > budget.limitAmount;
  const isWarning = spent > budget.limitAmount * 0.75 && spent <= budget.limitAmount;

  const meta = categoryMeta[budget.category] || {
    icon: HelpCircle,
    color: 'text-zinc-400',
    bg: 'bg-zinc-800/60 border-zinc-700/60',
  };

  const IconComponent = meta.icon;

  return null;
}
