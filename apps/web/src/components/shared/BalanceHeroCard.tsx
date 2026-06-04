'use client';

import React, { useState } from 'react';
import { ArrowUpRight, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import { useFinanceStore } from '../../store/finance-store';
import { motion } from 'framer-motion';

export default function BalanceHeroCard() {
  const { expenses } = useFinanceStore();
  const [showBalance, setShowBalance] = useState(true);

  // Match the exact mockup numbers: Balance of 24136.81, Income of 48200, Expenses of 24063.19
  const mockIncome = 48200;
  const mockBaseExpenses = 24063.19;
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
      className="relative overflow-hidden rounded-[32px] bg-gradient-to-tr from-[#f4f3ff] via-[#f9f7ff] to-[#fbf8ff] dark:from-zinc-900/90 dark:via-zinc-950/80 dark:to-zinc-900/95 p-6 border border-white/40 dark:border-zinc-805/50 shadow-[0_12px_32px_rgba(99,102,241,0.06)] active:scale-[0.99] transition-all cursor-pointer group flex flex-col gap-6"
    >
      {/* Background Radial Glow */}
      <div className="absolute -right-10 -top-10 w-44 h-44 bg-[radial-gradient(circle,rgba(99,102,241,0.05),transparent_70%)] pointer-events-none" />

      {/* Premium wave lines */}
      <svg
        className="absolute inset-0 w-full h-full text-indigo-500/[0.04] dark:text-indigo-400/[0.02] pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path d="M0,60 C30,45 70,75 100,55 L100,100 L0,100 Z" fill="currentColor" />
        <path d="M0,68 C40,55 60,82 100,64 L100,100 L0,100 Z" fill="currentColor" opacity="0.4" />
      </svg>

      {/* 3D Iridescent Glowing Glass Sphere */}
      <div className="absolute right-12 top-8 w-24 h-24 rounded-full bg-linear-to-tr from-[#9f9eff]/30 via-[#c084fc]/30 to-[#f472b6]/25 dark:from-[#4f46e5]/40 dark:via-[#9333ea]/30 dark:to-[#db2777]/30 border border-white/40 dark:border-white/5 shadow-[0_10px_30px_rgba(168,85,247,0.12)] flex items-center justify-center overflow-hidden shrink-0 pointer-events-none">
        {/* Sphere highlight glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.2)_40%,transparent_75%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.35)_0%,transparent_60%)]" />
      </div>

      {/* Title & Options Row */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-[10.5px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Total Balance
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowBalance(!showBalance);
            }}
            className="p-1 rounded-md hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 active:scale-95 transition-all outline-none border-0 bg-transparent cursor-pointer"
            title={showBalance ? 'Hide Balance' : 'Show Balance'}
          >
            {showBalance ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="p-1.5 rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 active:scale-95 transition-all outline-none border-0 bg-transparent cursor-pointer"
          title="More Options"
        >
          <MoreHorizontal className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Main Balance Display */}
      <div className="flex flex-col gap-1 z-10">
        <div className="flex items-baseline">
          <span className="text-[36px] font-extrabold tracking-tight leading-none text-zinc-900 dark:text-zinc-100 tabular-nums">
            {showBalance
              ? `₹${displayBalance.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : '••••••'}
          </span>
        </div>
        {/* Trend Indicator badge */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-bold">
            <span className="scale-90 font-black">↑</span>
            <span>12.4%</span>
          </div>
          <span className="text-[9.5px] font-semibold text-zinc-400 dark:text-zinc-500">
            vs last month
          </span>
        </div>
      </div>

      {/* Unified bottom indicators card */}
      <div className="grid grid-cols-2 gap-2 bg-white/60 dark:bg-zinc-900/50 backdrop-blur-md border border-white/80 dark:border-zinc-800/40 rounded-[24px] p-3.5 z-10 relative">
        {/* Income column */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Income
            </span>
            <span className="text-[14px] font-black text-zinc-800 dark:text-zinc-200 tracking-tight leading-tight">
              ₹{displayIncome.toLocaleString('en-IN')}
            </span>
            <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-550 leading-tight">
              This month
            </span>
          </div>
        </div>

        {/* Vertical Separator divider */}
        <div className="absolute left-1/2 top-3 bottom-3 w-px bg-zinc-200/50 dark:bg-zinc-800/40" />

        {/* Expenses column */}
        <div className="flex items-center gap-2.5 pl-4 px-1">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <ArrowUpRight className="h-4 w-4 text-rose-600 dark:text-rose-400 stroke-[2.5] rotate-180" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
              Expenses
            </span>
            <span className="text-[14px] font-black text-zinc-800 dark:text-zinc-200 tracking-tight leading-tight">
              ₹{Math.round(displayExpenses).toLocaleString('en-IN')}
            </span>
            <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-550 leading-tight">
              This month
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
