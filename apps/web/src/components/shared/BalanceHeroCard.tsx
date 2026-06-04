'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Wallet, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { useFinanceStore } from '../../store/finance-store';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function BalanceHeroCard() {
  const router = useRouter();
  const { expenses } = useFinanceStore();
  const [showBalance, setShowBalance] = useState(true);

  // Match the exact mockup numbers: Balance of 19290.62, Income of 48200, Expenses of 28909.38
  const mockIncome = 48200;
  const mockBaseExpenses = 28909.38;
  const addedExpenses = expenses
    .filter((e) => e.paidBy === 'me' && !e.groupId)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const displayIncome = mockIncome;
  const displayExpenses = mockBaseExpenses + addedExpenses;
  const displayBalance = displayIncome - displayExpenses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[32px] bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/80 shadow-[0_12px_32px_rgba(99,102,241,0.06)] active:scale-[0.99] transition-all cursor-pointer group flex flex-col gap-6 p-6"
    >
      {/* Ambient background glows */}
      <div className="absolute top-12 left-[55%] w-1.5 h-1.5 rounded-full bg-indigo-400/25 pointer-events-none z-0" />
      <div className="absolute top-20 right-20 w-1 h-1 rounded-full bg-white/60 pointer-events-none z-0" />

      {/* Premium gradient wave lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.01" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#c084fc" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path
          d="M-5,78 C15,74 32,58 50,54 C68,50 78,68 105,48"
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="1.2"
        />
        <path
          d="M-5,78 C15,74 32,58 50,54 C68,50 78,68 105,48 L105,100 L-5,100 Z"
          fill="url(#wave-grad)"
        />
      </svg>

      {/* Multi-layered 3D Glowing Glass circular orb - scaled down to prevent overlaps on mobile */}
      <div className="absolute right-4 top-10 w-24 h-24 flex items-center justify-center shrink-0 pointer-events-none z-0">
        {/* Glowing background aura */}
        <div className="absolute w-32 h-32 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.15),transparent_70%)] blur-md" />
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-indigo-500/25 dark:border-indigo-400/10 bg-linear-to-tr from-indigo-500/5 via-transparent to-purple-500/5 shadow-[0_0_15px_rgba(99,102,241,0.1)]" />
        {/* Middle ring */}
        <div className="absolute inset-1.5 rounded-full border border-indigo-500/35 dark:border-indigo-400/20 bg-linear-to-tr from-indigo-500/10 via-purple-500/10 to-transparent" />
        {/* Inner glass orb */}
        <div className="absolute inset-3 rounded-full bg-linear-to-br from-indigo-500 via-indigo-600 to-purple-600 shadow-[0_6px_24px_rgba(99,102,241,0.35),inset_0_3px_8px_rgba(255,255,255,0.4),inset_0_-3px_8px_rgba(0,0,0,0.2)] flex items-center justify-center border border-white/25">
          <span className="text-2xl font-extrabold text-white select-none drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.15)] font-sans">
            ₹
          </span>
        </div>
      </div>

      {/* Title & Options Row */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <Wallet className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-650 dark:text-indigo-400">
              Total Balance
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBalance(!showBalance);
              }}
              className="w-7 h-7 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-center text-zinc-100 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all outline-none border-0 cursor-pointer"
              title={showBalance ? 'Hide Balance' : 'Show Balance'}
            >
              {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Balance Display */}
      <div className="flex flex-col gap-1 z-10 max-w-[65%]">
        <div className="flex items-baseline">
          <span className="text-3xl font-black tracking-tight leading-none text-zinc-100 tabular-nums truncate">
            {showBalance
              ? `₹${displayBalance.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : '••••••'}
          </span>
        </div>
        {/* Trend Indicator badge */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
            <span className="scale-90 font-black">↑</span>
            <span>12.4%</span>
          </div>
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
            vs last month
          </span>
        </div>
      </div>

      {/* Unified bottom indicators card - optimized to avoid mobile text squeeze */}
      <div className="grid grid-cols-2 gap-3 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/40 rounded-[24px] p-3.5 z-10 relative shadow-xs">
        {/* Income column */}
        <div className="flex items-center gap-2.5 px-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-sm text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4.5 w-4.5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider leading-none">
              Income
            </span>
            <span className="text-base font-black text-zinc-100 tracking-tight leading-none mt-1">
              {showBalance ? `₹${displayIncome.toLocaleString('en-IN')}` : '••••••'}
            </span>
            <div className="flex items-center gap-1 mt-1 leading-none flex-wrap">
              <span className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400">
                ↑ 18.6%
              </span>
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-550">
                this month
              </span>
            </div>
          </div>
        </div>

        {/* Vertical Separator divider */}
        <div className="absolute left-1/2 top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-800/60" />

        {/* Expenses column */}
        <div className="flex items-center gap-2.5 pl-3 px-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 flex items-center justify-center shrink-0 shadow-sm text-rose-600 dark:text-rose-400">
            <TrendingDown className="h-4.5 w-4.5 stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-555 uppercase tracking-wider leading-none">
              Expenses
            </span>
            <span className="text-base font-black text-zinc-100 tracking-tight leading-none mt-1">
              {showBalance ? `₹${Math.round(displayExpenses).toLocaleString('en-IN')}` : '••••••'}
            </span>
            <div className="flex items-center gap-1 mt-1 leading-none flex-wrap">
              <span className="text-[8.5px] font-bold text-rose-500 dark:text-rose-400">
                ↓ 8.7%
              </span>
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-550">
                this month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          router.push('/dashboard?tab=overview');
        }}
        className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1 hover:underline cursor-pointer transition-all z-10"
      >
        <BarChart2 className="w-4 h-4" />
        <span>View full analytics</span>
        <span className="text-[10px] font-black">&gt;</span>
      </div>
    </motion.div>
  );
}
