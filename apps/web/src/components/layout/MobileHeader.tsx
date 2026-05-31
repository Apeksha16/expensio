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

  const displayName = user?.name || 'User';

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

  return null;
}
