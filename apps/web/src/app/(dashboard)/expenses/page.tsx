'use client';

import React, { useState } from 'react';
import { useFinanceStore } from '../../../store/finance-store';
import { Expense } from '../../../store/mockData';
import ExpenseCard from '../../../components/shared/ExpenseCard';
import BottomSheet from '../../../components/shared/BottomSheet';
import { useShallow } from 'zustand/react/shallow';
import {
  Search,
  ShoppingBag,
  Trash2,
  Edit2,
  Calendar,
  CheckSquare,
  X,
  Info,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Grid,
  UtensilsCrossed,
  Plane,
  Car,
  Zap,
  Heart,
  TrendingUp,
  Tv,
  GraduationCap,
  CreditCard,
  Handshake,
  Home,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  useExpenses,
  useUpdateExpense,
  useDeleteExpense,
  useBulkDeleteExpenses,
} from '../../../hooks/useExpenses';

export default function ExpensesPage() {
  const { isExpensesSelectionActive, setIsExpensesSelectionActive } = useFinanceStore(
    useShallow((state) => ({
      isExpensesSelectionActive: state.isExpensesSelectionActive,
      setIsExpensesSelectionActive: state.setIsExpensesSelectionActive,
    }))
  );

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(1);

  // Calendar states
  const [isCalendarMode, setIsCalendarMode] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
    setSelectedCalendarDate(null);
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
    setSelectedCalendarDate(null);
  };

  const handleDayClick = (dayNum: number) => {
    const clickedDate = new Date(calendarYear, calendarMonth, dayNum);
    if (
      selectedCalendarDate &&
      selectedCalendarDate.getDate() === dayNum &&
      selectedCalendarDate.getMonth() === calendarMonth &&
      selectedCalendarDate.getFullYear() === calendarYear
    ) {
      setSelectedCalendarDate(null);
    } else {
      setSelectedCalendarDate(clickedDate);
    }
  };

  const startOfMonth = new Date(calendarYear, calendarMonth, 1);
  const endOfMonth = new Date(calendarYear, calendarMonth + 1, 0);
  const totalDays = endOfMonth.getDate();
  const startDayOfWeek = startOfMonth.getDay();

  // Interactive detail sheet and edit state
  const [activeDetailExpense, setActiveDetailExpense] = useState<Expense | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('Food');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');

  // Selection mode states
  const isSelectionMode = isExpensesSelectionActive;
  const setIsSelectionMode = setIsExpensesSelectionActive;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Automatically reset selection mode on unmount
  React.useEffect(() => {
    return () => {
      setIsExpensesSelectionActive(false);
    };
  }, [setIsExpensesSelectionActive]);

  // Advanced Filters states
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>(
    'date-desc'
  );
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('All');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const handleResetFilters = () => {
    setSortBy('date-desc');
    setTypeFilter('all');
    setPaymentMethodFilter('All');
    setMinAmount('');
    setMaxAmount('');
    setSelectedCategory('All');
    setPage(1);
  };

  // React Query Hooks
  const { data, isLoading, error } = useExpenses({
    page,
    limit: 20,
    search: search || undefined,
    category: selectedCategory === 'All' ? undefined : selectedCategory,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
    sort: sortBy,
  });

  const deleteMutation = useDeleteExpense();
  const updateMutation = useUpdateExpense();
  const bulkDeleteMutation = useBulkDeleteExpenses();

  const expensesList = data?.expenses || [];

  const displayedExpenses = isCalendarMode
    ? expensesList.filter((exp: Expense) => {
        const d = new Date(exp.date);
        const matchesMonth = d.getFullYear() === calendarYear && d.getMonth() === calendarMonth;
        if (selectedCalendarDate) {
          return matchesMonth && d.getDate() === selectedCalendarDate.getDate();
        }
        return matchesMonth;
      })
    : expensesList;

  const totalMonthSpent = expensesList
    .filter((exp: Expense) => {
      const d = new Date(exp.date);
      return (
        d.getFullYear() === calendarYear &&
        d.getMonth() === calendarMonth &&
        exp.category !== 'Income'
      );
    })
    .reduce((sum, exp) => sum + exp.amount, 0);

  const handleSelectToggle = (id: string) => {
    setIsSelectionMode(true);
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    bulkDeleteMutation.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
        setIsSelectionMode(false);
      },
    });
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

    updateMutation.mutate(
      {
        id: activeDetailExpense.id,
        data: {
          note: editTitle,
          amount: Number(editAmount),
          category: editCategory,
          date: editDate,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setActiveDetailExpense(null);
        },
      }
    );
  };

  const categoryItems = [
    { name: 'All', icon: Grid },
    { name: 'Food', icon: UtensilsCrossed },
    { name: 'Travel', icon: Plane },
    { name: 'Transport', icon: Car },
    { name: 'Shopping', icon: ShoppingBag },
    { name: 'Bills & Utilities', icon: Zap },
    { name: 'Health', icon: Heart },
    { name: 'Investments', icon: TrendingUp },
    { name: 'Entertainment', icon: Tv },
    { name: 'Education', icon: GraduationCap },
    { name: 'Credit Card', icon: CreditCard },
    { name: 'Udhaari', icon: Handshake },
    { name: 'Rent', icon: Home },
    { name: 'Gifts', icon: Gift },
    { name: 'Others', icon: HelpCircle },
  ];

  const totalSpent = expensesList.reduce(
    (acc, curr) => acc + (curr.category === 'Income' ? 0 : curr.amount),
    0
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
          Loading transactions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold text-center">
        Error loading transactions: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6 relative select-none">
      {/* Dynamic Sub-header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-extrabold tracking-tight text-theme-text">All Expenses</h2>
        </div>

        {/* Selection mode triggers */}
        <button
          onClick={() => {
            setIsSelectionMode(!isSelectionMode);
            setSelectedIds([]);
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider cursor-pointer outline-none transition-colors ${
            isSelectionMode
              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              : 'bg-zinc-900/40 border-zinc-850/60 text-zinc-400'
          }`}
        >
          <motion.div
            whileTap={{ scale: 0.7, rotate: -8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 12 }}
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </motion.div>
          <span>{isSelectionMode ? 'Cancel' : 'Select'}</span>
        </button>
      </div>

      {/* Sticky Search bar + Filters */}
      <div className="flex items-center gap-2.5 px-1">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-4.5 top-3.5" />
          <input
            type="text"
            placeholder="Search descriptions, memos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-850/60 focus:border-indigo-500/40 text-xs font-semibold text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
          />
        </div>
        <button
          onClick={() => setIsFilterSheetOpen(true)}
          className="p-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-850/60 text-zinc-550 hover:text-zinc-300 active:scale-95 transition-all outline-none cursor-pointer flex items-center justify-center shrink-0"
          aria-label="Filter transactions"
        >
          <SlidersHorizontal className="w-4.5 h-4.5 stroke-[2.25]" />
        </button>
      </div>

      {/* Category Selection Icons */}
      <div className="flex gap-4.5 overflow-x-auto pb-2.5 scrollbar-none px-1">
        {categoryItems.map((cat) => {
          const isActive = selectedCategory === cat.name;
          const Icon = cat.icon;
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(cat.name)}
              className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 outline-none select-none border-0 bg-transparent group"
            >
              <div
                className={`w-12 h-12 rounded-[18px] flex items-center justify-center border transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/10 shadow-[0_4px_16px_rgba(99,102,241,0.08)]'
                    : 'bg-zinc-900/20 border-zinc-850/60 text-zinc-550 hover:text-zinc-300 hover:border-zinc-700/60'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-indigo-650 dark:text-indigo-400' : 'stroke-[2]'}`}
                />
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-wider transition-colors duration-200 ${
                  isActive
                    ? 'text-indigo-650 dark:text-indigo-400 font-extrabold'
                    : 'text-zinc-550 group-hover:text-zinc-300'
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats Summary Card Row */}
      <div className="grid grid-cols-2 gap-3.5 px-1">
        {/* Spent Card */}
        <div className="p-4.5 rounded-[26px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 shadow-xs flex flex-col gap-1">
          <span className="text-[9.5px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-widest leading-none">
            Total Spent
          </span>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-base font-black text-zinc-100 leading-none">
              ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold text-[8px] flex items-center gap-0.5 shrink-0 select-none">
              ▼ 12%
            </span>
          </div>
          <span className="text-[8px] font-semibold text-zinc-550 dark:text-zinc-500 mt-2 block leading-none">
            vs last 30 days
          </span>
        </div>

        {/* Transactions Card */}
        <div className="p-4.5 rounded-[26px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800/80 shadow-xs flex flex-col gap-1">
          <span className="text-[9.5px] font-black text-zinc-450 dark:text-zinc-550 uppercase tracking-widest leading-none">
            Transactions
          </span>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <span className="text-base font-black text-zinc-100 leading-none">
              {expensesList.length}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[8px] flex items-center gap-0.5 shrink-0 select-none">
              ▲ 8%
            </span>
          </div>
          <span className="text-[8px] font-semibold text-zinc-550 dark:text-zinc-500 mt-2 block leading-none">
            vs last 30 days
          </span>
        </div>
      </div>

      {/* Timeline Feed Container */}
      <div className="space-y-4 px-1">
        {/* Timeline Section Header */}
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-theme-text">
            {isCalendarMode ? 'Calendar View' : 'Timeline'}
          </h3>
          <button
            type="button"
            onClick={() => {
              setIsCalendarMode(!isCalendarMode);
              setSelectedCalendarDate(null);
            }}
            className="text-[9.5px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 bg-transparent border-0 cursor-pointer"
          >
            <span>{isCalendarMode ? 'View timeline' : 'View calendar'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!isCalendarMode ? (
          <div className="text-[9px] font-extrabold text-theme-secondary px-1 uppercase tracking-wider">
            {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
        ) : (
          <div className="bg-white/50 dark:bg-zinc-900/40 backdrop-blur-md rounded-3xl p-4 border border-zinc-200/50 dark:border-zinc-800/40 shadow-xs space-y-4 animate-slide-up">
            {/* Month Navigation */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors text-theme-text cursor-pointer flex items-center justify-center active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 text-theme-text" />
              </button>
              <span className="text-xs font-black text-theme-text uppercase tracking-widest leading-none">
                {calendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors text-theme-text cursor-pointer flex items-center justify-center active:scale-95"
              >
                <ChevronRight className="w-4 h-4 text-theme-text" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-[8.5px] uppercase tracking-wider text-theme-secondary/80">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-2 gap-x-1 justify-items-center">
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="w-9 h-9" />
              ))}

              {Array.from({ length: totalDays }).map((_, idx) => {
                const dayNum = idx + 1;
                const isSelected =
                  selectedCalendarDate &&
                  selectedCalendarDate.getDate() === dayNum &&
                  selectedCalendarDate.getMonth() === calendarMonth &&
                  selectedCalendarDate.getFullYear() === calendarYear;
                const isToday =
                  new Date().getDate() === dayNum &&
                  new Date().getMonth() === calendarMonth &&
                  new Date().getFullYear() === calendarYear;

                // Check if day has expenses
                const dayExpenses = expensesList.filter((exp: Expense) => {
                  const d = new Date(exp.date);
                  return (
                    d.getDate() === dayNum &&
                    d.getMonth() === calendarMonth &&
                    d.getFullYear() === calendarYear
                  );
                });
                const hasExpenses = dayExpenses.length > 0;

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => handleDayClick(dayNum)}
                    className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all relative cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/25 scale-105'
                        : isToday
                          ? 'border border-indigo-500/50 bg-indigo-500/5 text-indigo-650 dark:text-indigo-400 font-extrabold'
                          : 'bg-zinc-100/50 dark:bg-zinc-900/30 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/40 text-theme-text border border-transparent'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {hasExpenses && (
                      <div
                        className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Stats Footer */}
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-theme-secondary/80 border-t border-zinc-200/30 dark:border-zinc-800/30 pt-3 mt-1 px-1">
              <span>Month Spent: ₹{totalMonthSpent.toLocaleString('en-IN')}</span>
              {selectedCalendarDate && (
                <button
                  type="button"
                  onClick={() => setSelectedCalendarDate(null)}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline bg-transparent border-0 cursor-pointer font-bold"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        )}

        {displayedExpenses.length === 0 ? (
          <div className="p-12 rounded-2xl border border-zinc-800/60 bg-zinc-900/20 backdrop-blur-md flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-650 border border-zinc-800/60">
              <ShoppingBag className="w-6 h-6 text-zinc-450" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-300">No transaction matches</p>
              <p className="text-xs text-zinc-550">Modify your queries or add new expenses.</p>
            </div>
          </div>
        ) : (
          <div className="relative pl-0 ml-[-22px] mr-[-14px]">
            {/* Continuous vertical timeline line */}
            <div className="absolute left-[48px] top-2 bottom-2 w-0.5 bg-zinc-250 dark:bg-zinc-800/50 pointer-events-none z-0" />

            <div className="space-y-4">
              {displayedExpenses.map((expense: Expense) => {
                const dateObj = new Date(expense.date);
                const monthStr = dateObj.toLocaleDateString('en-US', { month: 'short' });
                const dayStr = dateObj.toLocaleDateString('en-US', { day: 'numeric' });

                // Determine category dot color
                const categoryDotColors: Record<string, string> = {
                  Food: 'bg-indigo-500 shadow-indigo-500/20',
                  Shopping: 'bg-pink-500 shadow-pink-500/20',
                  Transport: 'bg-amber-500 shadow-amber-500/20',
                  Entertainment: 'bg-indigo-500 shadow-indigo-500/20',
                  Bills: 'bg-rose-500 shadow-rose-500/20',
                  'Bills & Utilities': 'bg-rose-500 shadow-rose-500/20',
                  Utilities: 'bg-amber-400 shadow-amber-400/20',
                  Health: 'bg-cyan-500 shadow-cyan-500/20',
                  Education: 'bg-yellow-500 shadow-yellow-500/20',
                  Investments: 'bg-emerald-500 shadow-emerald-500/20',
                  'Credit Card': 'bg-rose-500 shadow-rose-500/20',
                  Udhaari: 'bg-purple-500 shadow-purple-500/20',
                  Rent: 'bg-blue-500 shadow-blue-500/20',
                  Travel: 'bg-cyan-500 shadow-cyan-500/20',
                  Gifts: 'bg-pink-500 shadow-pink-500/20',
                  Income: 'bg-emerald-500 shadow-emerald-500/20',
                };
                const dotColor =
                  categoryDotColors[expense.category] || 'bg-zinc-400 shadow-zinc-400/20';

                return (
                  <div key={expense.id} className="flex gap-2 relative items-start group">
                    {/* Left Date Block (w-9) */}
                    <div className="w-9 text-right shrink-0 flex flex-col justify-center pt-2.5 select-none leading-none">
                      <span className="text-[8px] font-black uppercase text-theme-secondary leading-none">
                        {monthStr}
                      </span>
                      <span className="text-base font-black text-theme-text mt-1 leading-none tabular-nums">
                        {dayStr}
                      </span>
                    </div>

                    {/* Line and Dot Column */}
                    <div className="flex flex-col items-center h-full w-2 relative shrink-0 pt-3.5 z-10 select-none">
                      <div
                        className={`w-2.5 h-2.5 rounded-full border border-white dark:border-zinc-950 ${dotColor} shadow-md`}
                      />
                    </div>

                    {/* Right Card Block (flex-grow) */}
                    <div className="flex-grow min-w-0">
                      <ExpenseCard
                        expense={expense}
                        onDelete={(id) => deleteMutation.mutate(id)}
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
                        timelineMode={true}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {data?.pagination && data.pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.pagination.hasPrevPage}
                  className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-850/60 text-zinc-350 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-zinc-450">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={!data.pagination.hasNextPage}
                  className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-850/60 text-zinc-350 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Batch Action Bottom Bar */}
      {isSelectionMode && selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-6 right-6 z-40 max-w-sm mx-auto p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl flex items-center justify-between shadow-2xl animate-slide-up">
          <div className="flex items-center gap-2">
            <Info className="w-4.5 h-4.5 text-indigo-500" />
            <span className="text-xs font-bold text-theme-text">
              {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 text-white font-bold active:scale-95 transition-all text-[9px] font-black uppercase cursor-pointer shadow-md shadow-rose-500/10 hover:bg-rose-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedIds([]);
              }}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-theme-text active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-theme-text" />
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
        {activeDetailExpense &&
          (isEditing ? (
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-1.5 py-4 border-b border-zinc-900">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-555">
                  Edit Value
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-3xl font-extrabold text-cyan-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="text-4xl font-black text-zinc-100 bg-transparent text-center focus:outline-none w-48 focus:border-0"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Merchant / Description
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-850/60 focus:border-indigo-500/40 text-sm font-semibold text-zinc-100 focus:outline-none placeholder-zinc-650"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2 min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full min-w-0 max-w-full px-3 py-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-850/60 text-xs font-semibold text-zinc-100 focus:outline-none focus:border-indigo-500/40"
                  >
                    <option value="Food">Food</option>
                    <option value="Travel">Travel</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 min-w-0">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker();
                      } catch {}
                    }}
                    className="w-full min-w-0 max-w-full px-3 py-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-850/60 text-xs font-semibold text-zinc-100 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Notes / Memos
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-850/60 focus:border-indigo-500/40 text-sm font-semibold text-zinc-100 placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  type="submit"
                  className="py-4 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-zinc-950 font-black text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer border border-emerald-300/20"
                >
                  Save Modifications
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold active:scale-98 transition-all text-xs cursor-pointer"
                >
                  Back to Details
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4 border-b border-zinc-900/60 gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Value Details
                </span>
                <span
                  className={`text-4xl font-extrabold ${activeDetailExpense.category === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {activeDetailExpense.category === 'Income'
                    ? `+₹${activeDetailExpense.amount.toFixed(2)}`
                    : `-₹${activeDetailExpense.amount.toFixed(2)}`}
                </span>
                <span className="text-xs font-bold text-zinc-400 mt-0.5">
                  {activeDetailExpense.title}
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-zinc-900/60">
                  <span className="text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
                    Category
                  </span>
                  <span className="font-extrabold text-zinc-200">
                    {activeDetailExpense.category}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-zinc-900/60">
                  <span className="text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
                    Transaction Date
                  </span>
                  <span className="font-bold text-zinc-200">
                    {new Date(activeDetailExpense.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {activeDetailExpense.note && (
                  <div className="flex flex-col gap-1.5 py-2 border-b border-zinc-900/60">
                    <span className="text-zinc-550 font-bold uppercase tracking-wider text-[9px]">
                      Memo Notes
                    </span>
                    <p className="text-zinc-350 font-semibold italic">
                      "{activeDetailExpense.note}"
                    </p>
                  </div>
                )}

                {activeDetailExpense.splitWith &&
                  activeDetailExpense.splitWith.length > 0 &&
                  (() => {
                    const splitWith = activeDetailExpense.splitWith;
                    return (
                      <div className="flex flex-col gap-2 py-2">
                        <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                          Split Shares
                        </span>
                        <div className="p-3.5 rounded-2xl bg-zinc-900/20 border border-zinc-850/60 space-y-2 card-clean">
                          <div className="flex justify-between font-bold text-[11px]">
                            <span className="text-zinc-400">Paid by Me</span>
                            <span className="text-zinc-250">
                              ₹{(activeDetailExpense.amount / (splitWith.length + 1)).toFixed(2)}
                            </span>
                          </div>
                          {splitWith.map((friend: string) => (
                            <div
                              key={friend}
                              className="flex justify-between font-semibold text-zinc-500 text-[10px]"
                            >
                              <span>Owes Me: {friend.split(' ')[0]}</span>
                              <span>
                                ₹{(activeDetailExpense.amount / (splitWith.length + 1)).toFixed(2)}
                              </span>
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
                  className="py-3.5 rounded-xl bg-indigo-500 text-zinc-950 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 outline-none"
                >
                  <motion.div
                    whileTap={{ scale: 0.65, rotate: -15 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 10 }}
                  >
                    <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </motion.div>
                  <span>Modify</span>
                </button>
                <button
                  onClick={() => {
                    deleteMutation.mutate(activeDetailExpense.id);
                    setActiveDetailExpense(null);
                  }}
                  className="py-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold text-xs cursor-pointer outline-none animate-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setActiveDetailExpense(null)}
                  className="py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-bold text-xs cursor-pointer outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          ))}
      </BottomSheet>

      {/* Advanced Filter Modal Sheet */}
      <BottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filters & Sorting"
      >
        <div className="space-y-6">
          {/* Sorting Option */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
              Sort By
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'date-desc', label: 'Newest Date' },
                { value: 'date-asc', label: 'Oldest Date' },
                { value: 'amount-desc', label: 'Highest Amount' },
                { value: 'amount-asc', label: 'Lowest Amount' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSortBy(opt.value as any)}
                  className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    sortBy === opt.value
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-xs'
                      : 'bg-zinc-100/80 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/30 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type Option */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
              Transaction Type
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'expense', label: 'Expenses' },
                { value: 'income', label: 'Income' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTypeFilter(opt.value as any)}
                  className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    typeFilter === opt.value
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-xs'
                      : 'bg-zinc-100/80 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/30 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Option */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
              Payment Method
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {['All', 'Credit Card', 'Debit Card', 'Cash', 'UPI'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPaymentMethodFilter(opt)}
                  className={`py-2 rounded-lg border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer truncate ${
                    paymentMethodFilter === opt
                      ? 'bg-indigo-500/10 text-indigo-655 dark:text-indigo-400 border-indigo-500/30 shadow-xs'
                      : 'bg-zinc-100/80 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/30 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50'
                  }`}
                  title={opt}
                >
                  {opt === 'Credit Card' ? 'Card' : opt === 'Debit Card' ? 'Debit' : opt}
                </button>
              ))}
            </div>
          </div>

          {/* Amount range */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
              Amount Range
            </span>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-[9px] text-zinc-400 font-extrabold uppercase">
                  Min
                </span>
                <input
                  type="number"
                  placeholder="₹ 0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full pl-11 pr-3 py-3.5 rounded-2xl bg-zinc-100/85 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 text-xs font-semibold text-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-[9px] text-zinc-400 font-extrabold uppercase">
                  Max
                </span>
                <input
                  type="number"
                  placeholder="₹ Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-full pl-11 pr-3 py-3.5 rounded-2xl bg-zinc-100/85 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-indigo-500 text-xs font-semibold text-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(false)}
              className="py-4 rounded-xl bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest hover:shadow-lg active:scale-98 transition-all cursor-pointer text-center"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="py-4 rounded-xl bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 text-zinc-650 dark:text-zinc-400 hover:text-zinc-800 font-bold text-xs uppercase tracking-widest active:scale-98 transition-all cursor-pointer"
            >
              Reset All
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
