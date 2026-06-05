'use client';

import React from 'react';
import { TrendingDown, BarChart2 } from 'lucide-react';
import { useFinanceStore } from '../../store/finance-store';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function BalanceHeroCard() {
  const router = useRouter();
  const { expenses } = useFinanceStore();

  const mockBaseExpenses = 28909.38;
  const addedExpenses = expenses
    .filter((e) => e.paidBy === 'me' && !e.groupId)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const displayExpenses = mockBaseExpenses + addedExpenses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[32px] bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/80 shadow-[0_12px_32px_rgba(99,102,241,0.06)] active:scale-[0.99] transition-all cursor-pointer group flex flex-col gap-5 p-6"
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

      {/* Redesigned Premium Rupee Icon/Orb Container - Centered Vertically */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 w-20 h-20 flex items-center justify-center shrink-0 pointer-events-none z-0">
        {/* Ambient pulsing background glow */}
        <div className="absolute w-28 h-28 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18),transparent_70%)] blur-lg pointer-events-none z-0" />
        {/* Outer squircle glow */}
        <div className="absolute inset-0 rounded-[24px] bg-linear-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 dark:border-indigo-400/10 shadow-[0_8px_24px_rgba(99,102,241,0.08)] backdrop-blur-md" />
        {/* Middle glassmorphic layer */}
        <div className="absolute inset-1.5 rounded-[20px] bg-linear-to-br from-white/10 to-white/0 dark:from-white/5 dark:to-white/0 border border-white/20 dark:border-zinc-800/60" />
        {/* Inner solid gradient badge */}
        <div className="absolute inset-3 rounded-[16px] bg-linear-to-br from-indigo-500 via-indigo-650 to-purple-600 flex items-center justify-center border border-white/20 dark:border-white/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4),0_4px_12px_rgba(99,102,241,0.3)]">
          {/* Custom vector-styled Indian Rupee SVG with gradient and drop shadow */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.2)]"
          >
            <path d="M6 3h12" />
            <path d="M6 8h12" />
            <path d="M6 3a6 6 0 0 1 0 12h5" />
            <path d="m9 15 8 8" />
          </svg>
        </div>
      </div>

      {/* Title & Options Row */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
            <TrendingDown className="w-5 h-5 stroke-[2]" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Total Expenses
            </span>
          </div>
        </div>
      </div>

      {/* Main Expenses Display */}
      <div className="flex flex-col gap-1 z-10 max-w-[60%]">
        <div className="flex items-baseline">
          <span className="text-3xl font-black tracking-tight leading-none text-zinc-900 dark:text-zinc-100 tabular-nums truncate">
            ₹
            {displayExpenses.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
        {/* Trend Indicator badge */}
        <div className="flex items-center gap-1.5 mt-1">
          <div className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
            <span className="scale-90 font-black">↓</span>
            <span>8.7%</span>
          </div>
          <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
            vs last month
          </span>
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
