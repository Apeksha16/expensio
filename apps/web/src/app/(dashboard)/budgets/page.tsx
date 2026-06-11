'use client';

import React, { useState } from 'react';
import BottomSheet from '../../../components/shared/BottomSheet';
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from '../../../hooks/useBudgets';
import { BudgetSummary } from '@expensio/types';
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
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Category helpers ────────────────────────────────────────────────────────

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
] as const;

// ─── Helper: get ISO date boundaries for a given month/year ──────────────────

function getMonthBoundaries(year: number, month: number) {
  const startDate = new Date(year, month, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
  return { startDate, endDate };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BudgetsPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [editingBudget, setEditingBudget] = useState<BudgetSummary | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<BudgetSummary | null>(null);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);

  // Form state – add
  const [category, setCategory] = useState('Food');
  const [limitAmount, setLimitAmount] = useState('');

  // Form state – edit
  const [editLimitAmount, setEditLimitAmount] = useState('');

  // Month selector (defaults to current month)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // ── React Query ────────────────────────────────────────────────────────────
  const { data: budgets = [], isLoading, isError } = useBudgets({ period: 'monthly' });
  const createBudgetMutation = useCreateBudget();
  const updateBudgetMutation = useUpdateBudget();
  const deleteBudgetMutation = useDeleteBudget();

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // ── Date navigation ────────────────────────────────────────────────────────
  const handlePrevMonth = () =>
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });

  const handleNextMonth = () =>
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth();

  // ── Aggregate metrics ──────────────────────────────────────────────────────
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const budgetUsagePercent =
    totalBudgetLimit > 0 ? Math.round((totalSpent / totalBudgetLimit) * 100) : 0;

  // ── Category availability ──────────────────────────────────────────────────
  const usedCategories = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categories.filter((cat) => !usedCategories.has(cat.name));

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenAddBudget = () => {
    if (availableCategories.length > 0) {
      setCategory(availableCategories[0].name);
    }
    setLimitAmount('');
    setIsAddBudgetOpen(true);
  };

  const handleAddBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!limitAmount || isNaN(Number(limitAmount)) || Number(limitAmount) <= 0) return;

    const { startDate, endDate } = getMonthBoundaries(selectedYear, selectedMonth);

    createBudgetMutation.mutate(
      {
        categoryId: category,
        amount: Number(limitAmount),
        period: 'monthly',
        startDate,
        endDate,
      },
      {
        onSuccess: () => {
          setLimitAmount('');
          setIsAddBudgetOpen(false);
          showToast('Budget created successfully!');
        },
        onError: (err) => {
          showToast(err.message || 'Failed to create budget');
        },
      }
    );
  };

  const handleEditBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBudget || !editLimitAmount || isNaN(Number(editLimitAmount))) return;

    updateBudgetMutation.mutate(
      { id: editingBudget.id, data: { amount: Number(editLimitAmount) } },
      {
        onSuccess: () => {
          setEditLimitAmount('');
          setEditingBudget(null);
          showToast('Budget updated!');
        },
        onError: (err) => {
          showToast(err.message || 'Failed to update budget');
        },
      }
    );
  };

  const handleDeleteBudget = (id: string) => {
    deleteBudgetMutation.mutate(id, {
      onSuccess: () => {
        setDeletingBudget(null);
        showToast('Budget deleted.');
      },
      onError: (err) => {
        showToast(err.message || 'Failed to delete budget');
      },
    });
  };

  // Loading skeleton moved to inline list

  if (isError) {
    return (
      <div className="p-10 text-center flex flex-col items-center gap-3">
        <PieChart className="w-8 h-8 text-zinc-400" />
        <p className="text-sm font-bold text-theme-text">Failed to load budgets</p>
        <p className="text-xs text-theme-secondary">Please try refreshing the page.</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-6 select-none relative">
      {/* Header */}
      <div className="flex flex-col gap-0.5 px-1">
        <h2 className="text-xl font-extrabold tracking-tight text-theme-text">Budgets</h2>
        <p className="text-[10.5px] text-zinc-550 font-bold uppercase tracking-wider">
          Manage your budget limits and track progress
        </p>
      </div>

      {/* Overall Progress Card */}
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
              <circle
                cx="44"
                cy="44"
                r="35"
                className="stroke-zinc-100 dark:stroke-zinc-850 fill-transparent"
                strokeWidth="5"
              />
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

      {/* Category header + Add button */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-black uppercase tracking-widest text-theme-text">
          Your Categories
        </h3>
        <button
          onClick={handleOpenAddBudget}
          disabled={createBudgetMutation.isPending}
          className="flex items-center justify-center w-9 h-9 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-750 font-bold active:scale-95 transition-all cursor-pointer shadow-lg shadow-indigo-600/15 hover:shadow-indigo-600/25 border border-indigo-500/20 group duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label="Add Budget"
        >
          <Plus className="w-5 h-5 stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
        </button>
      </div>

      {/* Budget Cards Grid */}
      <div className="space-y-4 px-1">
        {isLoading ? (
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-[28px] bg-zinc-100 dark:bg-zinc-900/40 border border-theme-border/60 animate-pulse"
              />
            ))}
          </div>
        ) : budgets.length === 0 ? (
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
              {budgets.map((budget) => (
                <BudgetCardAPI
                  key={budget.id}
                  budget={budget}
                  onDelete={(id) => {
                    const toDelete = budgets.find((b) => b.id === id);
                    if (toDelete) setDeletingBudget(toDelete);
                  }}
                  onEdit={(b) => {
                    setEditingBudget(b);
                    setEditLimitAmount(b.budgetAmount.toString());
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Budget Bottom Sheet */}
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
            {/* Category Grid */}
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
                  inputMode="decimal"
                  placeholder="5000"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-850/60 focus:border-indigo-500/40 text-sm font-bold text-theme-text placeholder-zinc-400 focus:outline-none transition-colors"
                  required
                  min="1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createBudgetMutation.isPending}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer border border-indigo-500/20 hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {createBudgetMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Budget'
              )}
            </button>
          </form>
        )}
      </BottomSheet>

      {/* Edit Budget Bottom Sheet */}
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
                  categories.find((c) => c.name === editingBudget.categoryId)?.icon || HelpCircle,
                  { className: 'w-4.5 h-4.5 text-zinc-450 dark:text-zinc-550 shrink-0' }
                )}
                <span>{editingBudget.categoryId}</span>
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
                  inputMode="decimal"
                  placeholder="5000"
                  value={editLimitAmount}
                  onChange={(e) => setEditLimitAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-850/60 focus:border-indigo-500/40 text-sm font-bold text-theme-text placeholder-zinc-400 focus:outline-none transition-colors"
                  required
                  min="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="submit"
                disabled={updateBudgetMutation.isPending}
                className="py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {updateBudgetMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Apply Changes'
                )}
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
                className="w-full py-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30 font-bold active:scale-98 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Budget</span>
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Delete Confirmation Bottom Sheet */}
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
                  Delete {deletingBudget.categoryId} Budget?
                </h4>
                <p className="text-xs text-theme-secondary leading-relaxed max-w-xs mx-auto">
                  Are you sure you want to permanently remove the limit for{' '}
                  <span className="text-theme-text font-bold">{deletingBudget.categoryId}</span>?
                  Your actual expenses in this category will remain untouched.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={deleteBudgetMutation.isPending}
                onClick={() => handleDeleteBudget(deletingBudget.id)}
                className="py-3.5 rounded-xl bg-rose-500 text-white font-bold hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs uppercase tracking-wider hover:bg-rose-600 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {deleteBudgetMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Yes, Delete'
                )}
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

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-28 left-6 right-6 z-[300] max-w-sm mx-auto p-4 rounded-xl border border-theme-card-border bg-theme-card backdrop-blur-xl flex items-center gap-3 shadow-xl text-xs font-bold text-theme-text select-none"
          >
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── API-backed BudgetCard ────────────────────────────────────────────────────
// A lightweight wrapper that reads from BudgetSummary instead of the finance store

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
};

