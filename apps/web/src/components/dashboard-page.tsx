'use client';

import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import {
  Bell,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Wallet,
  Check,
  ChevronLeft,
  X,
  Sparkles,
  Trash2,
  Share2,
  Sliders,
  UserPlus,
  Moon,
  Sun,
  Coffee,
  Car,
  ShoppingBag,
  ReceiptText,
  Clapperboard,
  Tag,
  Utensils,
  HelpCircle,
  HeartPulse,
  GraduationCap,
  TrendingUp as GainIcon,
  CreditCard,
  Users,
  Target,
  UserCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

// Type definitions for Expensio
interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Entertainment' | 'Health' | 'Education' | 'Others';
  date: string; // 'Today' | 'Yesterday' | string
  time: string;
  note?: string;
}

interface Budget {
  category: string;
  limit: number;
  spent: number;
  icon: React.ReactNode;
  color: string;
}

// Initial premium demo expenses to achieve EXACT metrics requested
// Balance: ₹42,580
// Monthly Salary: ₹85,000
// Spent: ₹42,420
// Daily Safe Spend: ₹2,833/day (calculated as Balance / 15 remaining days)
const DEFAULT_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'Groceries Store',
    amount: 8200,
    category: 'Food',
    date: 'Today',
    time: '04:20 PM',
    note: 'Weekly essentials',
  },
  {
    id: 'exp-2',
    title: 'Uber to Office',
    amount: 1220,
    category: 'Transport',
    date: 'Yesterday',
    time: '09:15 AM',
    note: 'Premium ride',
  },
  {
    id: 'exp-3',
    title: 'Apple Premium Reseller',
    amount: 33000,
    category: 'Shopping',
    date: '3 days ago',
    time: '02:00 PM',
    note: 'AirPods Max',
  },
];

