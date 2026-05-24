'use client';

import React from 'react';
import Link from 'next/link';
import { Home, PieChart, Users, Receipt, Settings, LogOut, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';

const sidebarItems = [
  { icon: Home, label: 'Dashboard', href: '/' },
  { icon: Receipt, label: 'Expenses', href: '/expenses' },
  { icon: PieChart, label: 'Budgets', href: '/budgets' },
  { icon: Users, label: 'Friends', href: '/friends' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900/50 border-r border-zinc-800 backdrop-blur-xl flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
            Expensio.
          </h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  isActive 
                  ? 'bg-zinc-800/80 text-zinc-100' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
                }`}
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-emerald-400' : 'group-hover:text-emerald-400'}`} />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-zinc-800/50 bg-zinc-900/20 backdrop-blur-md z-10">
          <div className="flex items-center text-sm text-zinc-400 font-medium">
            Overview
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-blue-500 p-0.5 relative cursor-pointer">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                <span className="text-xs font-bold text-zinc-100">US</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 z-10">
          {children}
        </div>
      </main>
    </div>
  );
}

