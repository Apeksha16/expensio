'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/auth-store';
import { useFinanceStore } from '../../store/finance-store';

export default function MobileHeader() {
  const { user } = useAuthStore();
  const { setIsNotificationsOpen, setIsProfileOpen } = useFinanceStore();
  const [greeting, setGreeting] = useState('Hello');
  const [dateStr, setDateStr] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const displayName = user?.name || 'Apeksha';

  useEffect(() => {
    // Read saved theme
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    }

    // Generate dynamic greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Dynamic date formatting
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    setDateStr(new Date().toLocaleDateString('en-US', options));
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', nextTheme);
      document.documentElement.className = nextTheme;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-shell/80 border-b border-theme-border/40 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-colors duration-300">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
          {dateStr}
        </span>
        <h1 className="text-xl font-black tracking-tight text-theme-text mt-0.5">
          Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Sleek Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-theme-btn border border-theme-btn-border/80 text-theme-secondary hover:text-theme-text relative cursor-pointer outline-none transition-colors"
          title="Toggle Theme"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </motion.div>
        </button>

        {/* Glowing Notification bell */}
        <button 
          onClick={() => setIsNotificationsOpen(true)}
          className="p-2.5 rounded-xl bg-theme-btn border border-theme-btn-border/80 text-theme-secondary hover:text-theme-text relative cursor-pointer outline-none transition-colors"
        >
          <motion.div
            whileTap={{ scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          >
            <Bell className="w-4 h-4" />
          </motion.div>
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        {/* User avatar with border gradient */}
        <button 
          onClick={() => setIsProfileOpen(true)}
          className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 p-0.5 relative cursor-pointer border-0 flex items-center justify-center outline-none"
        >
          <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center overflow-hidden">
            <motion.span 
              whileTap={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="text-xs font-black text-white uppercase tracking-tight block"
            >
              {displayName.slice(0, 2)}
            </motion.span>
          </div>
        </button>
      </div>
    </header>
  );
}
