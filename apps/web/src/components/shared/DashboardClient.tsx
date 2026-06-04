'use client';

import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store/finance-store';
import BalanceHeroCard from './BalanceHeroCard';
import QuickActions from './QuickActions';
import ExpenseCard from './ExpenseCard';
import BottomSheet from './BottomSheet';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  UtensilsCrossed,
  ShoppingBag,
  Plane,
  Flame,
  Zap,
  Camera,
  Check,
  Image as ImageIcon,
  Loader2,
  Upload,
  X,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const mockReceipts = [
  {
    merchant: 'Starbucks Coffee',
    amount: 320.0,
    category: 'Food',
    items: '1x Caramel Macchiato, 1x Butter Croissant ☕',
  },
  {
    merchant: 'Decathlon Sports',
    amount: 1899.0,
    category: 'Shopping',
    items: '1x Running Shoes, 2x Sports Socks 👟',
  },
  {
    merchant: 'Uber India',
    amount: 245.5,
    category: 'Transport',
    items: 'Ride from Airport to Hotel 🚗',
  },
  {
    merchant: 'PVR Cinemas',
    amount: 650.0,
    category: 'Entertainment',
    items: '2x Movie Tickets, 1x Popcorn Combo 🍿',
  },
];

export default function DashboardClient() {
  const { expenses, deleteExpense, editExpense, addExpense, setIsAddExpenseOpen } =
    useFinanceStore();
  const [tab, setTab] = useState('home');

  // Custom Category Dropdown Analytics Filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // Quick Action Customizer States
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [enabledActions, setEnabledActions] = useState<string[]>([
    'Add Expense',
    'Add Budget',
    'Scan Receipt',
    'Split Expense',
  ]);

  // Receipt Scanner States
  const [isReceiptScannerOpen, setIsReceiptScannerOpen] = useState(false);
  const [scanStep, setScanStep] = useState<'idle' | 'uploading' | 'review'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scannedExpense, setScannedExpense] = useState<{
    title: string;
    amount: string;
    category: string;
    note: string;
  } | null>(null);

  const handleMockReceiptSelect = (receipt: (typeof mockReceipts)[0]) => {
    setScanStep('uploading');
    setScanProgress(0);
    setScanStatusText('Uploading receipt image...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setScanProgress(progress);
      if (progress === 40) {
        setScanStatusText('Analyzing receipt layout with AI...');
      } else if (progress === 80) {
        setScanStatusText('Extracting items and total bill value...');
      } else if (progress >= 100) {
        clearInterval(interval);
        setScanStep('review');
        setScannedExpense({
          title: receipt.merchant,
          amount: receipt.amount.toString(),
          category: receipt.category,
          note: receipt.items,
        });
      }
    }, 300);
  };

  const handleScannedExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedExpense || !scannedExpense.title || !scannedExpense.amount) return;

    addExpense({
      title: scannedExpense.title,
      amount: Number(scannedExpense.amount),
      category: scannedExpense.category,
      date: new Date().toISOString().split('T')[0],
      note: scannedExpense.note,
      paidBy: 'me',
    });

    setIsReceiptScannerOpen(false);
    setScanStep('idle');
    setScannedExpense(null);
  };

  useEffect(() => {
    const currentTab =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('tab') || 'home'
        : 'home';
    if (currentTab !== tab) {
      setTab(currentTab);
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeDetailExpense, setActiveDetailExpense] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  // Loader duration matching mockup transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [tab]);

  // Calculations for base expenses
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

  // Skeletons
  if (isLoading) {
    return (
      <div className="space-y-6 pb-6 animate-pulse select-none">
        <div className="h-52 rounded-[28px] bg-zinc-100 dark:bg-zinc-900/40 border border-theme-border/60" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-900/60 rounded" />
          <div className="flex gap-3 overflow-hidden">
            <div className="h-12 w-28 bg-zinc-100 dark:bg-zinc-900/40 rounded-2xl shrink-0" />
            <div className="h-12 w-28 bg-zinc-100 dark:bg-zinc-900/40 rounded-2xl shrink-0" />
            <div className="h-12 w-28 bg-zinc-100 dark:bg-zinc-900/40 rounded-2xl shrink-0" />
          </div>
        </div>
        <div className="h-40 rounded-2xl bg-zinc-100 dark:bg-zinc-900/40 border border-theme-border/60" />
        <div className="space-y-3">
          <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900/40 border border-theme-border/60" />
          <div className="h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900/40 border border-theme-border/60" />
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER VIEW A: HOME DASHBOARD (tab=home)
  // ----------------------------------------------------
  let tabContent = null;

  if (tab === 'home') {
    const recentExpenses = expenses.filter((e) => !e.groupId).slice(0, 4);

    tabContent = (
      <div className="space-y-6 pb-6 select-none relative">
        {/* 1. Wallet Hero Card */}
        <BalanceHeroCard />

        {/* 2. Squircle Quick Actions */}
        <QuickActions
          onAddExpenseClick={() => setIsAddExpenseOpen(true)}
          onScanReceiptClick={() => setIsReceiptScannerOpen(true)}
          onCustomizeClick={() => setIsCustomizerOpen(true)}
          enabledActions={enabledActions}
        />

        {/* 3. AI Insights Premium Widget */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4.5 rounded-[22px] border border-indigo-500/10 bg-white dark:bg-zinc-900 shadow-[0_6px_18px_rgba(0,0,0,0.015)] relative overflow-hidden flex gap-3.5 border-theme-card-border"
        >
          <div className="absolute top-[-30%] right-[-10%] w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-4.5 h-4.5 stroke-[2.25]" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
                AI Smart Insight
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <p className="text-[11px] text-zinc-800 dark:text-zinc-300 font-semibold leading-relaxed">
              You spent{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">12% less</span> on
              food this week compared to last week.
            </p>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 mt-0.5 block">
              Track to save ₹350 this month! 🎉
            </span>
          </div>
        </motion.div>

        {/* 4. Spent Analysis Visual Categories Chart (Donut) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
              This Month Overview
            </h3>
            <Link
              href="/dashboard?tab=overview"
              className="text-[9.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="p-5 rounded-[26px] bg-white dark:bg-zinc-900 border border-theme-card-border shadow-[0_6px_20px_rgba(0,0,0,0.015)] flex items-center justify-between gap-5">
            {/* Donut Chart SVG */}
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(128,128,128,0.05)"
                  strokeWidth="8.5"
                />
                {segments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    className={seg.color}
                    strokeWidth="8.5"
                    strokeDasharray={`${seg.length} 251.2`}
                    strokeDashoffset={-seg.offset}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-[14px] font-extrabold text-zinc-100 dark:text-zinc-100 leading-none">
                  ₹{displayExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 leading-none mt-1">
                  Total Spent
                </span>
              </div>
            </div>

            {/* Labels Table Grid */}
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2.5 text-[9.5px] font-black uppercase tracking-wider">
              {[
                { label: 'Food', pct: '38%', sum: displayFood, color: 'bg-indigo-500' },
                { label: 'Shop', pct: '21%', sum: displayShopping, color: 'bg-emerald-500' },
                { label: 'Travel', pct: '16%', sum: displayTransport, color: 'bg-amber-500' },
                { label: 'Bills', pct: '12%', sum: displayBills, color: 'bg-rose-500' },
                { label: 'Others', pct: '13%', sum: displayOthers, color: 'bg-cyan-500' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 ${item.label === 'Others' ? 'col-span-2' : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                  <div className="flex flex-col">
                    <span className="text-zinc-700 dark:text-zinc-300 font-extrabold">
                      {item.label}
                    </span>
                    <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold lowercase tracking-normal">
                      {item.pct} · ₹{item.sum.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Recent Transactions Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
              Recent Expenses
            </h3>
            <Link
              href="/expenses"
              className="text-[9.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>See all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-theme-card-border rounded-[28px] overflow-hidden divide-y divide-zinc-100/50 dark:divide-zinc-800/40 px-3.5 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.015)]">
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
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER VIEW B: DETAILED ANALYTICS (tab=overview)
  // ----------------------------------------------------
  else if (tab === 'overview') {
    const periods = ['This Month', 'Last Month', '3 Months', 'Custom'];

    tabContent = (
      <div className="space-y-6 pb-6 select-none relative">
        {/* Horizontal Time Period Pills Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-4.5 py-2 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer border-0 outline-none ${
                selectedPeriod === p
                  ? 'bg-indigo-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.15)]'
                  : 'bg-white dark:bg-zinc-900 text-zinc-400 dark:text-zinc-400 border border-zinc-100 dark:border-zinc-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Spent Card Overhaul with Bar Chart */}
        <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.015)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">
                Total Spent
              </span>
              <span className="text-3xl font-black text-zinc-800 dark:text-white mt-1.5 leading-none">
                ₹24,063
              </span>
              <span className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5 mt-1.5 leading-none select-none">
                ▼ 8%{' '}
                <span className="font-semibold text-zinc-400 dark:text-zinc-500">
                  vs last month
                </span>
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-300 flex items-center gap-1 cursor-pointer bg-white dark:bg-zinc-950 active:scale-95 transition-all select-none"
              >
                <span>
                  {selectedCategoryFilter === 'All' ? 'Category' : selectedCategoryFilter}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {isCategoryDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsCategoryDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-36 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 shadow-lg z-50 flex flex-col gap-0.5"
                    >
                      {['All', 'Food', 'Shopping', 'Travel', 'Bills', 'Others'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategoryFilter(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors select-none ${
                            selectedCategoryFilter === cat
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900/60'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Visual Vertical Bar Chart */}
          <div className="flex h-44 mt-2 relative select-none">
            {/* Y Axis Labels */}
            <div className="flex flex-col justify-between h-36 text-[8px] font-bold text-zinc-400 dark:text-zinc-550 text-right w-8 pr-2 select-none z-10">
              <span>₹10K</span>
              <span>₹7.5K</span>
              <span>₹5K</span>
              <span>₹2.5K</span>
              <span>₹0</span>
            </div>

            {/* Grid Container */}
            <div className="flex-1 h-36 relative flex justify-around items-end border-l border-b border-zinc-800/60 dark:border-zinc-800/80 pb-0.5 z-10">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40 dark:opacity-20 z-0">
                <div className="border-t border-dashed border-zinc-200 dark:border-zinc-850 w-full" />
                <div className="border-t border-dashed border-zinc-200 dark:border-zinc-850 w-full" />
                <div className="border-t border-dashed border-zinc-200 dark:border-zinc-850 w-full" />
                <div className="border-t border-dashed border-zinc-200 dark:border-zinc-850 w-full" />
              </div>

              {/* Individual Bar segments */}
              {[
                {
                  label: 'Food',
                  amount: '₹9,144',
                  height: '91.4%',
                  color: 'bg-indigo-500 dark:bg-indigo-400',
                  key: 'Food',
                },
                {
                  label: 'Shop',
                  amount: '₹5,053',
                  height: '50.5%',
                  color: 'bg-emerald-500 dark:bg-emerald-400',
                  key: 'Shopping',
                },
                {
                  label: 'Travel',
                  amount: '₹3,850',
                  height: '38.5%',
                  color: 'bg-amber-500 dark:bg-amber-400',
                  key: 'Travel',
                },
                {
                  label: 'Bills',
                  amount: '₹2,888',
                  height: '28.8%',
                  color: 'bg-rose-500 dark:bg-rose-400',
                  key: 'Bills',
                },
                {
                  label: 'Others',
                  amount: '₹3,128',
                  height: '31.2%',
                  color: 'bg-zinc-400 dark:bg-zinc-650',
                  key: 'Others',
                },
              ].map((bar, idx) => {
                const isDimmed =
                  selectedCategoryFilter !== 'All' && selectedCategoryFilter !== bar.key;
                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-end h-full w-10 z-10 group transition-opacity duration-300 ${
                      isDimmed ? 'opacity-25' : 'opacity-100'
                    }`}
                  >
                    <span className="text-[7.5px] font-black text-zinc-700 dark:text-zinc-300 mb-1 leading-none scale-90 select-none">
                      {bar.amount}
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: bar.height }}
                      transition={{ duration: 0.7, ease: 'easeOut', delay: idx * 0.08 }}
                      className={`w-4.5 rounded-t-md ${bar.color} shadow-xs relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/10" />
                    </motion.div>
                    <span className="text-[8.5px] font-extrabold text-zinc-400 dark:text-zinc-500 mt-2 leading-none uppercase select-none">
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Expenses List with customized mockup list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
              Recent Expenses
            </h3>
            <Link
              href="/expenses"
              className="text-[9.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>See all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[28px] overflow-hidden divide-y divide-zinc-100/50 dark:divide-zinc-800/40 px-3.5 py-1.5 shadow-[0_6px_18px_rgba(0,0,0,0.015)]">
            {[
              {
                title: "McDonald's",
                date: 'May 26',
                category: 'Food',
                amount: -25.5,
                initial: 'M',
                bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
              },
              {
                title: 'Starbucks',
                date: 'May 26',
                category: 'Food',
                amount: -4.25,
                initial: 'S',
                bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
              },
              {
                title: 'Fuel',
                date: 'May 25',
                category: 'Travel',
                amount: -35.2,
                initial: 'F',
                bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
              },
              {
                title: 'Uber Ride',
                date: 'May 25',
                category: 'Travel',
                amount: -12.4,
                initial: 'U',
                bg: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
              },
            ].filter((exp) => {
              if (selectedCategoryFilter === 'All') return true;
              if (selectedCategoryFilter === 'Others') {
                return (
                  exp.category !== 'Food' &&
                  exp.category !== 'Travel' &&
                  exp.category !== 'Shopping' &&
                  exp.category !== 'Bills'
                );
              }
              return exp.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
            }).length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-bold select-none">
                No recent expenses for this category.
              </div>
            ) : (
              [
                {
                  title: "McDonald's",
                  date: 'May 26',
                  category: 'Food',
                  amount: -25.5,
                  initial: 'M',
                  bg: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
                },
                {
                  title: 'Starbucks',
                  date: 'May 26',
                  category: 'Food',
                  amount: -4.25,
                  initial: 'S',
                  bg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
                },
                {
                  title: 'Fuel',
                  date: 'May 25',
                  category: 'Travel',
                  amount: -35.2,
                  initial: 'F',
                  bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
                },
                {
                  title: 'Uber Ride',
                  date: 'May 25',
                  category: 'Travel',
                  amount: -12.4,
                  initial: 'U',
                  bg: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20',
                },
              ]
                .filter((exp) => {
                  if (selectedCategoryFilter === 'All') return true;
                  if (selectedCategoryFilter === 'Others') {
                    return (
                      exp.category !== 'Food' &&
                      exp.category !== 'Travel' &&
                      exp.category !== 'Shopping' &&
                      exp.category !== 'Bills'
                    );
                  }
                  return exp.category.toLowerCase() === selectedCategoryFilter.toLowerCase();
                })
                .map((exp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-3.5 group cursor-pointer active:scale-99 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${exp.bg}`}
                      >
                        {exp.initial}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11.5px] font-extrabold text-zinc-855 dark:text-zinc-200">
                          {exp.title}
                        </span>
                        <span className="text-[8.5px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
                          {exp.date} · {exp.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-600 dark:text-rose-500 font-semibold leading-none tabular-nums">
                        -₹{Math.abs(exp.amount).toFixed(2)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Budget Progress Horizontal Carousel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
              Budget Progress
            </h3>
            <Link
              href="/budgets"
              className="text-[9.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none select-none">
            {/* Budget Card 1 */}
            <div className="w-[144px] p-4.5 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xs shrink-0 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7.5 h-7.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Food
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11.5px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                  ₹3,856{' '}
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-550">
                    / ₹6,000
                  </span>
                </span>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full"
                    style={{ width: '64%' }}
                  />
                </div>
                <div className="flex justify-end">
                  <span className="text-[8.5px] font-black text-indigo-600 dark:text-indigo-400">
                    64%
                  </span>
                </div>
              </div>
            </div>

            {/* Budget Card 2 */}
            <div className="w-[144px] p-4.5 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xs shrink-0 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7.5 h-7.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Shopping
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11.5px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                  ₹2,250{' '}
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-550">
                    / ₹4,000
                  </span>
                </span>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full"
                    style={{ width: '56%' }}
                  />
                </div>
                <div className="flex justify-end">
                  <span className="text-[8.5px] font-black text-emerald-600 dark:text-emerald-400">
                    56%
                  </span>
                </div>
              </div>
            </div>

            {/* Budget Card 3 */}
            <div className="w-[144px] p-4.5 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xs shrink-0 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7.5 h-7.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Plane className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                  Travel
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11.5px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                  ₹1,200{' '}
                  <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-550">
                    / ₹3,000
                  </span>
                </span>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 dark:bg-amber-450 rounded-full"
                    style={{ width: '40%' }}
                  />
                </div>
                <div className="flex justify-end">
                  <span className="text-[8.5px] font-black text-amber-600 dark:text-amber-450">
                    40%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* You're doing great Congratulations Banner Card */}
        <div className="p-4.5 rounded-[26px] bg-gradient-to-r from-[#5d5fe6] via-[#6366f1] to-[#8b5cf6] text-white relative overflow-hidden flex items-center justify-between shadow-[0_12px_24px_rgba(99,102,241,0.2)]">
          <div className="absolute right-[-10%] top-[-30%] w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3.5 z-10">
            {/* Abstract gold coin SVG badge */}
            <div className="w-11 h-11 rounded-2xl bg-white/12 border border-white/15 flex items-center justify-center shrink-0 shadow-inner select-none">
              <Sparkles className="w-5.5 h-5.5 text-amber-300 stroke-[2.25] animate-pulse" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11.5px] font-black tracking-wide leading-none">
                You're doing great! 🎉
              </span>
              <span className="text-[9.5px] text-white/80 font-bold mt-1.5 leading-snug">
                Your total spending is 8% lower
                <br />
                than last month.
              </span>
            </div>
          </div>

          <button
            onClick={() => alert('Detailed insight report loaded')}
            className="w-9 h-9 rounded-full bg-white text-[#6366f1] flex items-center justify-center shrink-0 active:scale-90 hover:scale-105 transition-all shadow-md border-0 cursor-pointer z-10"
            aria-label="View deep report details"
          >
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER VIEW C: INSIGHTS AI ANALYSIS (tab=insights)
  // ----------------------------------------------------
  else if (tab === 'insights') {
    tabContent = (
      <div className="space-y-6 pb-6 select-none relative">
        <div className="flex flex-col gap-1 px-1">
          <h2 className="text-base font-black text-zinc-900 dark:text-white leading-none">
            Deep AI Analysis
          </h2>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider mt-1.5">
            Personalized saving directives & predictions
          </p>
        </div>

        {/* Prediction 1 Card */}
        <div className="p-4.5 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-800/60 dark:border-zinc-800 flex gap-4 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 w-12 h-12 bg-rose-500/5 rounded-full blur-md pointer-events-none" />
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-600 dark:text-rose-500 shrink-0">
            <Flame className="w-4.5 h-4.5 stroke-[2.25]" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-500">
              High Risk Alert
            </span>
            <span className="text-[11.5px] font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-snug">
              Food Budget Overflow Predicted
            </span>
            <p className="text-[10.5px] text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed mt-1">
              Based on your coffee and restaurant spend rate of{' '}
              <span className="font-bold text-zinc-800 dark:text-white">₹780/day</span>, you are
              projected to exceed your food limit by{' '}
              <span className="text-rose-600 dark:text-rose-500 font-bold">₹1,850</span> in 6 days.
            </p>
          </div>
        </div>

        {/* Suggestion 2 Card */}
        <div className="p-4.5 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-800/60 dark:border-zinc-800 flex gap-4 shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-md pointer-events-none" />
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Zap className="w-4.5 h-4.5 stroke-[2.25]" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Saving Suggestion
            </span>
            <span className="text-[11.5px] font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 leading-snug">
              Reduce Streaming Services
            </span>
            <p className="text-[10.5px] text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed mt-1">
              You are paying for 3 concurrent media subscriptions. Canceling one unused service
              would automatically save you{' '}
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">₹1,990/year</span>.
            </p>
          </div>
        </div>

        {/* Comparison Metric Box */}
        <div className="p-5 rounded-[26px] bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-900 flex flex-col gap-4">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 leading-none">
            Weekly Breakdown Comparison
          </span>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                This Week
              </span>
              <span className="text-base font-black text-zinc-850 dark:text-white">₹4,820</span>
              <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                -14% vs last week
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex flex-col gap-1">
              <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                Last Week
              </span>
              <span className="text-base font-black text-zinc-855 dark:text-white">₹5,604</span>
              <span className="text-[8px] font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                +4% vs preceding
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {tabContent}

      {/* 1. Detail View bottom sheet */}
      <BottomSheet
        isOpen={activeDetailExpense !== null}
        onClose={() => setActiveDetailExpense(null)}
        title="Expense Details"
      >
        {activeDetailExpense && (
          <div className="space-y-6 select-none">
            <div className="p-5 rounded-3xl border border-zinc-200/60 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between shadow-xs">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest leading-none">
                  Total Value
                </span>
                <span className="text-3xl font-black text-zinc-800 dark:text-white mt-1.5 leading-none">
                  ₹{activeDetailExpense.amount.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full shrink-0">
                {activeDetailExpense.category}
              </span>
            </div>

            <div className="rounded-2xl border border-zinc-200/50 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/20 p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/60 dark:border-zinc-800/60 text-xs">
                <span className="font-semibold text-zinc-400 dark:text-zinc-500">
                  Merchant Name
                </span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                  {activeDetailExpense.title}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/60 dark:border-zinc-800/60 text-xs">
                <span className="font-semibold text-zinc-400 dark:text-zinc-500">Date</span>
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                  {new Date(activeDetailExpense.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/60 dark:border-zinc-800/60 text-xs">
                <span className="font-semibold text-zinc-400 dark:text-zinc-500">
                  Payment Method
                </span>
                <span className="font-extrabold text-zinc-855 dark:text-zinc-200">
                  {activeDetailExpense.paymentMethod || 'UPI / Cash'}
                </span>
              </div>
              {activeDetailExpense.note && (
                <div className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-zinc-400 dark:text-zinc-500">Notes</span>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold leading-relaxed border border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 px-3 py-2 rounded-xl">
                    {activeDetailExpense.note}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <button
                onClick={() => {
                  deleteExpense(activeDetailExpense.id);
                  setActiveDetailExpense(null);
                }}
                className="w-full py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 font-bold border border-rose-500/20 active:scale-98 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                Delete Expense
              </button>
              <button
                onClick={() => {
                  setActiveDetailExpense(null);
                }}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer shadow-md select-none border-0"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* 2. Quick Action Customizer bottom sheet */}
      <BottomSheet
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        title="Customize Quick Actions"
      >
        <div className="space-y-5 select-none">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550 block mb-2 px-1">
            Toggle Dashboard Shortcuts
          </span>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-4 shadow-sm">
            {[
              { label: 'Add Expense', desc: 'Log bills and payouts manually' },
              { label: 'Add Budget', desc: 'Set monthly limits for category scopes' },
              { label: 'Scan Receipt', desc: 'Extract items from paper invoices' },
              { label: 'Split Expense', desc: 'Distribute costs in joined groups' },
            ].map((action) => {
              const isEnabled = enabledActions.includes(action.label);
              return (
                <div
                  key={action.label}
                  className="flex items-center justify-between pb-3.5 last:pb-0 border-b last:border-0 border-zinc-200/50 dark:border-zinc-800/60"
                >
                  <div className="flex flex-col gap-0.5 max-w-[75%]">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {action.label}
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium leading-tight">
                      {action.desc}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (isEnabled) {
                        setEnabledActions(enabledActions.filter((a) => a !== action.label));
                      } else {
                        setEnabledActions([...enabledActions, action.label]);
                      }
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${
                      isEnabled
                        ? 'bg-indigo-600 justify-end'
                        : 'bg-zinc-300 dark:bg-zinc-850 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => setIsCustomizerOpen(false)}
            className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer shadow-md select-none border-0"
          >
            Apply Changes
          </button>
        </div>
      </BottomSheet>

      {/* 3. Receipt Scanner bottom sheet */}
      <BottomSheet
        isOpen={isReceiptScannerOpen}
        onClose={() => {
          setIsReceiptScannerOpen(false);
          setScanStep('idle');
          setScannedExpense(null);
        }}
        title="Smart Receipt Scanner"
      >
        {scanStep === 'idle' && (
          <div className="space-y-6 select-none">
            <div className="p-8 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col items-center justify-center gap-4 text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <Camera className="w-7 h-7 stroke-[2.25]" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Upload receipt image
                </span>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                  Drag and drop files, browse gallery, or capture live photos to initiate OCR
                  parsing
                </p>
              </div>
              <div className="flex gap-2.5 mt-2 justify-center">
                <button
                  type="button"
                  onClick={() => handleMockReceiptSelect(mockReceipts[0])}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 dark:bg-zinc-900 border border-zinc-800 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-650 dark:text-zinc-350 cursor-pointer flex items-center gap-1 hover:bg-zinc-200"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Gallery</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMockReceiptSelect(mockReceipts[2])}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 dark:bg-zinc-900 border border-zinc-800 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-650 dark:text-zinc-350 cursor-pointer flex items-center gap-1 hover:bg-zinc-200"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1">
                Try standard mock samples
              </span>
              <div className="grid grid-cols-2 gap-3">
                {mockReceipts.map((receipt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleMockReceiptSelect(receipt)}
                    className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition-all text-left flex flex-col gap-1 cursor-pointer shadow-xs"
                  >
                    <span className="text-[10.5px] font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                      {receipt.merchant}
                    </span>
                    <span className="text-xs font-black text-indigo-605 dark:text-indigo-400 mt-1">
                      ₹{receipt.amount.toFixed(2)}
                    </span>
                    <span className="text-[8px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mt-1">
                      {receipt.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {scanStep === 'uploading' && (
          <div className="py-12 flex flex-col items-center justify-center gap-5 text-center select-none">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin stroke-[2.5]" />
              <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                {scanStatusText}
              </span>
              <div className="w-48 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mx-auto mt-2">
                <motion.div
                  className="h-full bg-indigo-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold block">
                {scanProgress}% completed
              </span>
            </div>
          </div>
        )}

        {scanStep === 'review' && scannedExpense && (
          <form onSubmit={handleScannedExpenseSubmit} className="space-y-5">
            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3 select-none">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center shrink-0">
                <Check className="w-4.5 h-4.5 stroke-[3]" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-450 leading-none">
                  Scanning complete
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed mt-1">
                  AI has successfully extracted total sum, items, and merchant information. Please
                  verify below.
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550 px-1">
                    Merchant
                  </label>
                  <input
                    type="text"
                    value={scannedExpense.title}
                    onChange={(e) =>
                      setScannedExpense({ ...scannedExpense, title: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs font-semibold text-zinc-850 dark:text-zinc-100 placeholder:text-zinc-550 transition-colors"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550 px-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={scannedExpense.amount}
                    onChange={(e) =>
                      setScannedExpense({ ...scannedExpense, amount: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs font-semibold text-zinc-850 dark:text-zinc-100 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550 px-1">
                  Category
                </label>
                <select
                  value={scannedExpense.category}
                  onChange={(e) =>
                    setScannedExpense({ ...scannedExpense, category: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-zinc-105/85 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs font-semibold text-zinc-850 dark:text-zinc-100 transition-colors"
                >
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Travel">Travel</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills">Bills</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550 px-1">
                  Extracted Items Description
                </label>
                <textarea
                  value={scannedExpense.note}
                  onChange={(e) => setScannedExpense({ ...scannedExpense, note: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-105/85 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs font-semibold text-zinc-850 dark:text-zinc-100 min-h-[60px] max-h-[100px] resize-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer shadow-md select-none border-0"
            >
              Confirm & Save Expense
            </button>
          </form>
        )}
      </BottomSheet>
    </>
  );
}
