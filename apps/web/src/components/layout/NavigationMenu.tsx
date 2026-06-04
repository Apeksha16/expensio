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
  Grid,
  Target,
  Users,
  FolderHeart,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Search,
  Moon,
  Sun,
  Shield,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { supabase } from '../../lib/supabase';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  style: 'slide' | 'overlay' | 'sheet' | 'dropdown';
  showToast: (msg: string) => void;
  // Profile preferences props shifted from dashboard
  biometricsActive: boolean;
  setBiometricsActive: (val: boolean) => void;
  highContrastActive: boolean;
  setHighContrastActive: (val: boolean) => void;
  offlineCacheActive: boolean;
  setOfflineCacheActive: (val: boolean) => void;
  navStyle: 'slide' | 'overlay' | 'sheet' | 'dropdown';
  handleSetNavStyle: (val: 'slide' | 'overlay' | 'sheet' | 'dropdown') => void;
}

export default function NavigationMenu({
  isOpen,
  onClose,
  style,
  showToast,
  biometricsActive,
  setBiometricsActive,
  highContrastActive,
  setHighContrastActive,
  offlineCacheActive,
  setOfflineCacheActive,
  navStyle,
  handleSetNavStyle,
}: NavigationMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  const displayName = user?.name || 'Admin';

  const menuItems = [
    { label: 'Dashboard', icon: Home, path: '/dashboard', active: pathname === '/dashboard' },
    { label: 'Expenses', icon: TrendingDown, path: '/expenses', active: pathname === '/expenses' },
    { label: 'Budgets', icon: PieChart, path: '/budgets', active: pathname === '/budgets' },
    { label: 'Reports', icon: BarChart3, path: '/dashboard?tab=overview', active: false },
    { label: 'Transactions', icon: History, path: '/expenses', active: false },
    { label: 'Categories', icon: Grid, path: '/dashboard?tab=overview', active: false },
    { label: 'Goals', icon: Target, path: '/budgets', active: false },
    { label: 'Friends', icon: Users, path: '/friends', active: pathname === '/friends' },
    { label: 'Groups', icon: FolderHeart, path: '/groups', active: pathname === '/groups' },
    { label: 'Settings', icon: '/settings', path: '/settings', active: pathname === '/settings' },
    { label: 'Help & Support', icon: HelpCircle, path: 'toast', active: false },
  ];

  const filteredItems = menuItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleItemClick = (item: (typeof menuItems)[0]) => {
    onClose();
    if (item.path === 'toast') {
      showToast('Support Center: A help request ticket has been dispatched!');
      return;
    }

    // Custom simulated feedback on secondary routes
    if (item.label === 'Reports') {
      showToast('Navigating to Reports (Simulated in Dashboard Overview)');
    } else if (item.label === 'Transactions') {
      showToast('Navigating to Transactions (Simulated in Expenses List)');
    } else if (item.label === 'Categories') {
      showToast('Navigating to Categories (Simulated in Overview Chart)');
    } else if (item.label === 'Goals') {
      showToast('Navigating to Goals (Simulated in Budgets Layout)');
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
      <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-500 to-cyan-550 flex items-center justify-center font-black text-white text-xs shadow-md shadow-indigo-500/10">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
              {displayName}
            </span>
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550">
              Active Session
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 dark:text-zinc-500 cursor-pointer outline-none border-0 bg-transparent"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 pr-0.5 space-y-5 scrollbar-thin">
        {/* Navigation Links Group */}
        <div className="space-y-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon === '/settings' ? Settings : item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                  item.active
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'bg-transparent text-zinc-650 dark:text-zinc-400 hover:bg-zinc-55 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${item.active ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-550'}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-px bg-zinc-100 dark:bg-zinc-900/60 my-2" />

        {/* Profile Preferences Group */}
        <div className="space-y-3.5">
          <span className="text-[9.5px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1">
            Preferences & Settings
          </span>

          <div className="rounded-2xl border border-zinc-800 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 p-3.5 space-y-4 shadow-sm">
            {/* Biometrics Switch */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                    Biometrics
                  </span>
                  <span className="text-[8px] text-zinc-400 dark:text-zinc-500">
                    Touch ID / Face ID
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBiometricsActive(!biometricsActive);
                  showToast(biometricsActive ? 'Biometrics turned off' : 'Biometrics activated!');
                }}
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${biometricsActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* High Contrast Mode Switch */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                    Contrast Mode
                  </span>
                  <span className="text-[8px] text-zinc-400 dark:text-zinc-500">
                    Boost readability
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHighContrastActive(!highContrastActive);
                  showToast(
                    highContrastActive ? 'High Contrast deactivated' : 'High Contrast active!'
                  );
                }}
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${highContrastActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Service Worker Offline Storage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                    Offline Cache
                  </span>
                  <span className="text-[8px] text-zinc-400 dark:text-zinc-500">
                    PWA offline access
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOfflineCacheActive(!offlineCacheActive);
                  showToast(
                    offlineCacheActive ? 'Offline cache disabled' : 'Offline PWA caching active!'
                  );
                }}
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${offlineCacheActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black text-rose-600 dark:text-rose-500 hover:bg-rose-500/10 active:scale-[0.98] transition-all cursor-pointer border border-rose-500/20 bg-rose-500/5 shrink-0 mt-3"
      >
        <LogOut className="w-4 h-4 text-rose-500" />
        <span>Logout Session</span>
      </button>
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
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Menu & Preferences
        </span>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 dark:text-zinc-550 cursor-pointer outline-none border-0 bg-transparent"
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
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs font-semibold text-zinc-850 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-550 transition-colors"
        />
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 scrollbar-none pb-4">
        {/* Left Side: Navigation Links */}
        <div className="space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1 block">
            Menu Navigation
          </span>
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item, idx) => {
              const Icon = item.icon === '/settings' ? Settings : item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleItemClick(item)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer gap-2 ${
                    item.active
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                      : 'bg-white dark:bg-zinc-900/40 border-zinc-800/70 dark:border-zinc-800/80 text-zinc-650 dark:text-zinc-400 hover:border-zinc-300 hover:text-zinc-800'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      item.active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[9.5px] font-black uppercase tracking-wider">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Profile preferences */}
        <div className="space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550 px-1 block font-extrabold">
            Preferences & Layout
          </span>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/20 p-4 space-y-4 shadow-sm">
            {/* Toggles */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Biometrics Authentication
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                    Touch ID / Face ID logs
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBiometricsActive(!biometricsActive);
                  showToast(biometricsActive ? 'Biometrics turned off' : 'Biometrics activated!');
                }}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${biometricsActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    High Contrast Mode
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
                    Boost readability metrics
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHighContrastActive(!highContrastActive);
                  showToast(
                    highContrastActive ? 'High Contrast deactivated' : 'High Contrast active!'
                  );
                }}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${highContrastActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Offline Storage Cache
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-550">
                    Full offline accessibility
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOfflineCacheActive(!offlineCacheActive);
                  showToast(
                    offlineCacheActive ? 'Offline cache disabled' : 'Offline PWA caching active!'
                  );
                }}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${offlineCacheActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>

          {/* Style Selector inside overlay */}
          <div className="space-y-3 pt-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550 px-1">
              Navigation Layout Menu
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { style: 'slide', label: 'Slide' },
                { style: 'overlay', label: 'Overlay' },
                { style: 'sheet', label: 'Sheet' },
                { style: 'dropdown', label: 'Dropdown' },
              ].map((item) => (
                <button
                  key={item.style}
                  type="button"
                  onClick={() => handleSetNavStyle(item.style as any)}
                  className={`py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    navStyle === item.style
                      ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-[0_2px_8px_rgba(99,102,241,0.15)]'
                      : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-550 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20 active:scale-98 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 mt-4"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out from Account</span>
      </button>
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
      <div className="w-12 h-1 rounded-full bg-zinc-800 dark:bg-zinc-800 mx-auto mb-4 shrink-0" />

      <div className="flex justify-between items-center pb-3.5 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Quick Navigation
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-pointer outline-none border-0 bg-transparent"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 pr-0.5 space-y-5.5 scrollbar-thin">
        <div className="grid grid-cols-3 gap-2.5">
          {menuItems.map((item, idx) => {
            const Icon = item.icon === '/settings' ? Settings : item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleItemClick(item)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer gap-1.5 ${
                  item.active
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                    : 'bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-850/60 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.active
                      ? 'bg-indigo-600 text-white'
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

        <div className="h-px bg-zinc-100 dark:bg-zinc-900/60" />

        <div className="space-y-3.5">
          <span className="text-[9.5px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1 font-bold">
            Preferences
          </span>
          <div className="rounded-2xl border border-zinc-800 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 p-3 space-y-3.5 shadow-sm">
            {/* Toggles */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2.5">
                <Shield className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                  Biometrics ID
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBiometricsActive(!biometricsActive);
                  showToast(biometricsActive ? 'Biometrics turned off' : 'Biometrics activated!');
                }}
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${biometricsActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                  Contrast Mode
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHighContrastActive(!highContrastActive);
                  showToast(
                    highContrastActive ? 'High Contrast deactivated' : 'High Contrast active!'
                  );
                }}
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${highContrastActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                  Offline Cache
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOfflineCacheActive(!offlineCacheActive);
                  showToast(
                    offlineCacheActive ? 'Offline cache disabled' : 'Offline PWA caching active!'
                  );
                }}
                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${offlineCacheActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>
        </div>

        {/* Layout style */}
        <div className="space-y-3">
          <span className="text-[9.5px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 px-1 font-bold">
            Navigation Layout Style
          </span>
          <div className="grid grid-cols-4 gap-2">
            {[
              { style: 'slide', label: 'Slide' },
              { style: 'overlay', label: 'Overlay' },
              { style: 'sheet', label: 'Sheet' },
              { style: 'dropdown', label: 'Dropdown' },
            ].map((item) => (
              <button
                key={item.style}
                type="button"
                onClick={() => handleSetNavStyle(item.style as any)}
                className={`py-2 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  navStyle === item.style
                    ? 'bg-indigo-600 text-white border-indigo-500/30 shadow-[0_2px_8px_rgba(99,102,241,0.15)]'
                    : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-550 hover:bg-zinc-200/50 dark:hover:bg-zinc-900/60 hover:text-zinc-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-500 font-bold border border-rose-500/20 active:scale-98 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm mt-4 shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Reset Store & Log Out</span>
        </button>
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
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 truncate leading-tight">
            {displayName}
          </span>
          <span className="text-[8.5px] text-zinc-400 dark:text-zinc-550 truncate font-bold leading-tight">
            {user?.email || 'admin@expensio.app'}
          </span>
        </div>
      </div>

      {/* Scrollable menu options */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4.5 scrollbar-thin pr-0.5">
        {/* Navigation links */}
        <div className="space-y-0.5">
          {menuItems.map((item, idx) => {
            const Icon = item.icon === '/settings' ? Settings : item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[10.5px] font-black transition-all cursor-pointer border-0 ${
                  item.active
                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                    : 'bg-transparent text-zinc-650 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100'
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

        <div className="h-px bg-zinc-100 dark:bg-zinc-900/60" />

        {/* Preferences */}
        <div className="space-y-2">
          <span className="text-[8.5px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550 px-1 block">
            Preferences & Settings
          </span>
          <div className="rounded-xl border border-zinc-800 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 p-2.5 space-y-3">
            {/* Biometrics */}
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-550" />
                <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                  Biometrics ID
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBiometricsActive(!biometricsActive);
                  showToast(biometricsActive ? 'Biometrics turned off' : 'Biometrics activated!');
                }}
                className={`w-7.5 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${biometricsActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Contrast */}
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-550" />
                <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                  Contrast Mode
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHighContrastActive(!highContrastActive);
                  showToast(
                    highContrastActive ? 'High Contrast deactivated' : 'High Contrast active!'
                  );
                }}
                className={`w-7.5 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${highContrastActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>

            {/* Offline Cache */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-550" />
                <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                  Offline Cache
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOfflineCacheActive(!offlineCacheActive);
                  showToast(
                    offlineCacheActive ? 'Offline cache disabled' : 'Offline PWA caching active!'
                  );
                }}
                className={`w-7.5 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center cursor-pointer border-0 ${offlineCacheActive ? 'bg-indigo-600 justify-end' : 'bg-zinc-300 dark:bg-zinc-800 justify-start'}`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
              </button>
            </div>
          </div>
        </div>

        {/* Layout selector */}
        <div className="space-y-2">
          <span className="text-[8.5px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-550 px-1 block">
            Menu Layout Style
          </span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { style: 'slide', label: 'Slide' },
              { style: 'overlay', label: 'Overlay' },
              { style: 'sheet', label: 'Sheet' },
              { style: 'dropdown', label: 'Dropdown' },
            ].map((item) => (
              <button
                key={item.style}
                type="button"
                onClick={() => handleSetNavStyle(item.style as any)}
                className={`py-2 rounded-xl border text-[8.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  navStyle === item.style
                    ? 'bg-indigo-600 text-white border-indigo-500/20 shadow-xs'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-800/70 dark:border-zinc-800/80 text-zinc-600 dark:text-zinc-500 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logout footer */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black text-rose-600 dark:text-rose-500 hover:bg-rose-500/10 active:scale-[0.98] transition-all cursor-pointer border border-rose-500/20 bg-rose-500/5 shrink-0 mt-3"
      >
        <LogOut className="w-3.5 h-3.5 text-rose-500" />
        <span>Logout Session</span>
      </button>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 overflow-hidden rounded-[40px] pointer-events-auto">
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
