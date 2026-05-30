'use client';

import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store/finance-store';
import BalanceHeroCard from '../../components/shared/BalanceHeroCard';
import QuickActions from '../../components/shared/QuickActions';
import ExpenseCard from '../../components/shared/ExpenseCard';
import BottomSheet from '../../components/shared/BottomSheet';
import { Coffee, Plus, RefreshCw, Smartphone, TrendingUp, DollarSign, Wallet, PieChart, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { expenses, deleteExpense, editExpense, setIsAddExpenseOpen } = useFinanceStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeDetailExpense, setActiveDetailExpense] = useState<any>(null);

  // Skeletons trigger on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 850); // 850ms premium loader
    return () => clearTimeout(timer);
  }, []);

  // Emulate pull to refresh
  const triggerRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 750);
  };


  // Get recent 4 expenses excluding Goa Group transactions for home dashboard simplicity
  const recentExpenses = expenses.filter(e => !e.groupId).slice(0, 4);

  // Aggregated spent stats to match mockup exactly
  const totalSpent = 374.99;
  const transactionCount = 18;
  const topCategoryName = 'Food';
  const topCategorySpent = 155.00;
  const topCategoryPercent = 41;

  // Colors for mockup Donut segment loops
  const segments = [
    { color: 'stroke-emerald-400', offset: 0, length: 110 },    // Food (41%)
    { color: 'stroke-pink-400', offset: 110, length: 85 },     // Shopping (32%)
    { color: 'stroke-amber-500', offset: 195, length: 45 },    // Transport (17%)
    { color: 'stroke-indigo-400', offset: 240, length: 30 }    // Entertainment/Others (10%)
  ];

  if (isLoading || isRefreshing) {
    return (
      <div className="space-y-6 pb-6 animate-pulse select-none">
        <div className="h-52 rounded-[28px] bg-zinc-900/60 border border-zinc-800/80" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-900/80 rounded" />
          <div className="flex gap-3 overflow-hidden">
            <div className="h-12 w-28 bg-zinc-900/60 rounded-2xl shrink-0" />
            <div className="h-12 w-28 bg-zinc-900/60 rounded-2xl shrink-0" />
            <div className="h-12 w-28 bg-zinc-900/60 rounded-2xl shrink-0" />
          </div>
        </div>
        <div className="h-40 rounded-2xl bg-zinc-900/60 border border-zinc-800/60" />
        <div className="space-y-3">
          <div className="h-16 rounded-2xl bg-zinc-900/60 border border-zinc-800/60" />
          <div className="h-16 rounded-2xl bg-zinc-900/60 border border-zinc-800/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 select-none relative">
      
      {/* Pull to Refresh sync */}
      <div className="flex items-center justify-between px-1 -mt-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Fintech Hub</span>
        
        <button 
          onClick={triggerRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 text-[10px] font-black uppercase tracking-wider text-zinc-400 active:scale-95 active:bg-zinc-800 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3 h-3 text-emerald-400" />
          <span>Sync Live</span>
        </button>
      </div>

      {/* 1. Wallet Hero Card */}
      <BalanceHeroCard />

      {/* 2. Squircle Quick Actions */}
      <QuickActions onAddExpenseClick={() => setIsAddExpenseOpen(true)} />

      {/* 3. Pixel-Perfect Mockup Spending Overview Card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Spending Overview</h3>
          <span className="text-[10px] font-semibold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
            Month
          </span>
        </div>

        <div className="p-5 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl flex items-center justify-between gap-5 relative overflow-hidden">
          <div className="absolute top-[-40%] left-[-20%] w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

          {/* Left stats column */}
          <div className="space-y-4 flex-1">
            <div className="space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Top Category</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-bold text-zinc-100">{topCategoryName}</span>
                <span className="text-sm font-extrabold text-emerald-400">₹{topCategorySpent.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 font-bold mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{topCategoryPercent}% of total</span>
              </div>
            </div>

            <div className="space-y-0.5 pt-2 border-t border-zinc-900">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Transactions count</span>
              <span className="text-sm font-extrabold text-zinc-200">{transactionCount} <span className="text-[9px] text-zinc-500 font-bold uppercase">this month</span></span>
            </div>
          </div>

          {/* Center Donut SVG Chart exactly from the screenshot! */}
          <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
            <svg width="112" height="112" className="transform -rotate-90">
              {/* Gray Base circle */}
              <circle
                cx="56"
                cy="56"
                r="40"
                className="stroke-zinc-950 fill-transparent"
                strokeWidth="7.5"
              />
              {/* Segment arcs */}
              {segments.map((seg, idx) => (
                <circle
                  key={idx}
                  cx="56"
                  cy="56"
                  r="40"
                  className={`fill-transparent ₹{seg.color}`}
                  strokeWidth="8.5"
                  strokeDasharray="251.2" // circumference: 2 * Math.PI * 40
                  strokeDashoffset={251.2 - seg.length}
                  style={{ transform: `rotate(₹{seg.offset}deg)`, transformOrigin: '56px 56px' }}
                  strokeLinecap="round"
                />
              ))}
            </svg>
            
            {/* Center numbers */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-sm font-black text-zinc-100">₹{totalSpent.toFixed(2)}</span>
              <span className="text-[7px] font-black uppercase tracking-wider text-zinc-500">This Month</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Recent Transactions Timeline ( McDonald's, Amazon, Fuel, Starbucks, Salary ) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Recent Transactions</h3>
          <Link href="/expenses" className="text-[10px] font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-0.5">
            <span>See all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3 px-0.5">
          {recentExpenses.map((expense) => (
            <ExpenseCard 
              key={expense.id} 
              expense={expense} 
              onDelete={deleteExpense}
              onEdit={(exp) => setActiveDetailExpense(exp)}
              onTap={(exp) => setActiveDetailExpense(exp)}
            />
          ))}
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
            <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl relative overflow-hidden flex flex-col gap-5">
              <div className="absolute top-[-30%] right-[-20%] w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Payment Invoice</span>
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-400">
                  Confirmed
                </span>
              </div>

              {/* Amount Owed */}
              <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Transaction Sum</span>
                <span className={`text-4xl font-extrabold tracking-tight ₹{expenseCategoryColor(activeDetailExpense.category)}`}>
                  {activeDetailExpense.category === 'Income' ? `+₹₹{activeDetailExpense.amount.toFixed(2)}` : `-₹₹{activeDetailExpense.amount.toFixed(2)}`}
                </span>
                <span className="text-xs font-bold text-zinc-300 mt-1">{activeDetailExpense.title}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Category</span>
                  <span className="font-bold text-zinc-200">{activeDetailExpense.category}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Date & Time</span>
                  <span className="font-bold text-zinc-200">
                    {new Date(activeDetailExpense.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                {activeDetailExpense.paymentMethod && (
                  <div className="flex justify-between py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Payment Method</span>
                    <span className="font-bold text-zinc-200">{activeDetailExpense.paymentMethod}</span>
                  </div>
                )}

                {activeDetailExpense.note && (
                  <div className="flex flex-col gap-1.5 py-1.5">
                    <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[9px]">Add Note</span>
                    <span className="font-bold text-zinc-300 italic">"{activeDetailExpense.note}"</span>
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
                className="py-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-bold active:scale-98 transition-all text-xs cursor-pointer"
              >
                Delete Transaction
              </button>
              <button
                onClick={() => setActiveDetailExpense(null)}
                className="py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold active:scale-98 transition-all text-xs cursor-pointer"
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
  if (cat === 'Income') return 'text-emerald-400';
  return 'text-rose-400';
}
