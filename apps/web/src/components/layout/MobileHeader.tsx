'use client';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { useFinanceStore } from '../../store/finance-store';

export default function MobileHeader() {
  const { user } = useAuthStore();
  const { setIsNotificationsOpen, setIsProfileOpen } = useFinanceStore();
  const [greeting, setGreeting] = useState('Hello');
  const [dateStr, setDateStr] = useState('');

  const displayName = user?.name || 'Apeksha';

  useEffect(() => {
    // Generate dynamic greeting based on hour of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Dynamic date formatting: "Tuesday, 26 May"
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'short' };
    setDateStr(new Date().toLocaleDateString('en-US', options));
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#09090b]/80 border-b border-zinc-800/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">
          {dateStr}
        </span>
        <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-1.5 mt-0.5">
          {greeting}, {displayName} 👋
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Glowing Notification bell */}
        <button 
          onClick={() => setIsNotificationsOpen(true)}
          className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 active:scale-95 transition-all relative cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>

        {/* User avatar with border gradient */}
        <button 
          onClick={() => setIsProfileOpen(true)}
          className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-400 to-indigo-500 p-0.5 relative active:scale-95 transition-all cursor-pointer border-0 flex items-center justify-center"
        >
          <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center overflow-hidden">
            <span className="text-xs font-black text-zinc-100 uppercase tracking-tight">
              {displayName.slice(0, 2)}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
