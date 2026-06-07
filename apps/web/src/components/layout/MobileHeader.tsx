'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, Sun, Moon, Menu, Calendar, Search, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth-store';
import { useFinanceStore } from '../../store/finance-store';
import { useShallow } from 'zustand/react/shallow';
import { useUnreadNotificationCount } from '../../hooks/useNotifications';

interface MobileHeaderProps {
  onMenuClick?: () => void;
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams?.get('tab') || 'home';

  const user = useAuthStore((state) => state.user);
  const { setIsNotificationsOpen, setIsCalendarFilterOpen } = useFinanceStore(
    useShallow((state) => ({
      setIsNotificationsOpen: state.setIsNotificationsOpen,
      setIsCalendarFilterOpen: state.setIsCalendarFilterOpen,
    }))
  );
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count || 0;

  const [greeting, setGreeting] = useState('Hello');
  const [dateStr, setDateStr] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const displayName = user?.name || 'Admin';

  useEffect(() => {
    // Read saved theme
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'light';
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    // Generate dynamic greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Dynamic date formatting (e.g. "Thu, 4 Jun")
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    };
    setDateStr(new Date().toLocaleDateString('en-US', options));
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const isGroupDetail = pathname === '/groups' && searchParams?.get('id');
  if (isGroupDetail) {
    return null;
  }

  const isOverview = pathname === '/dashboard' && tab === 'overview';

  if (isOverview) {
    return (
      <header className="relative z-40 bg-shell/85 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0 transition-colors duration-300">
        {/* Left Action: Back + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1 text-theme-secondary hover:text-theme-text active:scale-95 transition-all outline-none border-0 bg-transparent cursor-pointer"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft className="w-5.5 h-5.5 stroke-[2.5]" />
          </button>
          <h1 className="text-sm font-black text-theme-text uppercase tracking-widest leading-none">
            Overview
          </h1>
        </div>

        {/* Calendar on Right */}
        <button
          onClick={() => setIsCalendarFilterOpen(true)}
          className="p-2 rounded-xl bg-theme-btn border border-theme-btn-border/80 text-theme-secondary hover:text-theme-text cursor-pointer active:scale-95 transition-all outline-none"
          aria-label="Open Calendar Filter"
        >
          <Calendar className="w-4 h-4 stroke-[2.25]" />
        </button>
      </header>
    );
  }

  const getPageTitle = () => {
    switch (pathname) {
      case '/dashboard':
        return 'Dashboard';
      case '/expenses':
        return 'Expenses';
      case '/budgets':
        return 'Budgets';
      case '/friends':
        return 'Friends';
      case '/groups':
        return 'Groups';
      case '/analytics':
        return 'Analytics';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="relative z-40 bg-shell/85 backdrop-blur-md px-6 py-4 flex flex-col gap-3 shrink-0 transition-colors duration-300">
      <div className="flex items-center justify-between w-full">
        {/* Left Action: Hamburger + Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-1 text-theme-secondary hover:text-theme-text active:scale-95 transition-all outline-none border-0 bg-transparent cursor-pointer"
            aria-label="Open Sidebar Menu"
          >
            <Menu className="w-5 h-5 stroke-[2.5]" />
          </button>

          <h1 className="text-sm font-black text-theme-text uppercase tracking-widest leading-none">
            {getPageTitle()}
          </h1>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3">
          {/* Search Button */}
          <button
            className="p-2.5 rounded-xl bg-theme-btn border border-theme-btn-border/80 text-theme-secondary hover:text-theme-text cursor-pointer active:scale-95 transition-all outline-none"
            aria-label="Search transactions"
          >
            <Search className="w-4 h-4 stroke-[2.25]" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-theme-btn border border-theme-btn-border/80 text-theme-secondary hover:text-theme-text cursor-pointer active:scale-95 transition-all outline-none"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 stroke-[2.25]" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500 dark:text-indigo-400 stroke-[2.25]" />
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="p-2.5 rounded-xl bg-theme-btn border border-theme-btn-border/80 text-theme-secondary hover:text-theme-text relative cursor-pointer active:scale-95 transition-all outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 stroke-[2.25]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-shell">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