interface BudgetCardAPIProps {
  budget: BudgetSummary;
  onDelete: (id: string) => void;
  onEdit?: (budget: BudgetSummary) => void;
}

function BudgetCardAPI({ budget, onDelete, onEdit }: BudgetCardAPIProps) {
  const percent = budget.utilizationPercentage;
  const isExceeded = budget.spentAmount > budget.budgetAmount;
  const isWarning = budget.spentAmount > budget.budgetAmount * 0.75 && !isExceeded;

  const meta = categoryMeta[budget.categoryId] ?? {
    icon: HelpCircle,
    color: 'text-zinc-550 dark:text-zinc-400',
    bg: 'bg-zinc-800/40 dark:bg-zinc-800/50',
    border: 'border-zinc-800/40 dark:border-zinc-800/50',
  };
  const barColor = categoryBarColors[budget.categoryId] ?? 'bg-zinc-500 dark:bg-zinc-450';
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
      {/* Icon */}
      <div
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.bg} ${meta.border} border transition-transform duration-300 group-hover:scale-105`}
      >
        <IconComponent className={`w-5.5 h-5.5 ${meta.color}`} />
      </div>

      {/* Main Details */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        {/* Row 1: Title & Status + Actions */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1.5 min-w-0">
            <h4 className="text-xs font-black text-theme-text uppercase tracking-wider truncate">
              {budget.categoryId}
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

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 select-none shrink-0 pt-0.5">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(budget)}
                className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 active:scale-90 transition-all cursor-pointer flex items-center justify-center shrink-0 outline-none"
                aria-label="Edit Budget"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(budget.id)}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-rose-500/10 dark:bg-zinc-900 dark:hover:bg-rose-500/10 border border-zinc-200 dark:border-zinc-800 hover:border-rose-500/30 dark:hover:border-rose-500/30 text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center shrink-0 outline-none"
              aria-label="Delete Budget"
            >
              <Trash2 className="w-3.5 h-3.5 transition-colors duration-150" />
            </button>
          </div>
        </div>

        {/* Row 2: Spent of Limit */}
        <div className="flex items-center justify-between text-[10px] font-bold text-theme-secondary leading-none">
          <div>
            <span className="text-theme-text font-extrabold text-[11px]">
              ₹{budget.spentAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[9px] text-theme-secondary/80 font-semibold">
              {' '}
              of ₹{budget.budgetAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} limit
            </span>
          </div>
          <span
            className={`font-black text-[9px] uppercase tracking-wider ${isExceeded ? 'text-rose-500' : 'text-theme-text'}`}
          >
            {isExceeded
              ? `₹${Math.round(budget.spentAmount - budget.budgetAmount).toLocaleString('en-IN')} over`
              : `₹${Math.round(budget.remainingAmount).toLocaleString('en-IN')} left`}
          </span>
        </div>

        {/* Row 3: Progress Bar */}
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
