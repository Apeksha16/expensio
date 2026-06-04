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
  AlertTriangle,
  Star,
} from 'lucide-react';

export default function BudgetsPage() {
  const { budgets, addBudget, editBudget, deleteBudget, expenses } = useFinanceStore();
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

  // Form State
  const [category, setCategory] = useState('Food');
  const [limitAmount, setLimitAmount] = useState('');
  const [editLimitAmount, setEditLimitAmount] = useState('');

  // Dynamically calculate total budget limit from all active budgets
  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.limitAmount, 0);

  // Dynamically calculate total spent in all categories that have a budget
  const budgetCategories = budgets.map((b) => b.category);
  const totalSpent = expenses
    .filter((e) => budgetCategories.includes(e.category) && e.paidBy === 'me')
    .reduce((sum, e) => sum + e.amount, 0);

  const budgetUsagePercent =
    totalBudgetLimit > 0 ? Math.round((totalSpent / totalBudgetLimit) * 100) : 0;

  const categories = [
    'Food',
    'Shopping',
    'Transport',
    'Entertainment',
    'Utilities',
    'Bills',
    'Health',
    'Education',
  ];

  // Filter out categories that already have a budget
  const availableCategories = categories.filter((cat) => !budgets.some((b) => b.category === cat));

  const handleOpenAddBudget = () => {
    if (availableCategories.length > 0) {
      setCategory(availableCategories[0]);
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
      {/* Month Picker Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-extrabold tracking-tight text-zinc-100">Category Budgets</h2>

        <div className="flex items-center gap-2 bg-[#0c0d12]/60 border border-theme-border/60 rounded-xl p-1 shrink-0">
          <button className="p-1 text-zinc-500 hover:text-zinc-300 active:scale-95 transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-300 px-1">
            May 2026
          </span>
          <button className="p-1 text-zinc-500 hover:text-zinc-300 active:scale-95 transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Overall Progress Box */}
      <div className="p-5 rounded-3xl border border-zinc-850/50 bg-gradient-to-br from-zinc-900/40 to-zinc-950/60 backdrop-blur-xl space-y-4 px-5 card-clean">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
            Overall Progress
          </span>
          <span className="text-xs font-bold text-zinc-300">{budgetUsagePercent}%</span>
        </div>

        <div className="space-y-2">
          {/* Progress track */}
          <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden p-[1px] border border-zinc-850">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.3)] transition-all duration-700"
              style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
            />
          </div>
          <div className="flex items-baseline justify-between text-xs text-zinc-400 font-medium">
            <span className="text-[10px] font-semibold text-zinc-500">
              Spent:{' '}
              <span className="font-extrabold text-zinc-300">
                ₹
                {totalSpent.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
            <span className="text-[10px] font-semibold text-zinc-500">
              Limit:{' '}
              <span className="font-bold text-zinc-450">
                ₹
                {totalBudgetLimit.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Category header trigger */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Category Limits
        </h3>
        <button
          onClick={handleOpenAddBudget}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-650 text-white hover:bg-indigo-600 font-bold active:scale-95 hover:scale-105 transition-all text-xs cursor-pointer shadow-md shadow-indigo-500/10 border border-indigo-500/30"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>New Budget</span>
        </button>
      </div>

      {/* Dynamic Grid of Budget cards */}
      <div className="space-y-4 px-1">
        {budgets.length === 0 ? (
          <div className="p-12 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <PieChart className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-350">No active budgets</p>
              <p className="text-xs text-zinc-500 max-w-[240px]">
                Tap "New Budget" above to set spending limits for your categories.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {budgets.map((budget: Budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
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
            <div className="w-12 h-12 rounded-full bg-zinc-950/60 border border-zinc-850 flex items-center justify-center mx-auto text-zinc-500">
              <PieChart className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 px-4">
              <p className="text-sm font-bold text-zinc-250">All Budgets Configured</p>
              <p className="text-xs text-zinc-550 leading-relaxed">
                You have already created spending limits for all available spending categories.
                Delete or edit an existing budget to adjust.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddBudgetOpen(false)}
              className="w-full mt-2 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold active:scale-98 transition-all text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddBudgetSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Select Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-850/60 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-indigo-500/40"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Budget Limit Amount (₹)
              </label>
              <div className="relative">
                <span className="text-sm font-bold text-zinc-400 absolute left-4.5 top-3.5">₹</span>
                <input
                  type="number"
                  placeholder="200"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-850/60 focus:border-indigo-500/40 text-sm font-semibold text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-zinc-950 font-black text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer border border-indigo-300/20"
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
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Budget Category
              </span>
              <span className="text-sm font-bold text-zinc-350 bg-zinc-950/60 border border-zinc-900 px-4 py-3.5 rounded-2xl block">
                {editingBudget.category}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Modified Budget Limit (₹)
              </label>
              <div className="relative">
                <span className="text-sm font-bold text-zinc-400 absolute left-4.5 top-3.5">₹</span>
                <input
                  type="number"
                  placeholder="200"
                  value={editLimitAmount}
                  onChange={(e) => setEditLimitAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-850/60 focus:border-indigo-500/40 text-sm font-semibold text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="submit"
                className="py-4 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-zinc-950 font-bold hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs"
              >
                Apply Changes
              </button>
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold active:scale-98 transition-all text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>

            {/* Delete trigger inside editing drawer */}
            <div className="border-t border-zinc-850/40 pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingBudget(editingBudget);
                  setEditingBudget(null);
                }}
                className="w-full py-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 font-bold active:scale-98 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors duration-200"
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
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-455">
                <Trash2 className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div className="space-y-1.5 px-2">
                <h4 className="text-sm font-black text-zinc-200">
                  Delete {deletingBudget.category} Budget?
                </h4>
                <p className="text-xs text-zinc-550 leading-relaxed max-w-xs mx-auto">
                  Are you sure you want to permanently remove the limit for{' '}
                  <span className="text-zinc-350 font-bold">{deletingBudget.category}</span>? Your
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
                className="py-4 rounded-xl bg-rose-500 text-zinc-950 font-bold hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs uppercase tracking-wider hover:bg-rose-400"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setDeletingBudget(null)}
                className="py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold active:scale-98 transition-all text-xs cursor-pointer"
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
