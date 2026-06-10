'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  TrendingDown,
  PieChart,
  BarChart3,
  History,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Search,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { useFinanceStore } from '../../store/finance-store';
import { useDashboardSummary } from '../../hooks/useDashboard';
import { supabase } from '../../lib/supabase';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  style: 'slide' | 'overlay' | 'sheet' | 'dropdown';
  showToast: (msg: string) => void;
}

export default function NavigationMenu({ isOpen, onClose, style, showToast }: NavigationMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: summary } = useDashboardSummary();
  const totalSpent = summary?.expensesThisMonth || 0;

  const limitValue = user?.monthlySalary || 20000;
  const spendPercentage = limitValue > 0 ? (totalSpent / limitValue) * 100 : 0;

  const displayName = user?.name || 'Admin Root';
  const displayEmail = user?.email || 'admin@email.com';

  const menuItems = [
    { label: 'Dashboard', icon: Home, path: '/dashboard', active: pathname === '/dashboard' },
    { label: 'Expenses', icon: TrendingDown, path: '/expenses', active: pathname === '/expenses' },
    { label: 'Budgets', icon: PieChart, path: '/budgets', active: pathname === '/budgets' },
    { label: 'Analytics', icon: BarChart3, path: '/analytics', active: pathname === '/analytics' },
    { label: 'Transactions', icon: History, path: '/expenses', active: false },
    { label: 'Settings', icon: Settings, path: '/settings', active: pathname === '/settings' },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleItemClick = (item: { label: string; path: string }) => {
    onClose();
    if (item.path === 'toast') {
      showToast('Support Center: A help request ticket has been dispatched!');
      return;
    }

    // Custom simulated feedback on secondary routes
    if (item.label === 'Transactions') {
      showToast('Navigating to Transactions (Simulated in Expenses List)');
    }

    router.push(item.path);
  };

  const handleLogout = async () => {
    onClose();
    showToast('Logging out...');
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('expensio-finance-store-v4');
    } catch (e) {
      console.error(e);
    }
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  };

  // Render Slide from Left Menu
  const renderSlideMenu = () => (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: 0 }}
      exit={{ x: '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
      className="absolute top-0 left-0 bottom-0 w-[280px] bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900 shadow-2xl z-55 flex flex-col p-5 h-full select-none"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-black text-white text-xs shadow-md shadow-indigo-500/10 shrink-0">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 truncate">
              {displayName}
            </span>
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 truncate max-w-[150px]">
              {displayEmail}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 dark:text-zinc-500 cursor-pointer outline-none border-0 bg-transparent shrink-0"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Navigation Links Group */}
      <div className="py-4 pr-0.5 space-y-1">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                item.active
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Icon
                className={`w-4 h-4 ${item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic Financial Summary Card to Fill Empty Space */}
      <div className="mt-4 mb-2 mx-1 p-4 rounded-2xl bg-zinc-50/5 dark:bg-zinc-900/40 border border-zinc-100/10 dark:border-zinc-800/60 backdrop-blur-md shrink-0">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Monthly Spend
          </span>
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
            {spendPercentage.toFixed(0)}% Used
          </span>
        </div>
        <div className="flex flex-col gap-0.5 mb-3.5">
          <span className="text-lg font-black text-zinc-800 dark:text-zinc-100">
            ₹
            {totalSpent.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
            {user?.monthlySalary
              ? `Limit: ₹${user.monthlySalary.toLocaleString('en-IN')} / month`
              : 'Add monthly salary in settings'}
          </span>
        </div>
        {/* Sleek Progress Bar */}
        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(spendPercentage, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${
              spendPercentage > 90
                ? 'from-rose-500 to-red-500'
                : spendPercentage > 75
                  ? 'from-amber-500 to-orange-500'
                  : 'from-indigo-500 to-cyan-500'
            }`}
          />
        </div>
      </div>

      {/* Spacer to push footer to the bottom */}
      <div className="flex-grow" />

      {/* Footer Section */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black text-rose-600 dark:text-rose-500 hover:bg-rose-500/10 active:scale-[0.98] transition-all cursor-pointer border border-rose-500/20 bg-rose-500/5"
        >
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>Logout Session</span>
        </button>
        <div className="mt-3 pb-1 text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
          Version {process.env.NEXT_PUBLIC_APP_VERSION || 'v1.0.0'}
        </div>
      </div>
    </motion.div>
  );

  // Render Overlay Menu
  const renderOverlayMenu = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-55 flex flex-col p-6 overflow-y-auto select-none"
    >
      <div className="flex justify-between items-center pb-4 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
          Menu Navigation
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 dark:text-zinc-555 cursor-pointer outline-none border-0 bg-transparent"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Search bar inside overlay */}
      <div className="relative mt-2 mb-4 shrink-0">
        <Search className="w-4.5 h-4.5 text-zinc-400 dark:text-zinc-550 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search navigation options..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs font-semibold text-zinc-850 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-555 transition-colors"
        />
      </div>

      <div className="flex-grow grid grid-cols-2 gap-3 pb-4 overflow-y-auto scrollbar-none">
        {filteredItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleItemClick(item)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer gap-2 ${
                item.active
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-655 dark:text-indigo-400'
                  : 'bg-white dark:bg-zinc-900/40 border-zinc-200/80 dark:border-zinc-800 border-zinc-800/70 dark:border-zinc-800/80 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 hover:text-zinc-100'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  item.active
                    ? 'bg-indigo-650 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800'
                }`}
              >
                <Icon className="w-4.5 h-4.5" />
              </div>
              <span className="text-[9.5px] font-black uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20 active:scale-98 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out from Account</span>
        </button>
        <div className="mt-3 text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
          Version {process.env.NEXT_PUBLIC_APP_VERSION || 'v1.0.0'}
        </div>
      </div>
    </motion.div>
  );

  // Render Bottom Sheet Menu
  const renderSheetMenu = () => (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 240 }}
      className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 rounded-t-[32px] border-t border-zinc-800 dark:border-zinc-900 shadow-2xl z-55 flex flex-col p-5 pb-8 max-h-[85vh] select-none"
    >
      <div className="w-12 h-1 rounded-full bg-zinc-850 dark:bg-zinc-800 mx-auto mb-4 shrink-0" />

      <div className="flex justify-between items-center pb-3.5 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550">
          Quick Navigation
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-pointer outline-none border-0 bg-transparent"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto py-2 pr-0.5 space-y-4 scrollbar-thin">
        <div className="grid grid-cols-3 gap-2.5">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleItemClick(item)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer gap-1.5 ${
                  item.active
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-655 dark:text-indigo-400'
                    : 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-850/60 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.active
                      ? 'bg-indigo-650 text-white'
                      : 'bg-white dark:bg-zinc-950/80 border border-zinc-200/50 dark:border-zinc-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-[8px] font-black uppercase text-center truncate w-full">
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-550 font-bold border border-rose-500/20 active:scale-98 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Reset Store & Log Out</span>
        </button>
        <div className="mt-3 text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
          Version {process.env.NEXT_PUBLIC_APP_VERSION || 'v1.0.0'}
        </div>
      </div>
    </motion.div>
  );

  // Render Dropdown Menu (Anchored top left, near hamburger menu button)
  const renderDropdownMenu = () => (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="absolute top-15 left-6 w-[280px] bg-white dark:bg-zinc-950 border border-zinc-800 dark:border-zinc-900 shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl p-4 z-55 flex flex-col select-none max-h-[75vh] overflow-hidden"
    >
      {/* Profile details card */}
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-900/60 shrink-0">
        <div className="w-8.5 h-8.5 rounded-xl bg-linear-to-tr from-indigo-500 to-cyan-500 p-0.5 shadow-xs shrink-0">
          <div className="w-full h-full rounded-[10px] bg-white dark:bg-zinc-950 flex items-center justify-center">
            <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 truncate leading-tight">
            {displayName}
          </span>
          <span className="text-[8.5px] text-zinc-400 dark:text-zinc-550 truncate font-bold leading-tight">
            {displayEmail}
          </span>
        </div>
      </div>

      {/* Scrollable menu options */}
      <div className="flex-grow overflow-y-auto py-3 space-y-0.5 scrollbar-thin pr-0.5">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10.5px] font-black transition-all cursor-pointer border-0 ${
                item.active
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                  : 'bg-transparent text-zinc-650 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-550'}`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black text-rose-600 dark:text-rose-500 hover:bg-rose-500/10 active:scale-[0.98] transition-all cursor-pointer border border-rose-500/20 bg-rose-500/5 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-500" />
          <span>Logout Session</span>
        </button>
        <div className="mt-3 pb-1 text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">
          Version {process.env.NEXT_PUBLIC_APP_VERSION || 'v1.0.0'}
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-[60] overflow-hidden rounded-[40px] pointer-events-auto">
          {/* Menu Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/20 dark:bg-zinc-950/45 backdrop-blur-[2px] z-50 cursor-pointer"
          />

          {/* Nav Style Renderer */}
          {style === 'slide' && renderSlideMenu()}
          {style === 'overlay' && renderOverlayMenu()}
          {style === 'sheet' && renderSheetMenu()}
          {style === 'dropdown' && renderDropdownMenu()}
        </div>
      )}
    </AnimatePresence>
  );
}
