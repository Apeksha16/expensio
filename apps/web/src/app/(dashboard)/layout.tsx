'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import MobileHeader from '../../components/layout/MobileHeader';
import BottomNavigation from '../../components/layout/BottomNavigation';
import BottomSheet from '../../components/shared/BottomSheet';
import NavigationMenu from '../../components/layout/NavigationMenu';
import { useFinanceStore } from '../../store/finance-store';
import { useAuthStore } from '../../store/auth-store';
import { useShallow } from 'zustand/react/shallow';
import {
  Coffee,
  Car,
  Tv,
  ShoppingBag,
  Zap,
  HelpCircle,
  Calendar,
  Heart,
  GraduationCap,
  CreditCard,
  Share2,
  User,
  Mail,
  Shield,
  LogOut,
  Settings,
  Check,
  AlertTriangle,
  Smartphone,
  Sparkles,
  Plus,
  Menu,
  ChevronDown,
  UtensilsCrossed,
  TrendingUp,
  Handshake,
  Home,
  Plane,
  Gift,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') || 'home';

  const {
    friends,
    addExpense,
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isProfileOpen,
    setIsProfileOpen,
    isExpensesSelectionActive,
  } = useFinanceStore(
    useShallow((state) => ({
      friends: state.friends,
      addExpense: state.addExpense,
      isAddExpenseOpen: state.isAddExpenseOpen,
      setIsAddExpenseOpen: state.setIsAddExpenseOpen,
      isNotificationsOpen: state.isNotificationsOpen,
      setIsNotificationsOpen: state.setIsNotificationsOpen,
      isProfileOpen: state.isProfileOpen,
      setIsProfileOpen: state.setIsProfileOpen,
      isExpensesSelectionActive: state.isExpensesSelectionActive,
    }))
  );
  const { user, session, isInitialized, isLoading } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      session: state.session,
      isInitialized: state.isInitialized,
      isLoading: state.isLoading,
    }))
  );

  const showFAB = pathname === '/dashboard' ? tab === 'home' : !isExpensesSelectionActive;

  // Form State
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [splitWith, setSplitWith] = useState<string[]>([]);

  // Notifications interactive state
  const [notifications, setNotifications] = useState([
    {
      id: 'n1',
      title: 'Owe Split Request',
      desc: 'Rahul Sharma owes you ₹37.50 for Goa trip splits.',
      time: '1h ago',
      category: 'split',
      dismissed: false,
    },
    {
      id: 'n2',
      title: 'Budget Limit Warning',
      desc: 'You used 34% of your Transport monthly allocation.',
      time: '4h ago',
      category: 'alert',
      dismissed: false,
    },
    {
      id: 'n3',
      title: 'Transaction Confirmed',
      desc: 'Verified direct salary deposit credit of +₹2,800.00.',
      time: '1d ago',
      category: 'income',
      dismissed: false,
    },
    {
      id: 'n4',
      title: 'Active Goa Group splits',
      desc: 'Rahul Sharma added Hotel Booking (₹600.00) in Goa group.',
      time: '2d ago',
      category: 'group',
      dismissed: false,
    },
  ]);

  // Profile preferences
  const [biometricsActive, setBiometricsActive] = useState(true);
  const [highContrastActive, setHighContrastActive] = useState(false);
  const [offlineCacheActive, setOfflineCacheActive] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);

  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [navStyle, setNavStyle] = useState<'slide' | 'overlay' | 'sheet' | 'dropdown'>('slide');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStyle = localStorage.getItem('navStyle') as any;
      if (savedStyle && ['slide', 'overlay', 'sheet', 'dropdown'].includes(savedStyle)) {
        setNavStyle(savedStyle);
      }
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100dvh';
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  const handleSetNavStyle = (style: 'slide' | 'overlay' | 'sheet' | 'dropdown') => {
    setNavStyle(style);
    if (typeof window !== 'undefined') {
      localStorage.setItem('navStyle', style);
    }
  };

  const effectiveUser =
    user ??
    (session?.user
      ? {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.user_metadata?.full_name || '',
          avatarUrl: session.user.user_metadata?.avatar_url || '',
          monthlySalary: (session.user.user_metadata as any)?.monthlySalary || null,
          isOnboardingCompleted:
            (session.user.user_metadata as any)?.isOnboardingCompleted ||
            (session.user.user_metadata as any)?.isOnboarded ||
            false,
          createdAt: new Date(session.user.created_at),
        }
      : null);

  // Custom Splits Configuration states
  const [splitType, setSplitType] = useState<'equal' | 'percentage'>('equal');
  const [splitPercentages, setSplitPercentages] = useState<Record<string, number>>({ me: 100 });

  const redistributeEqually = (currentSplitWith: string[]) => {
    const totalPeople = currentSplitWith.length + 1; // friends + me
    const equalShare = Math.floor(100 / totalPeople);
    const remainder = 100 - equalShare * totalPeople;

    const newPercentages: Record<string, number> = {};
    newPercentages['me'] = equalShare + remainder; // Give remainder to 'me'
    currentSplitWith.forEach((name) => {
      newPercentages[name] = equalShare;
    });

    setSplitPercentages(newPercentages);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, dismissed: true } : n)));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || !title) return;

    const isSplit = splitWith.length > 0;
    const finalSplitType = isSplit ? splitType : undefined;
    const finalSplitPercentages =
      isSplit && splitType === 'percentage' ? splitPercentages : undefined;

    // Validate percentage split sum equals 100%
    if (isSplit && splitType === 'percentage') {
      const totalSum = Object.values(splitPercentages).reduce((acc, curr) => acc + curr, 0);
      if (totalSum !== 100) {
        alert(
          `Split percentage sum must be exactly 100% (currently ${totalSum}%). Please balance the split!`
        );
        return;
      }
    }

    addExpense({
      title,
      amount: Number(amount),
      category,
      date,
      note,
      paidBy: 'me',
      splitWith: isSplit ? splitWith : undefined,
      splitType: finalSplitType,
      splitPercentages: finalSplitPercentages,
      paymentMethod,
    });

    // Reset Form
    setAmount('');
    setTitle('');
    setCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setPaymentMethod('Credit Card');
    setSplitWith([]);
    setSplitType('equal');
    setSplitPercentages({ me: 100 });
    setIsAddExpenseOpen(false);
  };

  const handleFriendToggle = (friendName: string) => {
    let newSplitWith = [];
    if (splitWith.includes(friendName)) {
      newSplitWith = splitWith.filter((name) => name !== friendName);
    } else {
      newSplitWith = [...splitWith, friendName];
    }
    setSplitWith(newSplitWith);
    redistributeEqually(newSplitWith);
  };

  // 3x3/4x2 Squircle selector categories matching mockup screen exactly!
  const categories = [
    {
      name: 'Food',
      icon: UtensilsCrossed,
      bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      name: 'Shopping',
      icon: ShoppingBag,
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      name: 'Bills & Utilities',
      icon: Zap,
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    {
      name: 'Health',
      icon: Heart,
      bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    },
    {
      name: 'Investments',
      icon: TrendingUp,
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      name: 'Entertainment',
      icon: Tv,
      bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      name: 'Education',
      icon: GraduationCap,
      bg: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    },
    {
      name: 'Transport',
      icon: Car,
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-550 border-amber-500/20',
    },
    {
      name: 'Credit Card',
      icon: CreditCard,
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
    {
      name: 'Udhaari',
      icon: Handshake,
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
    {
      name: 'Rent',
      icon: Home,
      bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      name: 'Travel',
      icon: Plane,
      bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    },
    {
      name: 'Gifts',
      icon: Gift,
      bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    },
    {
      name: 'Others',
      icon: HelpCircle,
      bg: 'bg-zinc-800/40 text-zinc-550 dark:text-zinc-400 border-zinc-800/40',
    },
  ];

  return (
    <div className="h-[100dvh] w-full bg-background text-theme-text flex justify-center overflow-hidden relative transition-colors duration-300">
      {/* ambient glows */}
      <div className="absolute top-[-20%] left-[-20%] w-150 h-150 bg-indigo-600/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-150 h-150 bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Responsive Canvas PWA Frame Shell */}
      <div className="w-full max-w-md h-full flex flex-col bg-shell border-x border-theme-border shadow-2xl relative overflow-hidden transition-colors duration-300">
        {/* Mobile Header */}
        <MobileHeader onMenuClick={() => setIsNavMenuOpen(true)} />

        {/* Child Screen */}
        <main className="flex-1 h-0 min-h-0 px-6 py-6 pb-28 overflow-y-auto overflow-x-hidden scrollbar-thin">
          {children}
        </main>

        {/* Floating Action Button (FAB) in Bottom Right (Fixed Viewport Docked) */}
        {showFAB && (
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="fixed bottom-24 right-5 sm:right-auto sm:left-[calc(50%+156px)] w-14 h-14 rounded-full bg-linear-to-br from-indigo-400 via-violet-500 to-cyan-500 flex items-center justify-center text-zinc-950 shadow-[0_8px_32px_rgba(99,102,241,0.35)] hover:shadow-[0_8px_32px_rgba(34,211,238,0.55)] active:scale-90 hover:scale-110 active:shadow-[0_4px_16px_rgba(99,102,241,0.6)] transition-all duration-300 border border-indigo-300/50 z-50 cursor-pointer group"
            aria-label="Add Expense"
          >
            {/* Internal neon ambient glow aura */}
            <div className="absolute inset-0.5 rounded-full bg-linear-to-tr from-white/20 to-transparent opacity-100 border border-white/30 -z-10 group-hover:scale-105 transition-transform duration-300" />

            {/* Gorgeous spinning plus icon */}
            <Plus className="w-7 h-7 text-zinc-950 stroke-[3.5] transition-transform duration-500 ease-out group-hover:rotate-180" />
          </button>
        )}

        {/* Bottom Navigation */}
        <BottomNavigation />

        {/* Navigation Menu (supports slide, overlay, sheet, dropdown styles) */}
        <NavigationMenu
          isOpen={isNavMenuOpen}
          onClose={() => setIsNavMenuOpen(false)}
          style="slide"
          showToast={showToast}
          biometricsActive={biometricsActive}
          setBiometricsActive={setBiometricsActive}
          highContrastActive={highContrastActive}
          setHighContrastActive={setHighContrastActive}
          offlineCacheActive={offlineCacheActive}
          setOfflineCacheActive={setOfflineCacheActive}
          navStyle="slide"
          handleSetNavStyle={handleSetNavStyle}
        />
      </div>

      {/* Upgraded Add Expense Bottom Sheet Modal with Squircle Grid */}
      <BottomSheet
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Add Expense"
      >
        <form onSubmit={handleAddExpenseSubmit} className="space-y-8">
          {/* Big Amount font */}
          <div className="flex flex-col items-center gap-2 py-5 border-b border-theme-border/60">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
              Bill Value
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-3xl font-extrabold text-indigo-600 dark:text-cyan-400">₹</span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-5xl font-black text-zinc-900 dark:text-zinc-100 bg-transparent text-center focus:outline-none placeholder-zinc-300 dark:placeholder-zinc-800 w-64 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Squircle 4x2 Category Grid exactly from the mockup screenshot! */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
              Select Category
            </label>
            <div className="grid grid-cols-4 gap-3">
              {categories.map((cat) => {
                const isSelected = category === cat.name;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex flex-col items-center justify-center p-3 rounded-[22px] border transition-all duration-300 cursor-pointer gap-2 ${
                      isSelected
                        ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-500/10 scale-105 shadow-[0_4px_20px_rgba(99,102,241,0.12)]'
                        : 'bg-zinc-100/80 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/30 text-zinc-500 dark:text-zinc-450 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <motion.div
                      className={`w-9 h-9 rounded-[14px] flex items-center justify-center shadow-inner ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/40'
                      }`}
                      whileTap={{ scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </motion.div>
                    <span
                      className={`font-black uppercase tracking-tight text-center leading-none max-w-full break-words ${
                        cat.name.length > 9 ? 'text-[7.5px]' : 'text-[8.5px]'
                      }`}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
              Merchant / Description
            </label>
            <input
              type="text"
              placeholder="e.g. McDonald's"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl bg-zinc-100/85 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/20 focus:outline-none focus:ring-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-550 transition-colors"
              required
            />
          </div>

          {/* Split checks */}
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
              Split Expense (Equally)
            </label>
            {friends.length === 0 ? (
              <span className="text-xs text-zinc-550 italic">
                No friend contacts found. Add friends first!
              </span>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-none">
                {friends.map((friend) => {
                  const isChecked = splitWith.includes(friend.name);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      onClick={() => handleFriendToggle(friend.name)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border font-bold text-xs transition-all duration-300 shrink-0 cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/35 ring-1 ring-indigo-500/30 shadow-[0_2px_12px_rgba(99,102,241,0.08)]'
                          : 'bg-zinc-100/80 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800/30 text-zinc-500 dark:text-zinc-450 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <motion.div
                        className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center text-[9px] font-black shadow-inner ${
                          isChecked
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-zinc-950/80 border border-zinc-200/80 dark:border-zinc-800/40'
                        }`}
                        whileTap={{ scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                      >
                        {friend.avatar}
                      </motion.div>
                      <span>{friend.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Date, payment method, note grid */}
          <div className="grid grid-cols-2 gap-5">
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
                Date & Time
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-450 dark:text-zinc-550 absolute left-3.5 top-4" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-zinc-100/85 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/20 focus:outline-none focus:ring-1 text-xs font-semibold text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-555 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
                Payment Method
              </label>
              <button
                type="button"
                onClick={() => setIsPaymentDropdownOpen(!isPaymentDropdownOpen)}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-100/85 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs font-semibold text-zinc-100 dark:text-zinc-100 transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>{paymentMethod}</span>
                <ChevronDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              </button>

              {isPaymentDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsPaymentDropdownOpen(false)}
                  />
                  <div className="absolute top-[72px] left-0 right-0 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-900 shadow-xl rounded-2xl p-1.5 z-50 flex flex-col select-none animate-fade-in">
                    {['Credit Card', 'Debit Card', 'Cash', 'UPI'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method);
                          setIsPaymentDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                          paymentMethod === method
                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black'
                            : 'bg-transparent text-zinc-650 dark:text-zinc-450 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
              Add Note (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Lunch with friends"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-5 py-3.5 rounded-2xl bg-zinc-100/85 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 focus:ring-indigo-500/20 focus:outline-none focus:ring-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-550 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4.5 rounded-2xl bg-linear-to-tr from-indigo-500 to-cyan-500 text-white font-bold text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-500/10 active:scale-98 transition-all border border-emerald-300/20 cursor-pointer shadow-md"
          >
            Save Expense
          </button>
        </form>
      </BottomSheet>

      {/* Notifications Module Bottom Sheet */}
      <BottomSheet
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        title="Alerts & Notifications"
      >
        <div className="space-y-4 relative">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-theme-secondary">
              Inbox
            </span>
            <button
              onClick={() => {
                setNotifications(notifications.map((n) => ({ ...n, dismissed: true })));
                showToast('All notifications cleared!');
              }}
              className="text-[9px] font-bold text-theme-secondary hover:text-indigo-500 uppercase tracking-wide cursor-pointer border-0 bg-transparent"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-0.5 scrollbar-thin">
            {notifications.filter((n) => !n.dismissed).length === 0 ? (
              <div className="p-12 rounded-3xl border border-theme-card-border bg-theme-card relative overflow-hidden flex flex-col items-center justify-center gap-3.5 text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500 shrink-0">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-theme-text">All caught up!</span>
                  <p className="text-[10px] text-theme-secondary">
                    No unread splits or active warnings found.
                  </p>
                </div>
              </div>
            ) : (
              notifications
                .filter((n) => !n.dismissed)
                .map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-theme-card-border bg-theme-card/65 hover:bg-theme-card/85 relative overflow-hidden flex flex-col gap-2.5 transition-colors shadow-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-0.5 max-w-[80%]">
                        <span className="text-xs font-bold text-theme-text">{item.title}</span>
                        <p className="text-[10.5px] text-theme-secondary leading-relaxed mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                      <span className="text-[8px] font-black uppercase text-theme-muted tracking-wider shrink-0">
                        {item.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-theme-border/60 pt-2.5 mt-0.5">
                      <span className="text-[8px] font-black uppercase text-theme-secondary bg-background border border-theme-border/60 px-2 py-0.5 rounded tracking-wide">
                        {item.category}
                      </span>

                      <div className="flex items-center gap-2">
                        {item.category === 'split' && (
                          <button
                            onClick={() => {
                              handleDismissNotification(item.id);
                              showToast('Splits settled successfully!');
                            }}
                            className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold uppercase tracking-wider text-[8px] hover:scale-105 active:scale-95 transition-all cursor-pointer border-0"
                          >
                            Settle
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleDismissNotification(item.id);
                            showToast('Notification dismissed');
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-550 font-bold uppercase tracking-wider text-[8px] hover:text-zinc-100 hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </BottomSheet>

      {/* Global Interactive Notification Toast overlay */}
      {toastMessage && (
        <div className="fixed bottom-20 left-6 right-6 z-200 max-w-sm mx-auto p-4 rounded-xl border border-theme-card-border bg-theme-card backdrop-blur-xl flex items-center gap-3 shadow-xl animate-slide-up">
          <div className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-xs font-semibold text-theme-text">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
