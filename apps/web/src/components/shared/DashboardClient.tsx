'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useFinanceStore } from '../../store/finance-store';
import BalanceHeroCard from './BalanceHeroCard';
import QuickActions from './QuickActions';
import ExpenseCard from './ExpenseCard';
import BottomSheet from './BottomSheet';
import { useDashboardSummary } from '../../hooks/useDashboard';
import { useAnalyticsSummary, useHealthScore } from '../../hooks/useAnalytics';
import {
  useExpenses,
  useCreateExpense,
  useDeleteExpense,
  mapAPIExpenseToStoreExpense,
} from '../../hooks/useExpenses';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  UtensilsCrossed,
  ShoppingBag,
  Plane,
  Camera,
  Check,
  Loader2,
  Upload,
  X,
  Plus,
  HelpCircle,
  Car,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  const {
    setIsAddExpenseOpen,
    selectedPeriod,
    setSelectedPeriod,
    isCalendarFilterOpen,
    setIsCalendarFilterOpen,
    customStartDate,
    customEndDate,
    setCustomDateRange,
  } = useFinanceStore();
  const searchParams = useSearchParams();
  const urlTab = searchParams?.get('tab') || 'home';
  const [tab, setTab] = useState(urlTab);

  useEffect(() => {
    if (urlTab && urlTab !== tab) {
      setTab(urlTab);
    }
  }, [urlTab, tab]);
  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }; // Custom Category Dropdown Analytics Filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  // React Query Hooks & Mutations
  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();
  const createExpenseMutation = useCreateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  // Dynamic date range calculation
  const now = new Date();
  let analyticsFilters: { startDate?: string; endDate?: string } = {};

  if (selectedPeriod === 'This Month') {
    analyticsFilters = {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
    };
  } else if (selectedPeriod === 'Last Month') {
    analyticsFilters = {
      startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0],
      endDate: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0],
    };
  } else if (selectedPeriod === '3 Months') {
    analyticsFilters = {
      startDate: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0],
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
    };
  } else if (selectedPeriod === 'Custom') {
    if (customStartDate) analyticsFilters.startDate = customStartDate;
    if (customEndDate) analyticsFilters.endDate = customEndDate;
  }

  const { data: analyticsData, isLoading: isAnalyticsLoading } =
    useAnalyticsSummary(analyticsFilters);
  const { data: healthData, isLoading: isHealthLoading } = useHealthScore();
  const { data: expensesData, isLoading: isExpensesLoading } = useExpenses({
    limit: 5,
    category: selectedCategoryFilter !== 'All' ? selectedCategoryFilter : undefined,
    startDate: analyticsFilters.startDate,
    endDate: analyticsFilters.endDate,
  });

  const liveExpenses = expensesData?.expenses || [];

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

    createExpenseMutation.mutate(
      {
        amount: Number(scannedExpense.amount),
        category: scannedExpense.category as any,
        paymentMethod: 'UPI',
        date: new Date().toISOString().split('T')[0],
        note: scannedExpense.title,
      },
      {
        onSuccess: (newExp) => {
          // Store update removed, using React Query invalidation in hook

          showToast('Receipt logged successfully!');
        },
        onError: (err) => {
          showToast(err.message || 'Failed to save expense');
        },
      }
    );

    setIsReceiptScannerOpen(false);
    setScanStep('idle');
    setScannedExpense(null);
  };

  const [activeDetailExpense, setActiveDetailExpense] = useState<any>(null);

  const apiRecentExpenses = useMemo(() => {
    return summary?.recentExpenses ? summary.recentExpenses.map(mapAPIExpenseToStoreExpense) : [];
  }, [summary?.recentExpenses]);

  const handleDeleteExpense = useCallback(
    (id: string) => {
      deleteExpenseMutation.mutate(id, {
        onSuccess: () => showToast('Expense deleted successfully!'),
        onError: (err) => showToast(err.message || 'Failed to delete expense'),
      });
    },
    [deleteExpenseMutation]
  );

  const handleEditExpense = useCallback((exp: any) => {
    setActiveDetailExpense(exp);
  }, []);

  // No global loading lock - let components render conditionally or gracefully handling undefined

  // ----------------------------------------------------
  // RENDER VIEW A: HOME DASHBOARD (tab=home)
  // ----------------------------------------------------
  let tabContent = null;

  if (tab === 'home') {
    const isDashboardEmpty = !summary || summary.totalTransactions === 0;

    tabContent = (
      <div className="space-y-6 pb-6 select-none relative">
        {/* 1. Wallet Hero Card */}
        <BalanceHeroCard />

        {/* 2. Squircle Quick Actions */}
        <QuickActions
          onAddExpenseClick={() => setIsAddExpenseOpen(true)}
          onScanReceiptClick={() => setIsReceiptScannerOpen(true)}
        />

        {isDashboardEmpty ? (
          /* Premium Onboarding Empty State Card */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-805/50 shadow-[0_6px_20px_rgba(0,0,0,0.015)] flex flex-col items-center text-center gap-4.5"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-650 dark:text-indigo-400 shrink-0">
              <Sparkles className="w-7 h-7 stroke-[2.25]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-100 uppercase tracking-wide">
                Welcome to Expensio! 🚀
              </h3>
              <p className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-500 max-w-xs leading-relaxed">
                Track your monthly salary, analyze spending categories, and get real-time financial
                insights. Add your first expense or configure your monthly salary in settings to get
                started!
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(true)}
                className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg active:scale-97 transition-all cursor-pointer border-0"
              >
                Add Expense
              </button>
              <Link
                href="/settings"
                className="flex-1 py-3.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-black text-[10px] font-black uppercase tracking-widest text-center active:scale-97 transition-all flex items-center justify-center"
              >
                Set Salary
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            {/* 4. Budget Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-[28px] bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-600 text-white shadow-lg relative overflow-hidden flex flex-col gap-4 border border-indigo-400/20"
            >
              <div className="absolute top-[-30%] right-[-10%] w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-100">
                  Monthly Spending Limit
                </span>
                <Link href="/settings">
                  <ChevronRight className="w-4 h-4 text-indigo-100 hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <span className="text-[10px] font-bold text-indigo-100/80 leading-none">
                This calendar month
              </span>

              {/* Semicircular SVG progress ring */}
              <div className="relative w-44 h-24 mx-auto flex flex-col items-center justify-end select-none mt-2">
                <svg viewBox="0 0 100 60" className="w-full h-full">
                  {/* Background Track */}
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Foreground Progress */}
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="125.6"
                    strokeDashoffset={125.6 * (1 - Math.min(100, summary.spendingPercentage) / 100)}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute bottom-1 flex flex-col items-center text-center">
                  <span className="text-xl font-black text-white leading-none">
                    {summary.spendingPercentage}%
                  </span>
                  <span className="text-[8px] font-bold text-indigo-100/90 leading-none mt-1">
                    {summary.monthlySalary > 0
                      ? `of ₹${summary.monthlySalary.toLocaleString('en-IN')}`
                      : 'Salary not set'}
                  </span>
                </div>
              </div>

              {/* Bottom Labels */}
              <div className="flex justify-between items-center text-[10px] font-bold text-indigo-100 mt-2 px-1">
                <div className="flex flex-col">
                  <span className="text-white font-black text-xs">
                    ₹
                    {summary.totalExpenses.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    spent
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-white font-black text-xs">
                    {summary.monthlySalary > 0
                      ? `₹${summary.remainingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left`
                      : 'Setup salary in settings'}
                  </span>
                </div>
              </div>

              <div className="h-px bg-white/10 my-1" />

              <Link
                href="/settings"
                className="text-[10px] font-black uppercase tracking-widest text-center text-white hover:underline mt-0.5"
              >
                Configure Salary Settings
              </Link>
            </motion.div>

            {/* Financial Health Widget */}
            {!isHealthLoading && healthData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        healthData.score >= 80
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : healthData.score >= 60
                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                            : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-theme-text">
                        Financial Health
                      </h3>
                      <p
                        className={`text-[10px] font-bold ${
                          healthData.score >= 80
                            ? 'text-emerald-500'
                            : healthData.score >= 60
                              ? 'text-indigo-500'
                              : 'text-rose-500'
                        }`}
                      >
                        {healthData.riskLevel}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-theme-text">{healthData.score}</span>
                    <span className="text-[10px] font-bold text-theme-secondary">/100</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-2.5 text-center flex flex-col items-center justify-center border border-zinc-100 dark:border-zinc-850">
                    <span className="text-[9px] font-black uppercase text-theme-secondary mb-1">
                      Savings
                    </span>
                    <span className="text-[11px] font-bold text-theme-text">
                      {healthData.metrics.savingsRate}%
                    </span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-2.5 text-center flex flex-col items-center justify-center border border-zinc-100 dark:border-zinc-850">
                    <span className="text-[9px] font-black uppercase text-theme-secondary mb-1">
                      Budget
                    </span>
                    <span className="text-[11px] font-bold text-theme-text">
                      {healthData.metrics.budgetDiscipline}%
                    </span>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-2.5 text-center flex flex-col items-center justify-center border border-zinc-100 dark:border-zinc-850">
                    <span className="text-[9px] font-black uppercase text-theme-secondary mb-1">
                      Subs
                    </span>
                    <span className="text-[11px] font-bold text-theme-text">
                      {healthData.metrics.subscriptionBurden}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. Recent Transactions Feed */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
                  Recent Transactions
                </h3>
                <Link
                  href="/expenses"
                  className="text-[9.5px] font-black uppercase tracking-wider text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>See all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                {apiRecentExpenses.length === 0 ? (
                  <div className="p-8 text-center text-xs text-zinc-550 font-bold bg-white dark:bg-zinc-900 border border-theme-card-border rounded-[28px]">
                    No transactions found.
                  </div>
                ) : (
                  apiRecentExpenses
                    .slice(0, 5)
                    .map((expense) => (
                      <ExpenseCard
                        key={expense.id}
                        expense={expense}
                        onDelete={handleDeleteExpense}
                        onEdit={handleEditExpense}
                        onTap={handleEditExpense}
                      />
                    ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER VIEW B: DETAILED ANALYTICS (tab=overview)
  // ----------------------------------------------------
  else if (tab === 'overview') {
    const periods = ['This Month', 'Last Month', '3 Months', 'Custom'];

    const totalSpentPeriod = analyticsData?.summary.currentMonthSpend ?? 0;
    const spendChangePercentage = analyticsData?.summary.spendChangePercentage ?? 0;

    const chartData = useMemo(() => {
      const getCategoryAmount = (cat: string) => {
        const found = analyticsData?.categoryBreakdown?.find((c) => c.category === cat);
        return found ? found.amount : 0;
      };

      const foodSum = getCategoryAmount('Food');
      const shoppingSum = getCategoryAmount('Shopping');
      const travelSum = getCategoryAmount('Travel') + getCategoryAmount('Transport');
      const billsSum =
        getCategoryAmount('Bills') +
        getCategoryAmount('Bills & Utilities') +
        getCategoryAmount('Rent') +
        getCategoryAmount('Credit Card') +
        getCategoryAmount('Utilities');
      const othersSum =
        getCategoryAmount('Others') +
        getCategoryAmount('Health') +
        getCategoryAmount('Entertainment') +
        getCategoryAmount('Education') +
        getCategoryAmount('Gifts') +
        getCategoryAmount('Udhaari');

      const maxCategorySum = Math.max(foodSum, shoppingSum, travelSum, billsSum, othersSum, 1);

      const foodHeight = `${Math.max(10, Math.round((foodSum / maxCategorySum) * 100))}%`;
      const shoppingHeight = `${Math.max(10, Math.round((shoppingSum / maxCategorySum) * 100))}%`;
      const travelHeight = `${Math.max(10, Math.round((travelSum / maxCategorySum) * 100))}%`;
      const billsHeight = `${Math.max(10, Math.round((billsSum / maxCategorySum) * 100))}%`;
      const othersHeight = `${Math.max(10, Math.round((othersSum / maxCategorySum) * 100))}%`;

      const yAxisLabel5 = `₹${Math.round(maxCategorySum).toLocaleString('en-IN')}`;
      const yAxisLabel4 = `₹${Math.round(maxCategorySum * 0.75).toLocaleString('en-IN')}`;
      const yAxisLabel3 = `₹${Math.round(maxCategorySum * 0.5).toLocaleString('en-IN')}`;
      const yAxisLabel2 = `₹${Math.round(maxCategorySum * 0.25).toLocaleString('en-IN')}`;

      return {
        foodSum,
        shoppingSum,
        travelSum,
        billsSum,
        othersSum,
        foodHeight,
        shoppingHeight,
        travelHeight,
        billsHeight,
        othersHeight,
        yAxisLabel5,
        yAxisLabel4,
        yAxisLabel3,
        yAxisLabel2,
      };
    }, [analyticsData]);

    const displayListExpenses = liveExpenses.slice(0, 4);

    const categoryStyles: Record<string, { bg: string; text: string; icon: any }> = {
      Food: {
        bg: 'bg-indigo-500/10 border-indigo-500/20',
        text: 'text-indigo-650 dark:text-indigo-400',
        icon: UtensilsCrossed,
      },
      Shopping: {
        bg: 'bg-pink-500/10 border-pink-500/20',
        text: 'text-pink-600',
        icon: ShoppingBag,
      },
      Travel: { bg: 'bg-cyan-500/10 border-cyan-500/20', text: 'text-cyan-600', icon: Plane },
      Transport: { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-600', icon: Car },
      Bills: { bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-600', icon: Zap },
      'Bills & Utilities': {
        bg: 'bg-rose-500/10 border-rose-500/20',
        text: 'text-rose-600',
        icon: Zap,
      },
      Others: {
        bg: 'bg-zinc-500/10 border-zinc-500/20',
        text: 'text-zinc-700 dark:text-zinc-300',
        icon: HelpCircle,
      },
    };

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
              <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest leading-none">
                Total Spent
              </span>
              <span className="text-3xl font-black text-zinc-800 dark:text-zinc-100 mt-1.5 leading-none">
                ₹{totalSpentPeriod.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              {spendChangePercentage !== 0 ? (
                <span
                  className={`text-[9.5px] font-bold flex items-center gap-0.5 mt-1.5 leading-none select-none ${spendChangePercentage < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                >
                  {spendChangePercentage < 0 ? '▼' : '▲'} {Math.abs(spendChangePercentage)}%{' '}
                  <span className="font-semibold text-zinc-400 dark:text-zinc-550">
                    vs last month
                  </span>
                </span>
              ) : (
                <span className="text-[9.5px] text-zinc-500 font-bold flex items-center gap-0.5 mt-1.5 leading-none select-none">
                  Comparison unavailable
                </span>
              )}
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
                      className="absolute right-0 mt-2 w-36 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-955 p-1.5 shadow-lg z-50 flex flex-col gap-0.5"
                    >
                      {['All', 'Food', 'Shopping', 'Travel', 'Bills', 'Others'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategoryFilter(cat);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors select-none border-0 ${
                            selectedCategoryFilter === cat
                              ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
                              : 'text-zinc-600 dark:text-zinc-400 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
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
              <span>{chartData.yAxisLabel5}</span>
              <span>{chartData.yAxisLabel4}</span>
              <span>{chartData.yAxisLabel3}</span>
              <span>{chartData.yAxisLabel2}</span>
              <span>₹0</span>
            </div>

            {/* Grid Container */}
            <div className="flex-1 h-36 relative flex justify-around items-end border-l border-b border-zinc-200/50 dark:border-zinc-800/80 pb-0.5 z-10">
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
                  amount: `₹${Math.round(chartData.foodSum).toLocaleString()}`,
                  height: chartData.foodHeight,
                  color: 'bg-indigo-500 dark:bg-indigo-400',
                  key: 'Food',
                },
                {
                  label: 'Shop',
                  amount: `₹${Math.round(chartData.shoppingSum).toLocaleString()}`,
                  height: chartData.shoppingHeight,
                  color: 'bg-emerald-500 dark:bg-emerald-400',
                  key: 'Shopping',
                },
                {
                  label: 'Travel',
                  amount: `₹${Math.round(chartData.travelSum).toLocaleString()}`,
                  height: chartData.travelHeight,
                  color: 'bg-amber-500 dark:bg-amber-400',
                  key: 'Travel',
                },
                {
                  label: 'Bills',
                  amount: `₹${Math.round(chartData.billsSum).toLocaleString()}`,
                  height: chartData.billsHeight,
                  color: 'bg-rose-500 dark:bg-rose-400',
                  key: 'Bills',
                },
                {
                  label: 'Others',
                  amount: `₹${Math.round(chartData.othersSum).toLocaleString()}`,
                  height: chartData.othersHeight,
                  color: 'bg-zinc-450 dark:bg-zinc-650',
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
                    <div
                      style={{ height: bar.height }}
                      className={`w-4.5 rounded-t-md ${bar.color} shadow-xs relative overflow-hidden transition-all duration-700 ease-out`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-white/0 to-white/10" />
                    </div>
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
            {displayListExpenses.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500 font-bold select-none">
                No recent expenses for this category.
              </div>
            ) : (
              displayListExpenses.map((exp, idx) => {
                const style = categoryStyles[exp.category] || categoryStyles['Others'];
                const Icon = style.icon;
                const formattedDate = new Date(exp.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveDetailExpense(exp)}
                    className="flex items-center justify-between py-3.5 group cursor-pointer active:scale-99 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${style.bg}`}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11.5px] font-extrabold text-zinc-850 dark:text-zinc-200">
                          {exp.title}
                        </span>
                        <span className="text-[8.5px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
                          {formattedDate} · {exp.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-600 dark:text-rose-500 leading-none tabular-nums">
                        -₹{Math.abs(exp.amount).toFixed(2)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Budget Progress Horizontal Carousel — powered by real API data */}
        {summary?.budgetSummary && (summary.budgetSummary.activeBudgetsCount ?? 0) > 0 && (
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

            {/* Summary cards: top consumed budget + overall utilization */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none select-none">
              {/* Overall Budget Card */}
              <div className="w-[160px] p-4 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xs shrink-0 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7.5 h-7.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                    Overall
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11.5px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                    {summary.budgetSummary!.overallUtilization ?? 0}%{' '}
                    <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-550">
                      used
                    </span>
                  </span>
                  <span className="text-[8.5px] font-semibold text-theme-secondary">
                    {summary.budgetSummary!.activeBudgetsCount} budget
                    {(summary.budgetSummary!.activeBudgetsCount ?? 0) > 1 ? 's' : ''} active
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(100, summary.budgetSummary!.overallUtilization ?? 0)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[8.5px] font-black text-indigo-600 dark:text-indigo-400">
                      ₹
                      {(summary.budgetSummary!.totalBudgetLimit ?? 0).toLocaleString('en-IN', {
                        maximumFractionDigits: 0,
                      })}{' '}
                      total
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Consumed Budget Card */}
              {summary.budgetSummary?.topConsumedBudget && (
                <div className="w-[160px] p-4 rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-xs shrink-0 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center shrink-0 ${
                        summary.budgetSummary!.topConsumedBudget!.utilizationPercentage >= 100
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : summary.budgetSummary!.topConsumedBudget!.utilizationPercentage >= 75
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate">
                      {summary.budgetSummary!.topConsumedBudget!.categoryId}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11.5px] font-extrabold text-zinc-900 dark:text-white leading-tight">
                      ₹
                      {summary.budgetSummary!.topConsumedBudget!.spentAmount.toLocaleString(
                        'en-IN',
                        { maximumFractionDigits: 0 }
                      )}{' '}
                      <span className="text-[8px] font-bold text-zinc-400 dark:text-zinc-550">
                        / ₹
                        {summary.budgetSummary!.topConsumedBudget!.budgetAmount.toLocaleString(
                          'en-IN',
                          { maximumFractionDigits: 0 }
                        )}
                      </span>
                    </span>
                    <span className="text-[8.5px] font-semibold text-theme-secondary">
                      Highest usage
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          summary.budgetSummary!.topConsumedBudget!.utilizationPercentage >= 100
                            ? 'bg-rose-500 dark:bg-rose-400'
                            : summary.budgetSummary!.topConsumedBudget!.utilizationPercentage >= 75
                              ? 'bg-amber-500 dark:bg-amber-400'
                              : 'bg-emerald-500 dark:bg-emerald-400'
                        }`}
                        style={{
                          width: `${Math.min(100, summary.budgetSummary!.topConsumedBudget!.utilizationPercentage)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-end">
                      <span
                        className={`text-[8.5px] font-black ${
                          summary.budgetSummary!.topConsumedBudget!.utilizationPercentage >= 100
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {summary.budgetSummary!.topConsumedBudget!.utilizationPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* View All Budgets CTA */}
              <Link
                href="/budgets"
                className="w-[120px] p-4 rounded-[22px] bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 shadow-xs shrink-0 flex flex-col items-center justify-center gap-2 text-center group hover:bg-indigo-100 dark:hover:bg-indigo-950/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ChevronRight className="w-4.5 h-4.5 stroke-[2.5]" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  View All
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* You're doing great Congratulations Banner Card */}
        <Link
          href="/analytics"
          className="p-4.5 rounded-[26px] bg-gradient-to-r from-[#5d5fe6] via-[#6366f1] to-[#8b5cf6] text-white relative overflow-hidden flex items-center justify-between shadow-[0_12px_24px_rgba(99,102,241,0.2)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.35)] active:scale-[0.99] transition-all duration-300 group cursor-pointer"
        >
          <div className="absolute right-[-10%] top-[-30%] w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3.5 z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/12 border border-white/15 flex items-center justify-center shrink-0 shadow-inner select-none">
              <Sparkles className="w-5.5 h-5.5 text-amber-300 stroke-[2.25] animate-pulse" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11.5px] font-black tracking-wide leading-none">
                {spendChangePercentage <= 0 ? "You're doing great! 🎉" : 'Watch your spending! ⚠️'}
              </span>
              <span className="text-[9.5px] text-white/80 font-bold mt-1.5 leading-snug">
                {spendChangePercentage !== 0 ? (
                  <>
                    Your total spending is {Math.abs(spendChangePercentage)}%{' '}
                    {spendChangePercentage < 0 ? 'lower' : 'higher'}
                    <br />
                    than last month.
                  </>
                ) : (
                  <>Comparison unavailable for this period.</>
                )}
              </span>
            </div>
          </div>

          <div
            className="w-9 h-9 rounded-full bg-white text-[#6366f1] flex items-center justify-center shrink-0 group-hover:scale-110 transition-all shadow-md select-none z-10"
            aria-label="View deep report details"
          >
            <ChevronRight className="w-5 h-5 stroke-[3]" />
          </div>
        </Link>

        {/* Date Range Picker BottomSheet */}
        <BottomSheet
          isOpen={isCalendarFilterOpen}
          onClose={() => setIsCalendarFilterOpen(false)}
          title="Select Custom Range"
        >
          <div className="space-y-6 select-none">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2 min-w-0">
                <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
                  Start Date
                </span>
                <input
                  type="date"
                  value={customStartDate || ''}
                  onChange={(e) => {
                    setCustomDateRange(e.target.value || null, customEndDate);
                  }}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  className="w-full min-w-0 max-w-full px-3 py-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-850/60 focus:border-indigo-500/40 text-xs font-semibold text-theme-text focus:outline-none transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2 min-w-0">
                <span className="text-[10.5px] font-extrabold uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
                  End Date
                </span>
                <input
                  type="date"
                  value={customEndDate || ''}
                  onChange={(e) => {
                    setCustomDateRange(customStartDate, e.target.value || null);
                  }}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  className="w-full min-w-0 max-w-full px-3 py-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200/60 dark:border-zinc-850/60 focus:border-indigo-500/40 text-xs font-semibold text-theme-text focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  const start =
                    customStartDate ||
                    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                      .toISOString()
                      .split('T')[0];
                  const end = customEndDate || new Date().toISOString().split('T')[0];
                  setCustomDateRange(start, end);
                  setSelectedPeriod('Custom');
                  setIsCalendarFilterOpen(false);
                }}
                className="py-3.5 rounded-xl bg-indigo-650 text-white font-bold hover:shadow-lg active:scale-98 transition-all cursor-pointer text-xs border-0"
              >
                Apply Custom Range
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomDateRange(null, null);
                  setSelectedPeriod('This Month');
                  setIsCalendarFilterOpen(false);
                }}
                className="py-3.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-theme-text font-bold active:scale-98 transition-all text-xs cursor-pointer"
              >
                Reset to Monthly
              </button>
            </div>
          </div>
        </BottomSheet>
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
                <span className="text-3xl font-black text-theme-text mt-1.5 leading-none">
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
                <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
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
                  deleteExpenseMutation.mutate(activeDetailExpense.id, {
                    onSuccess: () => setActiveDetailExpense(null),
                  });
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
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Health">Health</option>
                  <option value="Investments">Investments</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Education">Education</option>
                  <option value="Transport">Transport</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Udhaari">Udhaari</option>
                  <option value="Rent">Rent</option>
                  <option value="Travel">Travel</option>
                  <option value="Gifts">Gifts</option>
                  <option value="Others">Others</option>
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
    </>
  );
}
