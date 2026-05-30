'use client';

import React, { useState } from 'react';
import { Expense, useFinanceStore } from '../../../store/finance-store';
import ExpenseCard from '../../../components/shared/ExpenseCard';
import BottomSheet from '../../../components/shared/BottomSheet';
import { Search, ShoppingBag, Trash2, Edit2, Calendar, CheckSquare, X, Info } from 'lucide-react';

export default function ExpensesPage() {
  const { expenses, deleteExpense, editExpense, batchDeleteExpenses } = useFinanceStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Interactive detail sheet and edit state
  const [activeDetailExpense, setActiveDetailExpense] = useState<Expense | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Food');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');

  // Selection mode states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filterPills = ['All', 'Food', 'Travel', 'Entertainment', 'Shopping', 'Utilities'];

  const filteredExpenses = expenses.filter((exp: Expense) => {
    const matchesSearch = exp.title.toLowerCase().includes(search.toLowerCase()) || 
      (exp.note && exp.note.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelectToggle = (id: string) => {
    setIsSelectionMode(true);
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    batchDeleteExpenses(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const startEditing = (expense: Expense) => {
    setEditTitle(expense.title);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    setEditDate(expense.date);
    setEditNote(expense.note || '');
    setIsEditing(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDetailExpense || !editTitle || !editAmount || isNaN(Number(editAmount))) return;

    editExpense(activeDetailExpense.id, {
      title: editTitle,
      amount: Number(editAmount),
      category: editCategory,
      date: editDate,
      note: editNote
    });

    setIsEditing(false);
    setActiveDetailExpense(null);
  };

  return (
    <div className="space-y-6 pb-24 relative select-none">
      
      {/* Dynamic Sub-header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">All Expenses</h2>
          <p className="text-xs text-zinc-400">Search, manage, or swipe to delete and edit.</p>
        </div>

        {/* Selection mode triggers */}
        <button
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            setSelectedIds([]);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all cursor-pointer ₹{
            isSelectionMode 
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
              : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
        </button>
      </div>

      {/* Sticky Search bar */}
      <div className="relative px-1">
        <Search className="w-4 h-4 text-zinc-500 absolute left-4.5 top-3.5" />
        <input
          type="text"
          placeholder="Search descriptions, memos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 focus:border-emerald-500/40 text-xs font-semibold text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
        />
      </div>

      {/* Category Selection Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
        {filterPills.map((pill) => {
          const isActive = selectedCategory === pill;
          return (
            <button
              key={pill}
              onClick={() => setSelectedCategory(pill)}
              className={`px-4 py-2 rounded-xl border font-bold text-xs transition-all shrink-0 cursor-pointer ₹{
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-1 ring-emerald-500/30'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {pill}
            </button>
          );
        })}
      </div>

      {/* Timeline Feed Container */}
      <div className="space-y-3.5 px-1">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-300">No transactions matches</p>
              <p className="text-xs text-zinc-500">Modify your queries or add new expenses.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-500">
              <span>Timeline Feed</span>
              <span>{filteredExpenses.length} transactions</span>
            </div>

            {filteredExpenses.map((expense: Expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onDelete={deleteExpense}
                onEdit={(exp) => {
                  setActiveDetailExpense(exp);
                  startEditing(exp);
                }}
                onTap={(exp) => {
                  setActiveDetailExpense(exp);
                  setIsEditing(false);
                }}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.includes(expense.id)}
                onSelectToggle={handleSelectToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Batch Action Bottom Bar */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-6 right-6 z-40 max-w-sm mx-auto p-4 rounded-2xl border border-zinc-800 bg-[#09090b]/90 backdrop-blur-xl flex items-center justify-between shadow-2xl animate-slide-up">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-zinc-300">
              {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500 text-zinc-950 font-bold active:scale-95 transition-all text-[10px] uppercase cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds([]);
              }}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 active:scale-95 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Transaction detail and editing modal sheet */}
      <BottomSheet
        isOpen={activeDetailExpense !== null}
        onClose={() => {
          setActiveDetailExpense(null);
          setIsEditing(false);
        }}
        title={isEditing ? 'Edit Expense' : 'Transaction Details'}
      >
        {activeDetailExpense && (
          isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div className="flex flex-col items-center gap-1 py-2 border-b border-zinc-900">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Edit Value</span>
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-bold text-emerald-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="text-4xl font-black text-zinc-100 bg-transparent text-center focus:outline-none w-48"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Description</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/40 text-sm font-semibold text-zinc-100 placeholder-zinc-600 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none"
                  >
                    <option value="Food">Food</option>
                    <option value="Travel">Travel</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs font-semibold text-zinc-100 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Notes / Memos</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/40 text-sm font-semibold text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="submit"
                  className="py-3.5 rounded-xl bg-gradient-to-tr from-emerald-400 to-emerald-600 text-zinc-950 font-bold hover:shadow-lg active:scale-98 transition-all text-xs cursor-pointer"
                >
                  Save Modifications
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold active:scale-98 transition-all text-xs cursor-pointer"
                >
                  Back to Details
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4 border-b border-zinc-900 gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Value Details</span>
                <span className="text-4xl font-extrabold text-rose-400">-₹{activeDetailExpense.amount.toFixed(2)}</span>
                <span className="text-xs font-semibold text-zinc-400 mt-0.5">{activeDetailExpense.title}</span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-zinc-900">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Category</span>
                  <span className="font-semibold text-zinc-200 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
                    {activeDetailExpense.category}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-zinc-900">
                  <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Transaction Date</span>
                  <span className="font-bold text-zinc-200">{new Date(activeDetailExpense.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>

                {activeDetailExpense.note && (
                  <div className="flex flex-col gap-1.5 py-2 border-b border-zinc-900">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Memo Notes</span>
                    <p className="text-zinc-300 font-medium italic">"{activeDetailExpense.note}"</p>
                  </div>
                )}

                {activeDetailExpense.splitWith && activeDetailExpense.splitWith.length > 0 && (() => {
                  const splitWith = activeDetailExpense.splitWith;
                  return (
                    <div className="flex flex-col gap-2 py-2">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Split Shares</span>
                      <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-zinc-400">Paid by Me</span>
                          <span className="text-zinc-100">₹{(activeDetailExpense.amount / (splitWith.length + 1)).toFixed(2)}</span>
                        </div>
                        {splitWith.map((friend: string) => (
                          <div key={friend} className="flex justify-between font-medium text-zinc-400 text-[11px]">
                            <span>Owes Me: {friend.split(' ')[0]}</span>
                            <span>₹{(activeDetailExpense.amount / (splitWith.length + 1)).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action grid */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => startEditing(activeDetailExpense)}
                  className="py-3.5 rounded-xl bg-indigo-500 text-zinc-950 font-bold active:scale-95 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Modify</span>
                </button>
                <button
                  onClick={() => {
                    deleteExpense(activeDetailExpense.id);
                    setActiveDetailExpense(null);
                  }}
                  className="py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold active:scale-95 transition-all text-xs cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={() => setActiveDetailExpense(null)}
                  className="py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold active:scale-95 transition-all text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )
        )}
      </BottomSheet>

    </div>
  );
}
