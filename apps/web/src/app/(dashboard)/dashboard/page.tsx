'use client';

import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../../../store/finance-store';
import BalanceHeroCard from '../../../components/shared/BalanceHeroCard';
import QuickActions from '../../../components/shared/QuickActions';
import ExpenseCard from '../../../components/shared/ExpenseCard';
import BottomSheet from '../../../components/shared/BottomSheet';
import {
  Coffee,
  Plus,
  RefreshCw,
  Smartphone,
  TrendingUp,
  DollarSign,
  Wallet,
  PieChart,
  CreditCard,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { expenses, deleteExpense, editExpense, setIsAddExpenseOpen } = useFinanceStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeDetailExpense, setActiveDetailExpense] = useState<any>(null);

  // Skeletons trigger on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450); // 450ms loader
    return () => clearTimeout(timer);
  }, []);

  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  // Get recent 4 expenses excluding Group transactions
  const recentExpenses = expenses.filter((e) => !e.groupId).slice(0, 4);

  // Match the exact mockup numbers but keep it dynamic with user additions
  const mockIncome = 48200;
  const mockBaseExpenses = 23639;
  const addedExpenses = expenses
    .filter((e) => e.paidBy === 'me' && !e.groupId)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const displayExpenses = mockBaseExpenses + addedExpenses;

  const displayFood = Math.round(displayExpenses * 0.38);
  const displayShopping = Math.round(displayExpenses * 0.21);
  const displayTransport = Math.round(displayExpenses * 0.16);
  const displayBills = Math.round(displayExpenses * 0.12);
  const displayOthers = Math.round(displayExpenses * 0.13);

  // Colors for Donut segment loops (circumference = 251.32)
  const segments = [
    { color: 'stroke-indigo-500 dark:stroke-indigo-400', offset: 0, length: 95.5 }, // Food (38%)
    { color: 'stroke-emerald-500 dark:stroke-emerald-400', offset: 95.5, length: 52.8 }, // Shopping (21%)
    { color: 'stroke-amber-500 dark:stroke-amber-400', offset: 148.3, length: 40.2 }, // Transport (16%)
    { color: 'stroke-rose-500 dark:stroke-rose-400', offset: 188.5, length: 30.2 }, // Bills (12%)
    { color: 'stroke-cyan-500 dark:stroke-cyan-400', offset: 218.7, length: 32.6 }, // Others (13%)
  ];

  if (isLoading || isRefreshing) {
    return (
      <div className="space-y-6 pb-6 animate-pulse select-none">
        <div className="h-52 rounded-[28px] bg-zinc-900/10 dark:bg-zinc-900/40 border border-theme-border/60" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-900/20 dark:bg-zinc-900/60 rounded" />
          <div className="flex gap-3 overflow-hidden">
            <div className="h-12 w-28 bg-zinc-900/10 dark:bg-zinc-900/40 rounded-2xl shrink-0" />
            <div className="h-12 w-28 bg-zinc-900/10 dark:bg-zinc-900/40 rounded-2xl shrink-0" />
            <div className="h-12 w-28 bg-zinc-900/10 dark:bg-zinc-900/40 rounded-2xl shrink-0" />
          </div>
        </div>
        <div className="h-40 rounded-2xl bg-zinc-900/10 dark:bg-zinc-900/40 border border-theme-border/60" />
        <div className="space-y-3">
          <div className="h-16 rounded-2xl bg-zinc-900/10 dark:bg-zinc-900/40 border border-theme-border/60" />
          <div className="h-16 rounded-2xl bg-zinc-900/10 dark:bg-zinc-900/40 border border-theme-border/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 select-none relative">
      {/* 1. Wallet Hero Card */}
      <BalanceHeroCard />

      {/* 2. Squircle Quick Actions */}
      <QuickActions onAddExpenseClick={() => setIsAddExpenseOpen(true)} />

      {/* 3. AI Insights Premium Widget */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-4.5 rounded-[22px] border border-indigo-500/10 bg-gradient-to-r from-indigo-500/5 via-violet-500/5 to-cyan-500/5 backdrop-blur-md relative overflow-hidden flex gap-3.5 shadow-xs bg-theme-card border-theme-card-border"
      >
        <div className="absolute top-[-30%] right-[-10%] w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
          <Sparkles className="w-4.5 h-4.5" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-550">
            AI Smart Insight
          </span>
          <p className="text-[11px] text-zinc-750 dark:text-zinc-300 font-semibold leading-relaxed">
            You spent <span className="text-cyan-600 dark:text-cyan-400 font-bold">12% less</span>{' '}
            on food this week compared to last. You are on track to save{' '}
            <span className="text-indigo-650 dark:text-indigo-400 font-bold">₹350</span> this month!
          </p>
        </div>
      </motion.div>

      {/* 4. Spent Analysis Visual Categories Chart (Donut) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-550">
            This Month Overview
          </h3>
          <Link
            href="/budgets"
            className="text-[9px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="p-4.5 rounded-[24px] bg-theme-card border border-theme-card-border shadow-[0_8px_24px_rgba(0,0,0,0.02)] flex items-center justify-between gap-5">
          {/* Circular donut graph segment drawing */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(128,128,128,0.05)"
                strokeWidth="8"
              />
              {segments.map((seg, i) => (
                <circle
                  key={i}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  className={seg.color}
                  strokeWidth="8"
                  strokeDasharray={`${seg.length} 251.2`}
                  strokeDashoffset={-seg.offset}
                  strokeLinecap="round"
                />
              ))}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[13px] font-extrabold text-theme-text leading-none mt-1">
                ₹{displayExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-500 leading-none mt-1">
                Spent
              </span>
            </div>
          </div>

          {/* Labels Grid */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[9.5px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-800 dark:text-zinc-200 font-black">Food</span>
                <span className="text-[8.5px] text-zinc-450 dark:text-zinc-500 font-bold">
                  38% · ₹{displayFood.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-800 dark:text-zinc-200 font-black">Shop</span>
                <span className="text-[8.5px] text-zinc-450 dark:text-zinc-500 font-bold">
                  21% · ₹{displayShopping.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-800 dark:text-zinc-200 font-black">Travel</span>
                <span className="text-[8.5px] text-zinc-450 dark:text-zinc-500 font-bold">
                  16% · ₹{displayTransport.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-800 dark:text-zinc-200 font-black">Bills</span>
                <span className="text-[8.5px] text-zinc-450 dark:text-zinc-500 font-bold">
                  12% · ₹{displayBills.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-800 dark:text-zinc-200 font-black">Others</span>
                <span className="text-[8.5px] text-zinc-450 dark:text-zinc-500 font-bold">
                  13% · ₹{displayOthers.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent Transactions Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-550">
            Recent Expenses
          </h3>
          <Link
            href="/expenses"
            className="text-[9px] font-black uppercase tracking-wider text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
          >
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-theme-card border border-theme-card-border rounded-[28px] overflow-hidden divide-y divide-theme-border/40 px-3.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.015)]">
          {recentExpenses.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-bold">
              No transactions found.
            </div>
          ) : (
            recentExpenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onDelete={deleteExpense}
                onEdit={(exp) => setActiveDetailExpense(exp)}
                onTap={(exp) => setActiveDetailExpense(exp)}
              />
            ))
          )}
        </div>
      </div>

      {/* Detailed Transaction Sheet Modal */}
      <BottomSheet
        isOpen={activeDetailExpense !== null}
        onClose={() => setActiveDetailExpense(null)}
        title="Transaction Details"
      >
        {activeDetailExpense && (
          <div className="space-y-6">
            {/* Glowing Invoice card details */}
            <div className="p-5 rounded-2xl border border-theme-card-border bg-theme-card relative overflow-hidden flex flex-col gap-5">
              <div className="absolute top-[-30%] right-[-20%] w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center justify-between pb-3 border-b border-theme-border/40">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Payment Invoice
                  </span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded border border-theme-border text-zinc-500">
                  Confirmed
                </span>
              </div>

              {/* Amount Owed */}
              <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  Transaction Sum
                </span>
                <span
                  className={`text-4xl font-extrabold tracking-tight ${expenseCategoryColor(activeDetailExpense.category)}`}
                >
                  {activeDetailExpense.category === 'Income'
                    ? `+₹${activeDetailExpense.amount.toFixed(2)}`
                    : `-₹${activeDetailExpense.amount.toFixed(2)}`}
                </span>
                <span className="text-xs font-bold text-theme-text mt-1.5 text-center">
                  {activeDetailExpense.title.replace(/\p{Extended_Pictographic}/gu, '').trim()}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-theme-border/40">
                  <span className="text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
                    Category
                  </span>
                  <span className="font-extrabold text-theme-text">
                    {activeDetailExpense.category}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-theme-border/40">
                  <span className="text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
                    Date & Time
                  </span>
                  <span className="font-extrabold text-theme-text">
                    {new Date(activeDetailExpense.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {activeDetailExpense.paymentMethod && (
                  <div className="flex justify-between py-1.5 border-b border-theme-border/40">
                    <span className="text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
                      Payment Method
                    </span>
                    <span className="font-extrabold text-theme-text">
                      {activeDetailExpense.paymentMethod}
                    </span>
                  </div>
                )}

                {activeDetailExpense.note && (
                  <div className="flex flex-col gap-1.5 py-1.5">
                    <span className="text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
                      Note
                    </span>
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400 italic text-[11px] leading-relaxed">
                      "{activeDetailExpense.note.replace(/\p{Extended_Pictographic}/gu, '').trim()}"
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Settle buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  deleteExpense(activeDetailExpense.id);
                  setActiveDetailExpense(null);
                }}
                className="py-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-450 font-bold active:scale-98 transition-all text-xs cursor-pointer"
              >
                Delete Transaction
              </button>
              <button
                onClick={() => setActiveDetailExpense(null)}
                className="py-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-theme-border text-zinc-700 dark:text-zinc-300 font-bold active:scale-98 transition-all text-xs cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

// Category text colors mapping helper
function expenseCategoryColor(cat: string) {
  if (cat === 'Income') return 'text-emerald-500 dark:text-emerald-400';
  return 'text-rose-500 dark:text-rose-400';
}
