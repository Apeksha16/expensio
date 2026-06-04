'use client';

import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react';
import { useFinanceStore } from '../../store/finance-store';
import { motion } from 'framer-motion';

export default function BalanceHeroCard() {
  const { expenses } = useFinanceStore();
  const [showBalance, setShowBalance] = useState(true);

  // Match the exact mockup numbers but keep it dynamic with user additions
  const mockIncome = 48200;
  const mockBaseExpenses = 23639;
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
      className="relative overflow-hidden rounded-[28px] bg-gradient-to-tr from-[#5d5fe6] via-[#6366f1] to-[#8b5cf6] p-6 text-white shadow-[0_20px_35px_rgba(99,102,241,0.22)] active:scale-[0.99] transition-all cursor-pointer group flex flex-col gap-6"
    >
      {/* Background Radial Glow */}
      <div className="absolute -right-10 -top-10 w-44 h-44 bg-[radial-gradient(circle,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />

      {/* Title & Toggle Row */}
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold text-white/70 uppercase tracking-widest">
          Total Balance
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowBalance(!showBalance);
          }}
          className="p-1 rounded-lg hover:bg-white/10 text-white/80 active:scale-95 transition-all outline-none border-0 bg-transparent cursor-pointer"
          title={showBalance ? 'Hide Balance' : 'Show Balance'}
        >
          {showBalance ? <Eye className="h-4.5 w-4.5" /> : <EyeOff className="h-4.5 w-4.5" />}
        </button>
      </div>

      {/* Main Balance Display */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-light text-white/70">₹</span>
        <span className="text-4xl font-extrabold tracking-tight tabular-nums">
          {showBalance
            ? displayBalance.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : '••••••'}
        </span>
      </div>

      {/* Income / Expense split row */}
      <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
        {/* Income column */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <ArrowUpRight className="h-4.5 w-4.5 text-emerald-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9.5px] font-bold text-white/60 uppercase tracking-wider">
              Income
            </span>
            <span className="text-sm font-extrabold tracking-tight tabular-nums">
              ₹{displayIncome.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Expenses column */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <ArrowDownRight className="h-4.5 w-4.5 text-rose-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9.5px] font-bold text-white/60 uppercase tracking-wider">
              Expenses
            </span>
            <span className="text-sm font-extrabold tracking-tight tabular-nums">
              ₹{displayExpenses.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
