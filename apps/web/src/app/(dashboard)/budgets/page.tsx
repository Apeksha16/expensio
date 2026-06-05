'use client';

import React, { useState } from 'react';
import { Budget, useFinanceStore } from '../../../store/finance-store';
import BudgetCard from '../../../components/shared/BudgetCard';
import BottomSheet from '../../../components/shared/BottomSheet';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  PieChart,
  Trash2,
  UtensilsCrossed,
  ShoppingBag,
  Zap,
  Heart,
  TrendingUp,
  Tv,
  GraduationCap,
  Car,
  CreditCard,
  Handshake,
  Home,
  Plane,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BudgetsPage() {
  const {
    budgets,
    addBudget,
    editBudget,
    deleteBudget,
    expenses,
    isAddBudgetOpen,
    setIsAddBudgetOpen,
  } = useFinanceStore();
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  // Form State
  const [category, setCategory] = useState('Food');
  const [limitAmount, setLimitAmount] = useState('');
  const [editLimitAmount, setEditLimitAmount] = useState('');

  // Date State for Month Selector (default to May 2026)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1));

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();

  // Filter expenses for this specific month/year
  const filteredExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const parts = e.date.split('-');
    if (parts.length < 2) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    return y === selectedYear && m === selectedMonth;
  });

  // Dynamically calculate total budget limit from all active budgets
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);

  // Dynamically calculate total spent in all categories that have a budget in the selected month
  const budgetCategories = budgets.map((b) => b.category);
  const totalSpent = filteredExpenses
    .filter((e) => budgetCategories.includes(e.category) && e.paidBy === 'me')
    .reduce((sum, e) => sum + e.amount, 0);

  const budgetUsagePercent =
    totalBudgetLimit > 0 ? Math.round((totalSpent / totalBudgetLimit) * 100) : 0;

  const categories = [
    { name: 'Food', icon: UtensilsCrossed },
    { name: 'Shopping', icon: ShoppingBag },
    { name: 'Bills & Utilities', icon: Zap },
    { name: 'Health', icon: Heart },
    { name: 'Investments', icon: TrendingUp },
    { name: 'Entertainment', icon: Tv },
    { name: 'Education', icon: GraduationCap },
    { name: 'Transport', icon: Car },
    { name: 'Credit Card', icon: CreditCard },
    { name: 'Udhaari', icon: Handshake },
    { name: 'Rent', icon: Home },
    { name: 'Travel', icon: Plane },
    { name: 'Gifts', icon: Gift },
    { name: 'Others', icon: HelpCircle },
  ];

  // Filter out categories that already have a budget
  const availableCategories = categories.filter(
    (cat) => !budgets.some((b) => b.category === cat.name)
  );

  const handleOpenAddBudget = () => {
    if (availableCategories.length > 0) {
      setCategory(availableCategories[0].name);
    }
    setIsAddBudgetOpen(true);
  };

  const handleEditBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget || !editLimitAmount || isNaN(Number(editLimitAmount))) return;

    editBudget(editingBudget.id, {
      limitAmount: Number(editLimitAmount),
    });

    setEditLimitAmount('');
    setEditingBudget(null);
  };

  const handleAddBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitAmount || isNaN(Number(limitAmount))) return;

    // Double check if budget for category already exists
    const categoryExists = budgets.some((b: Budget) => b.category === category);
    if (categoryExists) return;

    addBudget({
      category,
      limitAmount: Number(limitAmount),
    });

    setLimitAmount('');
    setIsAddBudgetOpen(false);
  };

  return (
    <div className="space-y-6 pb-6 select-none relative">
      {/* Header & Sub-header */}
      <div className="flex flex-col gap-0.5 px-1">
        <h2 className="text-xl font-extrabold tracking-tight text-theme-text">Budgets</h2>
        <p className="text-[10.5px] text-zinc-550 font-bold uppercase tracking-wider">
          Manage your budget limits and track progress
        </p>
      </div>

      {/* Dynamic Overall Progress Box (Themed exactly like expenses overview cards) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="p-4.5 rounded-[26px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 shadow-xs relative overflow-hidden space-y-5"
      >
        {/* Card Header row with Month navigation */}
        <div className="flex items-center justify-between z-10 relative">
          <span className="text-[9.5px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-widest leading-none">
            Overall Progress
          </span>
          <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-850 rounded-xl p-0.5 z-10 shrink-0 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-zinc-450 hover:text-theme-text active:scale-90 transition-all bg-transparent border-0 cursor-pointer flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-100 px-2 leading-none min-w-[70px] text-center select-none">
              {currentDate
                .toLocaleString('en-US', { month: 'short', year: 'numeric' })
                .toUpperCase()}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 text-zinc-450 hover:text-theme-text active:scale-90 transition-all bg-transparent border-0 cursor-pointer flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850"
              aria-label="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Arc and Spent vs Limit */}
        <div className="flex items-center gap-6 z-10 relative">
          {/* Circular progress SVG */}
          <div className="relative w-22 h-22 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              {/* background track */}
              <circle
                cx="44"
                cy="44"
                r="35"
                className="stroke-zinc-100 dark:stroke-zinc-850 fill-transparent"
                strokeWidth="5"
              />
              {/* filled track */}
              <motion.circle
                cx="44"
                cy="44"
                r="35"
                className="stroke-indigo-500 dark:stroke-indigo-400 fill-transparent"
                strokeWidth="5.5"
                strokeDasharray={2 * Math.PI * 35}
                initial={{ strokeDashoffset: 2 * Math.PI * 35 }}
                animate={{
                  strokeDashoffset:
                    2 * Math.PI * 35 * (1 - Math.min(100, budgetUsagePercent) / 100),
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none leading-none">
              <span className="text-base font-black tracking-tight text-zinc-100">
                {budgetUsagePercent}%
              </span>
              <span className="text-[7.5px] font-black uppercase text-theme-secondary mt-0.5 tracking-wider">
                of total
              </span>
            </div>
          </div>

          {/* Text Metrics */}
          <div className="flex-grow min-w-0 flex flex-col justify-center gap-1">
            <span className="text-[9.5px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest leading-none">
              Spent This Month
            </span>
            <span className="text-2.5xl font-black tracking-tight text-zinc-100 leading-none my-0.5">
              ₹
              {totalSpent.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-[10px] font-semibold text-theme-secondary leading-none">
              of ₹
              {totalBudgetLimit.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              limit
            </span>
          </div>
        </div>

        {/* Horizontal progress bar */}
        <div className="space-y-1.5 z-10 relative pt-1">
          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden p-[0.5px] border border-zinc-200/20 dark:border-zinc-850">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400"
            />
          </div>
        </div>
      </motion.div>

      {/* Category header trigger */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-theme-text">
          Your Categories
        </h3>
        <button
          onClick={handleOpenAddBudget}
          className="flex items-center justify-center w-9 h-9 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-750 font-bold active:scale-95 transition-all cursor-pointer shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 border border-indigo-500/20 group duration-300"
          aria-label="Add Budget"
        >
          <Plus className="w-5 h-5 stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
        </button>
      </div>

      {/* Dynamic Grid of Budget cards */}
      <div className="space-y-4 px-1">
        {budgets.length === 0 ? (
          <div className="p-12 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-550 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-805 flex items-center justify-center text-zinc-400 dark:text-zinc-550">
              <PieChart className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-theme-text">No active budgets</p>
              <p className="text-xs text-theme-secondary max-w-[240px] leading-relaxed">
                Tap the '+' button above to set spending limits for your categories.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <AnimatePresence mode="popLayout">
              {budgets.map((budget: Budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  selectedDate={currentDate}
                  onDelete={(id) => {
                    const toDelete = budgets.find((b) => b.id === id);
                    if (toDelete) {
                      setDeletingBudget(toDelete);
                    }
                  }}
                  onEdit={(b) => {
                    setEditingBudget(b);
                    setEditLimitAmount(b.limitAmount.toString());
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Budget bottom sheet */}
      <BottomSheet
        isOpen={isAddBudgetOpen}
        onClose={() => setIsAddBudgetOpen(false)}
        title="Create Budget"
      >
        {availableCategories.length === 0 ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-850 flex items-center justify-center mx-auto text-zinc-400 dark:text-zinc-550">
              <PieChart className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 px-4">
              <p className="text-sm font-black text-theme-text">All Budgets Configured</p>
              <p className="text-xs text-theme-secondary leading-relaxed">
                You have already created spending limits for all available spending categories.
                Delete or edit an existing budget to adjust.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddBudgetOpen(false)}
              className="w-full mt-2 py-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-theme-text font-bold active:scale-98 transition-all text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddBudgetSubmit} className="space-y-6">
            {/* Squircle 4-Column Category Grid */}
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Select Category
              </label>
              <div className="grid grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {availableCategories.map((cat) => {
                  const isSelected = category === cat.name;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-[22px] border transition-all duration-200 cursor-pointer gap-2 select-none outline-none ${
                        isSelected
                          ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/40 text-indigo-650 dark:text-indigo-400 ring-2 ring-indigo-500/10 scale-102 shadow-[0_4px_16px_rgba(99,102,241,0.08)]'
                          : 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/30 text-zinc-550 dark:text-zinc-450 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <motion.div
                        className={`w-8 h-8 rounded-[12px] flex items-center justify-center shadow-xs ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/40'
                        }`}
                        whileTap={{ scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      >
                        <Icon className="w-4 h-4" />
                      </motion.div>
                      <span
                        className={`font-black uppercase tracking-tight text-center leading-none max-w-full break-words ${
                          cat.name.length > 9 ? 'text-[7px]' : 'text-[8px]'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Budget Limit Amount (₹)
              </label>
              <div className="relative">
                <span className="text-sm font-bold text-zinc-400 absolute left-4.5 top-3.5">₹</span>
                <input
                  type="number"
                  placeholder="200"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-850/60 focus:border-indigo-500/40 text-sm font-bold text-theme-text placeholder-zinc-400 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer border border-indigo-500/20 hover:bg-indigo-700"
            >
              Save Budget
            </button>
          </form>
        )}
      </BottomSheet>

      {/* Edit Budget bottom sheet */}
      <BottomSheet
        isOpen={editingBudget !== null}
        onClose={() => setEditingBudget(null)}
        title="Modify Category Budget"
      >
        {editingBudget && (
          <form onSubmit={handleEditBudgetSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
                Budget Category
              </span>
              <div className="flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-850/60 px-4 py-3.5 rounded-2xl text-sm font-bold text-zinc-550 dark:text-zinc-450">
                {React.createElement(
                  categories.find((c) => c.name === editingBudget.category)?.icon || HelpCircle,
                  { className: 'w-4.5 h-4.5 text-zinc-450 dark:text-zinc-550 shrink-0' }
                )}
                <span>{editingBudget.category}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Modified Budget Limit (₹)
              </label>
              <div className="relative">
                <span className="text-sm font-bold text-zinc-400 absolute left-4.5 top-3.5">₹</span>
                <input
                  type="number"
                  placeholder="200"
                  value={editLimitAmount}
                  onChange={(e) => setEditLimitAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-850/60 focus:border-indigo-500/40 text-sm font-bold text-theme-text placeholder-zinc-400 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="submit"
                className="py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs hover:bg-indigo-700"
              >
                Apply Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="py-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-theme-text font-bold active:scale-98 transition-all text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            {/* Delete trigger inside editing drawer */}
            <div className="border-t border-zinc-200/60 dark:border-zinc-850/40 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingBudget(editingBudget);
                  setEditingBudget(null);
                }}
                className="w-full py-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 font-bold active:scale-98 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors duration-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Budget</span>
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Delete Confirmation bottom sheet */}
      <BottomSheet
        isOpen={deletingBudget !== null}
        onClose={() => setDeletingBudget(null)}
        title="Confirm Deletion"
      >
        {deletingBudget && (
          <div className="space-y-5">
            <div className="text-center py-2 space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
                <Trash2 className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div className="space-y-1.5 px-2">
                <h4 className="text-sm font-black text-theme-text">
                  Delete {deletingBudget.category} Budget?
                </h4>
                <p className="text-xs text-theme-secondary leading-relaxed max-w-xs mx-auto">
                  Are you sure you want to permanently remove the limit for{' '}
                  <span className="text-theme-text font-bold">{deletingBudget.category}</span>? Your
                  actual expenses in this category will remain untouched.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  deleteBudget(deletingBudget.id);
                  setDeletingBudget(null);
                }}
                className="py-3.5 rounded-xl bg-rose-500 text-white font-bold hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs uppercase tracking-wider hover:bg-rose-600"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setDeletingBudget(null)}
                className="py-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-theme-text font-bold active:scale-98 transition-all text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
