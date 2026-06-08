'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  UtensilsCrossed,
  ShoppingBag,
  Zap,
  Car,
  Heart,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  PieChart,
  Settings,
  Plus,
} from 'lucide-react';
import { useAnalyticsSummary } from '../../../hooks/useAnalytics';
import { useAuthStore } from '../../../store/auth-store';
import { formatCurrency } from '@expensio/shared';
import Link from 'next/link';

// Predefined colors/styles for categories
const CATEGORY_STYLES: Record<
  string,
  { bg: string; text: string; fill: string; stroke: string; icon: React.ElementType }
> = {
  Food: {
    bg: 'bg-indigo-500/10 border-indigo-500/20',
    text: 'text-indigo-650 dark:text-indigo-400',
    fill: 'fill-indigo-500/10 dark:fill-indigo-400/10',
    stroke: 'stroke-indigo-500 dark:stroke-indigo-400',
    icon: UtensilsCrossed,
  },
  Shopping: {
    bg: 'bg-pink-500/10 border-pink-500/20',
    text: 'text-pink-600 dark:text-pink-400',
    fill: 'fill-pink-500/10 dark:fill-pink-400/10',
    stroke: 'stroke-pink-500 dark:stroke-pink-400',
    icon: ShoppingBag,
  },
  'Bills & Utilities': {
    bg: 'bg-rose-500/10 border-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    fill: 'fill-rose-500/10 dark:fill-rose-400/10',
    stroke: 'stroke-rose-500 dark:stroke-rose-400',
    icon: Zap,
  },
  Bills: {
    bg: 'bg-rose-500/10 border-rose-500/20',
    text: 'text-rose-600 dark:text-rose-400',
    fill: 'fill-rose-500/10 dark:fill-rose-400/10',
    stroke: 'stroke-rose-500 dark:stroke-rose-400',
    icon: Zap,
  },
  Transport: {
    bg: 'bg-amber-500/10 border-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    fill: 'fill-amber-500/10 dark:fill-amber-400/10',
    stroke: 'stroke-amber-500 dark:stroke-amber-400',
    icon: Car,
  },
  Travel: {
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    text: 'text-cyan-600 dark:text-cyan-400',
    fill: 'fill-cyan-500/10 dark:fill-cyan-400/10',
    stroke: 'stroke-cyan-500 dark:stroke-cyan-400',
    icon: Car,
  },
  Health: {
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    fill: 'fill-emerald-500/10 dark:fill-emerald-400/10',
    stroke: 'stroke-emerald-500 dark:stroke-emerald-400',
    icon: Heart,
  },
  Others: {
    bg: 'bg-zinc-500/10 border-zinc-500/20',
    text: 'text-zinc-650 dark:text-zinc-400',
    fill: 'fill-zinc-500/10 dark:fill-zinc-400/10',
    stroke: 'stroke-zinc-500 dark:stroke-zinc-400',
    icon: HelpCircle,
  },
};

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const currency = user?.currency || 'INR';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';

  // State filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Fetch analytics summary from backend
  const {
    data: analytics,
    isLoading,
    error,
  } = useAnalyticsSummary({
    month: selectedMonth,
    year: selectedYear,
  });

  // Hover state for interactive trend charts
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  const monthsList = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const yearsList = [currentYear - 1, currentYear, currentYear + 1];

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 animate-pulse select-none">
        <div className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-28 rounded-3xl bg-zinc-100 dark:bg-zinc-900/50 border border-theme-border/60" />
          <div className="h-28 rounded-3xl bg-zinc-100 dark:bg-zinc-900/50 border border-theme-border/60" />
        </div>
        <div className="h-56 rounded-3xl bg-zinc-100 dark:bg-zinc-900/50 border border-theme-border/60" />
        <div className="h-44 rounded-3xl bg-zinc-100 dark:bg-zinc-900/50 border border-theme-border/60" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-theme-card-border rounded-[28px] space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-sm font-extrabold text-theme-text uppercase">
          Failed to load analytics
        </h3>
        <p className="text-xs text-theme-secondary max-w-xs mx-auto">
          {error?.message || 'Please check your connection and try again.'}
        </p>
      </div>
    );
  }

  const { summary, categoryBreakdown, monthlyTrends } = analytics;
  const userSalary = user?.monthlySalary || 0;

  // Determine check for empty states
  const hasSalary = userSalary > 0;
  const hasExpenses = summary.currentMonthSpend > 0;
  const hasBudgets = categoryBreakdown.length > 0;

  const isEmpty = !hasExpenses && !hasBudgets;

  // Render SVG Line/Area Trend Chart
  const renderTrendChart = () => {
    if (monthlyTrends.length === 0) return null;

    const width = 500;
    const height = 200;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find bounds
    const maxVal = Math.max(
      ...monthlyTrends.map((t) => Math.max(t.expenses, Math.max(t.savings, 0))),
      1000
    );

    const getX = (index: number) => {
      return paddingLeft + (index * chartWidth) / (monthlyTrends.length - 1);
    };

    const getY = (value: number) => {
      // clip negative values to 0 for area scaling, but display actual negative savings correctly
      const positiveValue = Math.max(value, 0);
      return height - paddingBottom - (positiveValue / maxVal) * chartHeight;
    };

    // Construct SVG Paths
    let expensePoints = '';
    let savingsPoints = '';
    let expenseAreaPoints = `M ${getX(0)} ${height - paddingBottom} `;
    let savingsAreaPoints = `M ${getX(0)} ${height - paddingBottom} `;

    monthlyTrends.forEach((t, idx) => {
      const x = getX(idx);
      const yExp = getY(t.expenses);
      const ySav = getY(t.savings);

      const cmd = idx === 0 ? 'M' : 'L';
      expensePoints += `${cmd} ${x} ${yExp} `;
      savingsPoints += `${cmd} ${x} ${ySav} `;

      expenseAreaPoints += `L ${x} ${yExp} `;
      savingsAreaPoints += `L ${x} ${ySav} `;
    });

    expenseAreaPoints += `L ${getX(monthlyTrends.length - 1)} ${height - paddingBottom} Z`;
    savingsAreaPoints += `L ${getX(monthlyTrends.length - 1)} ${height - paddingBottom} Z`;

    const yAxisTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal];

    return (
      <div className="relative select-none">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
          {/* Gridlines */}
          {yAxisTicks.map((tick, i) => {
            const y = getY(tick);
            return (
              <g key={i} className="opacity-30 dark:opacity-10">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[8px] font-bold fill-zinc-400 dark:fill-zinc-550"
                >
                  ₹{Math.round(tick).toLocaleString(locale, { maximumFractionDigits: 0 })}
                </text>
              </g>
            );
          })}

          {/* Area Gradients */}
          <defs>
            <linearGradient id="expenseGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="savingsGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Filled Areas */}
          <path d={expenseAreaPoints} fill="url(#expenseGlow)" />
          <path d={savingsAreaPoints} fill="url(#savingsGlow)" />

          {/* Lines */}
          <path
            d={expensePoints}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={savingsPoints}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Hover Guides & Interactive Nodes */}
          {monthlyTrends.map((t, idx) => {
            const x = getX(idx);
            const isHovered = hoveredTrendIndex === idx;

            return (
              <g key={idx}>
                {/* Visual anchor line on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={height - paddingBottom}
                    stroke="rgba(99, 102, 241, 0.4)"
                    strokeWidth="1"
                  />
                )}

                {/* Expense dot */}
                <circle
                  cx={x}
                  cy={getY(t.expenses)}
                  r={isHovered ? 5 : 3.5}
                  className="fill-rose-500 stroke-white dark:stroke-zinc-950"
                  strokeWidth="1.5"
                />

                {/* Savings dot */}
                <circle
                  cx={x}
                  cy={getY(t.savings)}
                  r={isHovered ? 5 : 3.5}
                  className="fill-emerald-500 stroke-white dark:stroke-zinc-950"
                  strokeWidth="1.5"
                />

                {/* Transparent overlay bars to detect hover on mobile easily */}
                <rect
                  x={x - chartWidth / (monthlyTrends.length * 2)}
                  y={paddingTop}
                  width={chartWidth / monthlyTrends.length}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredTrendIndex(idx)}
                  onMouseLeave={() => setHoveredTrendIndex(null)}
                  onTouchStart={() => setHoveredTrendIndex(idx)}
                />

                {/* X-axis labels */}
                {idx % 3 === 0 || idx === monthlyTrends.length - 1 ? (
                  <text
                    x={x}
                    y={height - paddingBottom + 16}
                    textAnchor="middle"
                    className="text-[8px] font-black uppercase text-zinc-400 dark:text-zinc-550 fill-current"
                  >
                    {t.month.split(' ')[0]}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        <AnimatePresence>
          {hoveredTrendIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-0 right-0 p-3 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 shadow-lg flex flex-col gap-1 z-25 text-[10px]"
            >
              <span className="font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                {monthlyTrends[hoveredTrendIndex].month}
              </span>
              <div className="flex items-center gap-2 font-bold text-rose-500 mt-1">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span>
                  Spend:{' '}
                  {formatCurrency(monthlyTrends[hoveredTrendIndex].expenses, currency, locale)}
                </span>
              </div>
              <div className="flex items-center gap-2 font-bold text-emerald-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>
                  Savings:{' '}
                  {formatCurrency(monthlyTrends[hoveredTrendIndex].savings, currency, locale)}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-24 select-none relative">
      {/* 1. Header Filters Section */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[11px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550 leading-none">
          Evaluate Period
        </h2>

        {/* Period Pill Dropdowns */}
        <div className="flex gap-2 relative">
          {/* Month selector */}
          <div className="relative">
            <button
              onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-300 flex items-center gap-1 cursor-pointer bg-white dark:bg-zinc-900 active:scale-95 transition-all"
            >
              <span>{monthsList[selectedMonth - 1].slice(0, 3)}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {isMonthDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMonthDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-32 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 shadow-lg z-50 flex flex-col gap-0.5"
                  >
                    {monthsList.map((m, idx) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedMonth(idx + 1);
                          setIsMonthDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors border-0 select-none ${
                          selectedMonth === idx + 1
                            ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
                            : 'text-zinc-650 dark:text-zinc-400 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Year selector */}
          <div className="relative">
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-wider text-zinc-650 dark:text-zinc-300 flex items-center gap-1 cursor-pointer bg-white dark:bg-zinc-900 active:scale-95 transition-all"
            >
              <span>{selectedYear}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            <AnimatePresence>
              {isYearDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsYearDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-24 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 shadow-lg z-50 flex flex-col gap-0.5"
                  >
                    {yearsList.map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          setSelectedYear(y);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors border-0 select-none ${
                          selectedYear === y
                            ? 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
                            : 'text-zinc-650 dark:text-zinc-400 bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {isEmpty ? (
        /* Empty state component */
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-805/50 shadow-[0_6px_20px_rgba(0,0,0,0.015)] flex flex-col items-center text-center gap-5"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
            <PieChart className="w-8 h-8 stroke-[2.25]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-100 uppercase tracking-wide">
              No Analytics Data Available 📊
            </h3>
            <p className="text-[10px] font-semibold text-zinc-450 dark:text-zinc-550 max-w-xs leading-relaxed">
              We couldn&apos;t find any transaction or budget limits for{' '}
              {monthsList[selectedMonth - 1]} {selectedYear}. Please log expenses or set
              salary/budgets to begin.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            <Link
              href="/dashboard"
              className="w-full py-3.5 rounded-xl bg-indigo-650 text-white text-[10px] font-black uppercase tracking-widest text-center hover:shadow-lg active:scale-97 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Log First Expense</span>
            </Link>
            {!hasSalary && (
              <Link
                href="/settings"
                className="w-full py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest text-center active:scale-97 transition-all flex items-center justify-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                <span>Configure Salary</span>
              </Link>
            )}
            <Link
              href="/budgets"
              className="w-full py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest text-center active:scale-97 transition-all flex items-center justify-center gap-1.5"
            >
              <PieChart className="w-4 h-4" />
              <span>Setup Category Budget</span>
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          {/* 2. Overview Metrics Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Spending KPI */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.015)] flex flex-col gap-1"
            >
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
                Monthly Spend
              </span>
              <span className="text-xl font-black text-zinc-850 dark:text-zinc-100 mt-1 truncate">
                {formatCurrency(summary.currentMonthSpend, currency, locale)}
              </span>

              {/* Spend Trend Badge */}
              <div className="flex items-center gap-1 mt-2.5">
                {summary.spendChangePercentage > 0 ? (
                  <div className="flex items-center gap-0.5 text-rose-500 font-extrabold text-[9px] uppercase leading-none">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{summary.spendChangePercentage}%</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 text-emerald-500 font-extrabold text-[9px] uppercase leading-none">
                    <TrendingDown className="w-3 h-3" />
                    <span>{summary.spendChangePercentage}%</span>
                  </div>
                )}
                <span className="text-[8.5px] font-semibold text-zinc-400 dark:text-zinc-550 leading-none">
                  vs last month
                </span>
              </div>
            </motion.div>

            {/* Savings KPI */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-5 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.015)] flex flex-col gap-1"
            >
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
                Monthly Savings
              </span>
              <span className="text-xl font-black text-zinc-850 dark:text-zinc-100 mt-1 truncate">
                {formatCurrency(summary.monthlySavings, currency, locale)}
              </span>

              {/* Savings Rate progress indicator */}
              <div className="flex flex-col gap-1.5 mt-2.5">
                <div className="flex justify-between items-center text-[8.5px] font-bold text-zinc-400 dark:text-zinc-550 leading-none">
                  <span>Savings Rate</span>
                  <span className="text-emerald-550 dark:text-emerald-400 font-extrabold">
                    {summary.savingsRate}%
                  </span>
                </div>
                <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(Math.max(summary.savingsRate, 0), 100)}%` }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* 3. Spending Trends Chart */}
          <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.015)] space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
                  Spending Trends
                </h3>
                <span className="text-[8.5px] font-bold text-zinc-450 dark:text-zinc-500">
                  Historical cashflow (Expenses vs Savings)
                </span>
              </div>
              {/* Legend */}
              <div className="flex gap-3 text-[8.5px] font-black uppercase">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-1 rounded-full bg-rose-500" />
                  <span className="text-zinc-650 dark:text-zinc-450">Spend</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-1 rounded-full bg-emerald-500" />
                  <span className="text-zinc-650 dark:text-zinc-450">Save</span>
                </div>
              </div>
            </div>

            {renderTrendChart()}
          </div>

          {/* 4. Category Breakdown */}
          {categoryBreakdown.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200 px-1">
                Category Allocations
              </h3>

              <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.015)] space-y-4">
                {categoryBreakdown.map((item, idx) => {
                  const style = CATEGORY_STYLES[item.category] || CATEGORY_STYLES['Others'];
                  const Icon = style.icon;

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center font-black border ${style.bg}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px]">
                          <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                            {formatCurrency(item.amount, currency, locale)}
                          </span>
                          <span className="text-zinc-400 dark:text-zinc-550 font-bold">
                            · {item.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 }}
                          className={`h-full rounded-full ${style.bg.replace('/10', '')}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Budget Health */}
          {summary.mostConsumedBudget ? (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200 px-1">
                Budget Thresholds
              </h3>

              <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.015)] space-y-4">
                {/* Most consumed budget callout */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      summary.mostConsumedBudget.percentage >= 100
                        ? 'bg-rose-500/10 text-rose-600 border border-rose-500/15'
                        : summary.mostConsumedBudget.percentage >= 75
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/15'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/15'
                    }`}
                  >
                    <AlertTriangle className="w-5.5 h-5.5 stroke-[2.25]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-theme-secondary">
                      Highest Consumption
                    </span>
                    <h4 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                      {summary.mostConsumedBudget.category} budget limit
                    </h4>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        summary.mostConsumedBudget.percentage >= 100
                          ? 'text-rose-600 dark:text-rose-500'
                          : 'text-zinc-800 dark:text-zinc-200'
                      }`}
                    >
                      {summary.mostConsumedBudget.percentage}%
                    </span>
                    <span className="block text-[8px] font-semibold text-zinc-400 dark:text-zinc-550 leading-none">
                      utilized
                    </span>
                  </div>
                </div>

                <div className="h-px bg-zinc-100 dark:bg-zinc-800/80 my-2" />

                <Link
                  href="/budgets"
                  className="w-full py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-center text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-98 transition-all flex items-center justify-center gap-1"
                >
                  <span>Manage active budgets</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200 px-1">
                Budget Thresholds
              </h3>
              <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.015)] flex flex-col items-center justify-center text-center gap-3 py-6">
                <Sparkles className="w-7 h-7 text-indigo-500" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">
                    No limits configured
                  </span>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-550 max-w-[200px]">
                    Create category budgets to get overspending warnings and utilization updates.
                  </p>
                </div>
                <Link
                  href="/budgets"
                  className="mt-1 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-300 text-[9px] font-black uppercase tracking-wider border border-zinc-800"
                >
                  Create Budget
                </Link>
              </div>
            </div>
          )}

          {/* 6. Savings Insights Engine */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-200 px-1">
              Savings Insights
            </h3>

            <div className="p-5 rounded-[28px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_6px_20px_rgba(0,0,0,0.015)] space-y-4">
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
                    Salary
                  </span>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 truncate mt-0.5">
                    {formatCurrency(userSalary, currency, locale)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 border-x border-zinc-100 dark:border-zinc-850/60">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
                    Spend
                  </span>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 truncate mt-0.5">
                    {formatCurrency(summary.currentMonthSpend, currency, locale)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550">
                    Net Savings
                  </span>
                  <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 truncate mt-0.5">
                    {formatCurrency(summary.monthlySavings, currency, locale)}
                  </span>
                </div>
              </div>

              {/* Dynamic Qualitative Trend Recommendation */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 flex items-start gap-3 mt-1">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-500">
                    Analytics Advisor
                  </span>
                  <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350 leading-relaxed mt-0.5">
                    {!hasSalary
                      ? "You haven't set up your monthly salary. Add it in settings to compute savings rates and analyze capital preservation metrics."
                      : summary.currentMonthSpend > userSalary
                        ? `You have spent ${formatCurrency(summary.currentMonthSpend - userSalary, currency, locale)} more than your salary this month, resulting in a negative savings rate of ${summary.savingsRate}%. Consider re-evaluating category limits.`
                        : summary.savingsRate >= 30
                          ? `Excellent! You saved ${summary.savingsRate}% of your salary this month, which is well above the recommended 20% benchmark. High capital preservation is active.`
                          : `You saved ${summary.savingsRate}% of your monthly income. Consider adjusting category limits to reach the recommended 20% benchmark (savings target: ${formatCurrency(userSalary * 0.2, currency, locale)}).`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