export function DashboardPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Profile and lock states
  const [profile, setProfile] = useState<{ name: string; salary: string; mpin: string } | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const lockInputRef = useRef<HTMLInputElement>(null);

  // Core application states
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'expenses' | 'groups' | 'friends' | 'profile'>('home');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  
  // Custom Pull to Refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pullY = useMotionValue(0);
  const pullLimit = 100;
  const pullPercentage = useTransform(pullY, [0, pullLimit], [0, 100]);
  const pullOpacity = useTransform(pullY, [0, 30, pullLimit], [0, 0.4, 1]);
  const pullScale = useTransform(pullY, [0, pullLimit], [0.8, 1]);

  // Tooltip states
  const [tooltip, setTooltip] = useState<{ expenseId: string; text: string; visible: boolean; field?: 'title' | 'category' | 'time'; x?: number | null; y?: number | null }>({ expenseId: '', text: '', visible: false, x: null, y: null });
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Quick action icon click animations
  const [activeQuickAction, setActiveQuickAction] = useState<'add-expense' | 'split-bill' | 'create-budget' | 'add-friend' | null>(null);
  const quickActionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form states for new expense
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Entertainment' | 'Health' | 'Education' | 'Others'>('Food');
  const [newNote, setNewNote] = useState('');

  // Load profile & initial state
  useEffect(() => {
    const savedProfile = localStorage.getItem('expensio_profile');
    if (!savedProfile) {
      router.push('/onboarding');
      return;
    }

    try {
      const parsed = JSON.parse(savedProfile);
      setProfile(parsed);

      // Check unlock status
      const isUnlocked = sessionStorage.getItem('expensio_unlocked') === 'true';
      if (isUnlocked) {
        setIsLocked(false);
      } else {
        setIsLocked(true);
      }
    } catch (e) {
      router.push('/onboarding');
    }

    // Load or initialize expenses
    const savedExpenses = localStorage.getItem('expensio_expenses');
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch {
        setExpenses(DEFAULT_EXPENSES);
        localStorage.setItem('expensio_expenses', JSON.stringify(DEFAULT_EXPENSES));
      }
    } else {
      setExpenses(DEFAULT_EXPENSES);
      localStorage.setItem('expensio_expenses', JSON.stringify(DEFAULT_EXPENSES));
    }
  }, [router]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    if (isAddSheetOpen || expenseToDelete) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [expenseToDelete, isAddSheetOpen]);

  // Keep input focused if locked
  useEffect(() => {
    if (isLocked && profile) {
      lockInputRef.current?.focus();
    }
  }, [isLocked, profile]);

  const handleUnlockPinChange = (val: string) => {
    const sanitized = val.replace(/[^0-9]/g, '').slice(0, 4);
    setPinInput(sanitized);
    setPinError(false);

    if (sanitized.length === 4 && profile) {
      if (sanitized === profile.mpin) {
        sessionStorage.setItem('expensio_unlocked', 'true');
        setIsLocked(false);
      } else {
        setPinError(true);
        setTimeout(() => {
          setPinInput('');
          lockInputRef.current?.focus();
        }, 800);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('expensio_profile');
    localStorage.removeItem('expensio_auth_user');
    localStorage.removeItem('expensio_expenses');
    sessionStorage.removeItem('expensio_unlocked');
    router.push('/');
  };

  // Add a new expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;

    const amt = parseFloat(newAmount.replace(/,/g, '')) || 0;
    if (amt <= 0) return;

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      title: newTitle,
      amount: amt,
      category: newCategory,
      date: 'Today',
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      note: newNote || undefined,
    };

    const updated = [newExp, ...expenses];
    setExpenses(updated);
    localStorage.setItem('expensio_expenses', JSON.stringify(updated));

    // Reset fields
    setNewTitle('');
    setNewAmount('');
    setNewNote('');
    setNewCategory('Food');
    setIsAddSheetOpen(false);
  };

  // Delete an expense
  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    localStorage.setItem('expensio_expenses', JSON.stringify(updated));
    setExpenseToDelete(null);
  };

  // Simulate pull-to-refresh loading sequence
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.y > 60 && !isRefreshing) {
      setIsRefreshing(true);
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1500);
    }
  };

  const showTooltip = (
    expenseId: string,
    text: string,
    field: 'title' | 'category' | 'time',
    target?: HTMLElement | null
  ) => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    // compute coordinates from target if available
    let x: number | null = null;
    let y: number | null = null;
    if (target) {
      const rect = target.getBoundingClientRect();
      x = Math.round(rect.left + rect.width / 2);
      y = Math.round(rect.top);
    }

    setTooltip({ expenseId, text, visible: true, field, x, y });
    
    // Hide tooltip after 2 seconds
    tooltipTimeoutRef.current = setTimeout(() => {
      setTooltip({ expenseId: '', text: '', visible: false, x: null, y: null });
    }, 2000);
  };

  const triggerQuickActionMotion = (action: 'add-expense' | 'split-bill' | 'create-budget' | 'add-friend') => {
    if (quickActionTimeoutRef.current) {
      clearTimeout(quickActionTimeoutRef.current);
    }

    setActiveQuickAction(action);
    quickActionTimeoutRef.current = setTimeout(() => {
      setActiveQuickAction(null);
    }, 420);
  };

  // Cleanup tooltip on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      if (quickActionTimeoutRef.current) {
        clearTimeout(quickActionTimeoutRef.current);
      }
    };
  }, []);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F5] text-[#0F172A] dark:bg-[#0C0C0E] dark:text-[#F8FAF6]">
        <RefreshCw className="animate-spin text-[#7C5CFF]" size={24} strokeWidth={1.5} />
      </div>
    );
  }

  // CALCULATED METRICS
  const parsedSalary = parseFloat(profile.salary.replace(/,/g, '')) || 0;
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const walletBalance = Math.max(0, parsedSalary - totalExpenses);
  
  // Safe daily spend (using 15 days as remaining period target to match mockup perfectly)
  const dailySafeSpend = walletBalance > 0 ? Math.round(walletBalance / 15) : 0;

  // Custom Categories & Gradients for High-End UI
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food':
        return <Utensils size={18} className="text-[#F59E0B]" strokeWidth={1.5} />;
      case 'Transport':
        return <Car size={18} className="text-[#3B82F6]" strokeWidth={1.5} />;
      case 'Shopping':
        return <ShoppingBag size={18} className="text-[#EC4899]" strokeWidth={1.5} />;
      case 'Bills':
        return <Wallet size={18} className="text-[#10B981]" strokeWidth={1.5} />;
      case 'Entertainment':
        return <Coffee size={18} className="text-[#8B5CF6]" strokeWidth={1.5} />;
      case 'Health':
        return <HeartPulse size={18} className="text-[#EF4444]" strokeWidth={1.5} />;
      case 'Education':
        return <GraduationCap size={18} className="text-[#14B8A6]" strokeWidth={1.5} />;
      default:
        return <HelpCircle size={18} className="text-[#6B7280]" strokeWidth={1.5} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Food':
        return 'from-amber-500/10 to-amber-500/20 text-[#F59E0B] border-amber-500/10';
      case 'Transport':
        return 'from-blue-500/10 to-blue-500/20 text-[#3B82F6] border-blue-500/10';
      case 'Shopping':
        return 'from-pink-500/10 to-pink-500/20 text-[#EC4899] border-pink-500/10';
      case 'Bills':
        return 'from-emerald-500/10 to-emerald-500/20 text-[#10B981] border-emerald-500/10';
      case 'Entertainment':
        return 'from-purple-500/10 to-purple-500/20 text-[#8B5CF6] border-purple-500/10';
      case 'Health':
        return 'from-red-500/10 to-red-500/20 text-[#EF4444] border-red-500/10';
      case 'Education':
        return 'from-teal-500/10 to-teal-500/20 text-[#14B8A6] border-teal-500/10';
      default:
        return 'from-gray-500/10 to-gray-500/20 text-gray-500 border-gray-500/10';
    }
  };

  // Budget calculations
  // Groceries Budget: 72% complete, ₹3,200 left -> limit ₹11,400, spent ₹8,200
  const groceriesSpent = expenses.filter(e => e.category === 'Food').reduce((sum, item) => sum + item.amount, 0);
  const groceriesLimit = 11400;
  const groceriesPercent = Math.min(100, Math.round((groceriesSpent / groceriesLimit) * 100)) || 0;
  const groceriesLeft = Math.max(0, groceriesLimit - groceriesSpent);

  // Insight calculation
  const getInsightText = () => {
    if (expenses.length === 0) {
      return 'Your wallet is fresh and ready to grow';
    }
    if (groceriesSpent > 8000) {
      return 'Weekend spending increased slightly. Watch out.';
    }
    return 'You spent less on food this week';
  };

  return (
    <div className="relative mx-auto flex min-h-svh w-full max-w-107.5 flex-col bg-[#FAF9F5] dark:bg-[#0C0C0E] text-[#0F172A] dark:text-[#F8FAF6] overflow-x-hidden font-sans">
      {/* Film grain noise effect for premium organic touch */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.015] bg-[radial-gradient(#000_1px,transparent_0)] dark:bg-[radial-gradient(#fff_1px,transparent_0)] bg-size-[16px_16px]" />

      {/* MPIN Lockscreen Interceptor Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-50 flex flex-col justify-between bg-[#FAF9F5] dark:bg-[#0C0C0E] px-8 pb-[calc(env(safe-area-inset-bottom,0)+24px)] pt-[calc(env(safe-area-inset-top,0)+32px)]"
          >
            <div className="flex flex-col items-center mt-12 text-center" onClick={() => lockInputRef.current?.focus()}>
              {/* Premium double bezel squircle logo */}
              <div className="rounded-3xl bg-black/3 dark:bg-white/4 p-1 shadow-[0_8px_20px_rgba(0,0,0,0.02)]">
                <div className="grid h-12 w-12 place-items-center rounded-[20px] bg-linear-to-tr from-[#7C5CFF] to-[#B894FF] text-white shadow-md">
                  <Wallet size={22} strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="mt-6 text-[24px] font-black tracking-tight text-[#0F172A] dark:text-[#F8FAF6]">Unlock Expensio</h1>
              <p className="mt-1 text-[13px] font-semibold text-[#64748B] dark:text-[#94A3B8]">Enter your 4-digit security MPIN</p>
            </div>

            {/* Hidden Input to capture native keyboard */}
            <div className="flex flex-col items-center space-y-6 my-auto">
              <input
                ref={lockInputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pinInput}
                onChange={(e) => handleUnlockPinChange(e.target.value)}
                className="absolute h-0 w-0 opacity-0 pointer-events-none"
                autoFocus
              />

              <motion.div
                animate={pinError ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex gap-4 cursor-pointer"
                onClick={() => lockInputRef.current?.focus()}
              >
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pinInput.length > index;
                  return (
                    <div
                      key={index}
                      className={`flex h-15 w-15 items-center justify-center rounded-[18px] border-2 text-[20px] font-black transition-all duration-300 ${
                        pinError
                          ? 'border-red-500 bg-red-50/50 dark:bg-red-500/5'
                          : isFilled
                          ? 'border-[#7C5CFF] bg-[#7C5CFF]/5 text-[#7C5CFF]'
                          : 'border-black/6 bg-white dark:border-white/10 dark:bg-white/5'
                      }`}
                    >
                      {isFilled ? (
                        <span className={`h-3 w-3 rounded-full ${pinError ? 'bg-red-500' : 'bg-[#7C5CFF]'} animate-pulse`} />
                      ) : null}
                    </div>
                  );
                })}
              </motion.div>

              {pinError && (
                <p className="flex items-center gap-1.5 text-[13px] font-black text-red-500">
                  <Lock size={14} strokeWidth={1.5} />
                  Incorrect MPIN, please try again
                </p>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="mx-auto flex items-center gap-2 text-[13px] font-black text-red-500/80 hover:text-red-500 transition-all duration-300 py-2.5 px-4 rounded-full bg-red-500/5 dark:bg-red-500/10"
            >
              <LogOut size={14} strokeWidth={1.5} />
              Reset App Data
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Premium Dashboard */}
      {!isLocked && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col flex-1"
        >
          {/* Pull to refresh visual loader */}
          <div className="absolute top-2 left-0 right-0 z-40 pointer-events-none flex justify-center h-10">
            {isRefreshing && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 shadow-md border border-black/5 dark:border-white/5"
              >
                <RefreshCw size={12} className="animate-spin text-[#7C5CFF]" />
                <span className="text-[10px] font-black uppercase text-[#64748B]">Refreshing</span>
              </motion.div>
            )}
          </div>

          <div className="px-6 pt-[calc(env(safe-area-inset-top,0)+6px)] pb-[calc(env(safe-area-inset-bottom,0)+140px)]">
            {/* 1. TOP APP BAR */}
            <header className="sticky top-0 z-30 flex items-center justify-between py-3 bg-[#FAF9F5]/85 dark:bg-[#0C0C0E]/85 backdrop-blur-md">
              <div className="flex flex-col">
                <h2 className="text-[18px] font-black leading-tight">Dashboard</h2>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Floating theme toggle */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle Theme"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-white/5 border border-black/4 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.02)] text-[#0F172A] dark:text-[#F8FAF6] active:scale-90 transition-all duration-300"
                >
                  {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
                </button>

                {/* Profile avatar / lock indicator */}
                <button
                  onClick={() => setIsLocked(true)}
                  className="relative h-10 w-10 rounded-full p-0.5 bg-linear-to-tr from-[#7C5CFF] to-[#EC4899] active:scale-95 transition-all duration-300 shadow-sm"
                  aria-label="Lock Dashboard"
                >
                  <div className="h-full w-full rounded-full bg-white dark:bg-zinc-950 flex items-center justify-center font-black text-[12px]">
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>
                  {/* Active notification indicator */}
                  <span className="absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-[#FAF9F5] dark:border-[#0C0C0E] bg-emerald-500 shadow-sm animate-pulse" />
                </button>
              </div>
            </header>

            {/* Pull to refresh draggable handle trigger */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: pullLimit }}
              style={{ y: pullY }}
              onDragEnd={handleDragEnd}
              className="flex flex-col flex-1"
            >
              {/* 2. HERO WALLET CARD */}
              <section className="mt-2.5">
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className="rounded-[2.5rem] bg-linear-to-br from-[#6366F1] via-[#8B5CF6] to-[#EC4899] p-6 text-white shadow-[0_14px_28px_rgba(124,92,255,0.12)]"
                >
                  <div className="relative overflow-visible rounded-[2.25rem]">

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 opacity-80">
                        <span className="text-[11px] font-black uppercase tracking-widest">Current Balance</span>
                      </div>
                      <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="p-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/20 active:scale-90 transition-all duration-300"
                        aria-label={showBalance ? "Hide Balance" : "Show Balance"}
                      >
                        {showBalance ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}
                      </button>
                    </div>

                    <h3 className="mt-2 text-[38px] font-black tracking-tight leading-none">
                      {showBalance ? `₹${walletBalance.toLocaleString('en-IN')}` : '••••••'}
                    </h3>

                    {/* Bottom metrics split layout */}
                    <div className="mt-8 grid grid-cols-2 gap-4 pt-4 border-t border-white/15">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Monthly Salary</p>
                        <p className="mt-0.5 text-[15px] font-black">₹{parsedSalary.toLocaleString('en-IN')}</p>
                  <AnimatePresence>
                    {tooltip.visible && tooltip.x != null && tooltip.y != null && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.18 }}
                        style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, transform: 'translate(-50%,-110%)' }}
                        className={`bg-[#0F172A] dark:bg-[#F8FAF6] text-[#F8FAF6] dark:text-[#0F172A] px-3 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap z-50 shadow-lg`}
                      >
                        {tooltip.text}
                      </motion.div>
                    )}
                  </AnimatePresence>
                      </div>
                      <div className="border-l border-white/15 pl-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">Daily Safe Spend</p>
                        <p className="mt-0.5 text-[15px] font-black flex items-center gap-1">
                          ₹{dailySafeSpend.toLocaleString('en-IN')}<span className="text-[10px] opacity-75 font-semibold">/day</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </section>

              {/* 3. QUICK ACTIONS */}
              <section className="mt-8">
                <div className="grid grid-cols-4 gap-4">
                  {/* Add Expense */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      triggerQuickActionMotion('add-expense');
                      setIsAddSheetOpen(true);
                    }}
                    className="flex flex-col items-center gap-3 py-4 rounded-2xl border border-white/6 bg-[#12141B]/85 hover:bg-[#151823]/95 transition-all duration-300 active:scale-90"
                  >
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-linear-to-br from-[#B388FF] via-[#8B5CF6] to-[#6D28D9] shadow-[0_0_22px_rgba(139,92,246,0.45)]">
                      <motion.span
                        animate={
                          activeQuickAction === 'add-expense'
                            ? { scale: [1, 1.18, 1], rotate: [0, -10, 8, 0] }
                            : { scale: 1, rotate: 0 }
                        }
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className="inline-flex"
                      >
                        <Wallet size={27} strokeWidth={2.3} className="text-white" />
                      </motion.span>
                    </div>
                    <span className="text-[12px] font-bold text-[#0F172A] dark:text-[#F8FAF6] text-center leading-tight">
                      Add<br />Expense
                    </span>
                  </motion.button>

                  {/* Split Bill */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => triggerQuickActionMotion('split-bill')}
                    className="flex flex-col items-center gap-3 py-4 rounded-2xl border border-white/6 bg-[#12141B]/85 hover:bg-[#151823]/95 transition-all duration-300 active:scale-90"
                  >
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-linear-to-br from-[#4ADE80] via-[#10B981] to-[#047857] shadow-[0_0_22px_rgba(16,185,129,0.4)]">
                      <motion.span
                        animate={
                          activeQuickAction === 'split-bill'
                            ? { x: [0, -5, 5, -3, 3, 0], scale: [1, 1.1, 1] }
                            : { x: 0, scale: 1 }
                        }
                        transition={{ duration: 0.42, ease: 'easeInOut' }}
                        className="inline-flex"
                      >
                        <Share2 size={26} strokeWidth={2.3} className="text-white" />
                      </motion.span>
                    </div>
                    <span className="text-[12px] font-bold text-[#0F172A] dark:text-[#F8FAF6] text-center leading-tight">
                      Split<br />Bill
                    </span>
                  </motion.button>

                  {/* Create Budget */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => triggerQuickActionMotion('create-budget')}
                    className="flex flex-col items-center gap-3 py-4 rounded-2xl border border-white/6 bg-[#12141B]/85 hover:bg-[#151823]/95 transition-all duration-300 active:scale-90"
                  >
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-linear-to-br from-[#FDE047] via-[#FBBF24] to-[#D97706] shadow-[0_0_22px_rgba(251,191,36,0.42)]">
                      <motion.span
                        animate={
                          activeQuickAction === 'create-budget'
                            ? { rotate: [0, 18, -12, 6, 0], scale: [1, 1.12, 1] }
                            : { rotate: 0, scale: 1 }
                        }
                        transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
                        className="inline-flex"
                      >
                        <Sliders size={26} strokeWidth={2.3} className="text-white" />
                      </motion.span>
                    </div>
                    <span className="text-[12px] font-bold text-[#0F172A] dark:text-[#F8FAF6] text-center leading-tight">
                      Create<br />Budget
                    </span>
                  </motion.button>

                  {/* Add Friend */}
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => triggerQuickActionMotion('add-friend')}
                    className="flex flex-col items-center gap-3 py-4 rounded-2xl border border-white/6 bg-[#12141B]/85 hover:bg-[#151823]/95 transition-all duration-300 active:scale-90"
                  >
                    <div className="flex items-center justify-center h-14 w-14 rounded-full bg-linear-to-br from-[#60A5FA] via-[#3B82F6] to-[#1E40AF] shadow-[0_0_22px_rgba(59,130,246,0.42)]">
                      <motion.span
                        animate={
                          activeQuickAction === 'add-friend'
                            ? { y: [0, -6, 0, -3, 0], scale: [1, 1.1, 1] }
                            : { y: 0, scale: 1 }
                        }
                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-flex"
                      >
                        <UserPlus size={26} strokeWidth={2.3} className="text-white" />
                      </motion.span>
                    </div>
                    <span className="text-[12px] font-bold text-[#0F172A] dark:text-[#F8FAF6] text-center leading-tight">
                      Add<br />Friend
                    </span>
                  </motion.button>
                </div>
              </section>

              {/* 4. TODAY INSIGHT SECTION */}
              <section className="mt-6">
                <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#7C5CFF]/10 text-[#7C5CFF] text-[10px] font-black uppercase tracking-wider mb-2.5">
                        <Sparkles size={10} strokeWidth={2} />
                        Insight
                      </div>
                      <h4 className="text-[14px] font-bold leading-snug">{getInsightText()}</h4>
                    </div>

                    {/* Progress Circle Visual Ring (replacing traditional charts) */}
                    <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        {/* Outer ring */}
                        <circle
                          cx="32"
                          cy="32"
                          r="26"
                          className="stroke-black/4 dark:stroke-white/10"
                          strokeWidth="5"
                          fill="transparent"
                        />
                        {/* Inner animating progress */}
                        <motion.circle
                          cx="32"
                          cy="32"
                          r="26"
                          className="stroke-[#7C5CFF]"
                          strokeWidth="5"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 26}
                          initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
                          animate={{
                            strokeDashoffset:
                              2 * Math.PI * 26 -
                              (2 * Math.PI * 26 * Math.min(parsedSalary, totalExpenses)) / Math.max(1, parsedSalary),
                          }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </svg>
                      <div className="absolute text-[11px] font-black">
                        {Math.round((totalExpenses / Math.max(1, parsedSalary)) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 6. BUDGET PROGRESS EXPERIENCE (Circular Streaks) */}
              {expenses.length > 0 && (
                <section className="mt-6">
                  <div className="rounded-3xl bg-white dark:bg-zinc-900 p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.24)]">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-[12px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                          Active Budgets
                        </h4>
                        <span className="text-[11px] font-bold text-[#7C5CFF] bg-[#7C5CFF]/10 px-2 py-0.5 rounded-full">Progress</span>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Circle streak dial */}
                        <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="28"
                              cy="28"
                              r="22"
                              className="stroke-black/4 dark:stroke-white/10"
                              strokeWidth="4"
                              fill="transparent"
                            />
                            <motion.circle
                              cx="28"
                              cy="28"
                              r="22"
                              className="stroke-[#F59E0B]"
                              strokeWidth="4"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 22}
                              initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 22 - (2 * Math.PI * 22 * groceriesPercent) / 100 }}
                              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                            />
                          </svg>
                          <span className="absolute text-[10px] font-black text-[#F59E0B]">Food</span>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-[14px] font-black">Groceries Budget</p>
                            <p className="text-[13px] font-black text-[#F59E0B]">{groceriesPercent}%</p>
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8] font-semibold">
                            <span>₹{groceriesSpent.toLocaleString('en-IN')} spent</span>
                            <span>₹{groceriesLeft.toLocaleString('en-IN')} left</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 5. RECENT EXPENSES */}
              <section className="mt-6 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3.5">
                  <h4 className="text-[12px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                    Recent Expenses
                  </h4>
                  {expenses.length > 0 && (
                    <span className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1">
                      Tap delete to remove
                    </span>
                  )}
                </div>

                {/* Conditional rendering for Empty State vs Filled List */}
                <AnimatePresence mode="popLayout">
                  {expenses.length === 0 ? (
                    /* 7. EMPTY STATE DESIGN */
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-3xl bg-white dark:bg-zinc-900 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
                    >
                      <div className="rounded-[20px] p-8 flex flex-col items-center text-center bg-transparent">
                        {/* Elegant CSS Wallet Illustration */}
                        <div className="relative h-20 w-20 flex items-center justify-center mb-5">
                          <div className="absolute inset-0 bg-[#7C5CFF]/10 rounded-full blur-xl animate-pulse" />
                          <div className="relative z-10 p-4 rounded-[22px] bg-linear-to-tr from-[#7C5CFF] to-[#B894FF] text-white shadow-md">
                            <Wallet size={28} strokeWidth={1.5} />
                          </div>
                        </div>

                        <h5 className="text-[16px] font-black">Your wallet is ready</h5>
                        <p className="mt-1.5 max-w-55 text-[12px] font-semibold text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                          Start by adding your first expense.
                        </p>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsAddSheetOpen(true)}
                          className="mt-5 px-5 py-2.5 rounded-full bg-[#7C5CFF] text-[#0F172A] dark:text-white font-black text-[13px] shadow-none active:scale-95 transition-all duration-300"
                        >
                          Add Expense
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    /* Filled Expenses List */
                    <div className="space-y-3">
                      <AnimatePresence initial={false}>
                        {expenses.map((expense) => (
                          <motion.div
                            key={expense.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                            className="rounded-[20px] bg-white dark:bg-zinc-900 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_20px_rgba(0,0,0,0.24)] relative"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className={`h-11 w-11 rounded-full bg-linear-to-tr ${getCategoryColor(expense.category)} flex items-center justify-center border-0 shrink-0`}>
                                  {getCategoryIcon(expense.category)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5
                                    onClick={(e) =>
                                      expense.title.length > 20 && showTooltip(expense.id, expense.title, 'title', e.currentTarget as HTMLElement)
                                    }
                                    className={`text-[14px] font-black leading-tight text-[#0F172A] dark:text-[#F8FAF6] truncate ${expense.title.length > 20 ? 'cursor-pointer hover:opacity-70' : ''}`}
                                    title={expense.title}
                                  >
                                    {expense.title}
                                  </h5>
                                  <p
                                    onClick={(e) => {
                                      const categoryDate = `${expense.category} • ${expense.date}`;
                                      categoryDate.length > 25 && showTooltip(expense.id, categoryDate, 'category', e.currentTarget as HTMLElement);
                                    }}
                                    className={`mt-0.5 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] truncate ${`${expense.category} • ${expense.date}`.length > 25 ? 'cursor-pointer hover:opacity-70' : ''}`}
                                    title={`${expense.category} • ${expense.date}`}
                                  >
                                    {expense.category} • {expense.date}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right">
                                  <p className="text-[15px] font-black text-[#0F172A] dark:text-[#F8FAF6]">
                                    -₹{expense.amount.toLocaleString('en-IN')}
                                  </p>
                                  <p
                                    onClick={(e) => expense.time.length > 10 && showTooltip(expense.id, expense.time, 'time', e.currentTarget as HTMLElement)}
                                    className={`text-[9px] font-bold text-[#64748B] dark:text-[#94A3B8] opacity-75 mt-0.5 ${expense.time.length > 10 ? 'cursor-pointer hover:opacity-100' : ''}`}
                                    title={expense.time}
                                  >
                                    {expense.time}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setExpenseToDelete(expense)}
                                  className="grid h-10 w-10 place-items-center rounded-full bg-black/5 text-[#EF4444] transition active:scale-95 dark:bg-white/5"
                                  aria-label={`Delete ${expense.title}`}
                                >
                                  <Trash2 size={16} strokeWidth={2} />
                                </button>
                              </div>
                            </div>

                            {/* tooltip removed from per-item render */}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </AnimatePresence>
              </section>
            </motion.div>
          </div>

          {/* 8. BOTTOM FLOATING NAVIGATION DOCK */}
          <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-95 bg-white/70 dark:bg-zinc-950/75 border border-black/4 dark:border-white/10 backdrop-blur-xl rounded-full px-4 py-3 flex items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.05)] z-40">
            {[
              { id: 'home', label: 'Home', icon: <Wallet size={18} strokeWidth={1.5} /> },
              { id: 'expenses', label: 'Expenses', icon: <TrendingDown size={18} strokeWidth={1.5} /> },
              { id: 'groups', label: 'Groups', icon: <Share2 size={18} strokeWidth={1.5} /> },
              { id: 'friends', label: 'Friends', icon: <UserPlus size={18} strokeWidth={1.5} /> },
              { id: 'profile', label: 'Profile', icon: <Sliders size={18} strokeWidth={1.5} /> },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'expenses') {
                      setIsAddSheetOpen(true);
                    }
                  }}
                  className="relative flex min-w-12 flex-col items-center justify-center rounded-full p-2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAF6] active:scale-95 transition-all duration-300"
                  aria-label={tab.label}
                >
                  {/* Sliding glowing layoutId indicator pill */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 rounded-full bg-[#7C5CFF]/10 dark:bg-[#7C5CFF]/20 border border-[#7C5CFF]/15"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className={`${isActive ? 'text-[#7C5CFF] scale-105' : ''} transition-all duration-300`}>
                    {tab.icon}
                  </span>
                </button>
              );
            })}
          </nav>
        </motion.div>
      )}

      {/* 9. ADD EXPENSE BOTTOM SHEET MODAL */}
      <AnimatePresence>
        {isAddSheetOpen && (
          <>
            {/* Dark glassmorphic backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
            />

            {/* Slide up sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-107.5 bg-[#FAF9F5] dark:bg-[#0E0E10] border-t border-black/5 dark:border-white/10 rounded-t-4xl p-6 pb-[calc(env(safe-area-inset-bottom,0)+24px)] z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[18px] font-black">Add Expense</h3>
                <button
                  onClick={() => setIsAddSheetOpen(false)}
                  className="h-8 w-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] active:scale-90 transition-all duration-300"
                  aria-label="Close sheet"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>

                <form onSubmit={handleAddExpense} className="space-y-5">
                {/* Large Premium Numeric Amount display */}
                <div className="space-y-4 mt-2">
                  <label htmlFor="modal-amount-input" className="text-[11px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                    Amount
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[28px] font-black text-[#64748B] dark:text-[#94A3B8]">₹</span>
                    <input
                      id="modal-amount-input"
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="0"
                      value={newAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setNewAmount(val ? Number(val).toLocaleString('en-IN') : '');
                      }}
                      className="w-full mt-1.5 rounded-[22px] border border-black/6 bg-white px-5 py-4 pb-4.5 pl-12 text-[28px] font-black text-foreground shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)] outline-none transition focus:border-[#7C5CFF]/50 focus:ring-4 focus:ring-[#7C5CFF]/10 dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                </div>

                {/* Expense Title */}
                <div className="space-y-4 mt-2">
                  <label htmlFor="modal-title-input" className="text-[11px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    id="modal-title-input"
                    type="text"
                    required
                    placeholder="e.g. Starbucks Coffee"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full mt-1.5 rounded-[18px] border border-black/6 bg-white px-4 py-3.5 text-[14px] font-bold text-foreground shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)] outline-none transition focus:border-[#7C5CFF]/50 focus:ring-4 focus:ring-[#7C5CFF]/10 dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                {/* Category selectors */}
                <div className="space-y-4 mt-2">
                  <span className="block mb-1.5 text-[11px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                    Category
                  </span>
                  <div className="grid grid-cols-4 gap-x-4 gap-y-4 place-items-center">
                    {[
                      { id: 'Food', label: 'Food', icon: <Utensils size={20} strokeWidth={1.5} /> },
                      { id: 'Transport', label: 'Transport', icon: <Car size={20} strokeWidth={1.5} /> },
                      { id: 'Shopping', label: 'Shopping', icon: <ShoppingBag size={20} strokeWidth={1.5} /> },
                      { id: 'Bills', label: 'Bills', icon: <ReceiptText size={20} strokeWidth={1.5} /> },
                      { id: 'Entertainment', label: 'Fun', icon: <Clapperboard size={20} strokeWidth={1.5} /> },
                      { id: 'Health', label: 'Health', icon: <HeartPulse size={20} strokeWidth={1.5} /> },
                      { id: 'Education', label: 'Education', icon: <GraduationCap size={20} strokeWidth={1.5} /> },
                      { id: 'Others', label: 'Other', icon: <Tag size={20} strokeWidth={1.5} /> },
                    ].map((cat) => {
                      const isSelected = newCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNewCategory(cat.id as any)}
                          className={`h-14 w-14 rounded-full border flex items-center justify-center transition-all duration-300 active:scale-95 ${
                            isSelected
                              ? 'border-[#7C5CFF] bg-[#7C5CFF]/20 text-[#7C5CFF]'
                              : 'border-black/5 bg-white dark:border-white/5 dark:bg-white/5 text-[#64748B] dark:text-[#94A3B8]'
                          }`}
                          title={cat.label}
                        >
                          {cat.icon}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Note details */}
                <div className="space-y-4 mt-2">
                  <label htmlFor="modal-note-input" className="text-[11px] font-black text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                    Notes (Optional)
                  </label>
                  <input
                    id="modal-note-input"
                    type="text"
                    placeholder="Add a remark..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full mt-1.5 rounded-[18px] border border-black/6 bg-white px-4 py-3 text-[13px] font-semibold text-foreground outline-none transition focus:border-[#7C5CFF]/50 focus:ring-4 focus:ring-[#7C5CFF]/10 dark:border-white/10 dark:bg-white/5"
                  />
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.98 }}
                  disabled={!newTitle.trim() || !newAmount}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-full bg-[#7C5CFF] text-white py-4 text-[15px] font-black shadow-[0_12px_28px_rgba(124,92,255,0.25)] active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all duration-300"
                >
                  <span>Confirm Expense</span>
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expenseToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm"
              onClick={() => setExpenseToDelete(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="fixed left-1/2 top-1/2 z-70 w-[calc(100%-32px)] max-w-90 -translate-x-1/2 -translate-y-1/2 rounded-[28px] bg-[#FAF9F5] p-6 text-[#0F172A] shadow-[0_24px_60px_rgba(0,0,0,0.28)] dark:bg-[#0E0E10] dark:text-[#F8FAF6]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-red-500/10 text-red-500">
                  <Trash2 size={18} strokeWidth={2.25} />
                </div>
                <div>
                  <h3 className="text-[18px] font-black">Delete expense?</h3>
                  <p className="text-[12px] font-medium text-[#64748B] dark:text-[#94A3B8]">
                    This will remove “{expenseToDelete.title}” permanently.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setExpenseToDelete(null)}
                  className="flex-1 rounded-full border border-black/10 bg-white px-4 py-3 text-[14px] font-bold text-[#0F172A] transition active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-[#F8FAF6]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteExpense(expenseToDelete.id)}
                  className="flex-1 rounded-full bg-red-500 px-4 py-3 text-[14px] font-black text-white transition active:scale-95"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
