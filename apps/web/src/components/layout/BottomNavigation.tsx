'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, PieChart, Users, FolderOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavigationProps {}

export default function BottomNavigation({}: BottomNavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, href: '/dashboard' },
    { label: 'Expenses', icon: Receipt, href: '/expenses' },
    { label: 'Budgets', icon: PieChart, href: '/budgets' },
    { label: 'Friends', icon: Users, href: '/friends' },
    { label: 'Groups', icon: FolderOpen, href: '/groups' },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-[calc(100%-2rem)] md:max-w-[416px] mx-auto rounded-[24px] border border-white/[0.04] bg-[#09090c]/75 backdrop-blur-lg shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      <div className="flex h-16 items-center justify-between px-3 relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex h-full flex-1 flex-col items-center justify-center pb-1 pt-1.5 outline-none"
            >
              {/* Circular Icon Container */}
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center">
                {/* Active Circle Outline (Slides smoothly) */}
                {isActive && (
                  <motion.span
                    layoutId="activeTabCircle"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full border border-indigo-500/20 bg-indigo-500/[0.04] shadow-[0_0_12px_rgba(99,102,241,0.06)]"
                  />
                )}

                {/* Inactive Hover Target */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-full bg-transparent group-hover:bg-white/[0.02] transition-colors" />
                )}

                {/* Tactile Icon Wrapper */}
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  className="relative z-10 flex items-center justify-center"
                >
                  <item.icon
                    className={`h-4.5 w-4.5 transition-colors duration-200 ${
                      isActive ? 'text-indigo-400' : 'text-zinc-400/90 group-hover:text-zinc-200'
                    }`}
                  />
                </motion.div>

                {/* Red notification badge (Static mock count '2' on Home tab matching mockup) */}
                {item.label === 'Home' && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-extrabold text-[8px] flex items-center justify-center border border-[#09090c] z-20 shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                    2
                  </span>
                )}
              </div>

              {/* Label Text */}
              <span
                className={`text-[9px] font-black uppercase tracking-wider transition-colors mt-0.5 duration-200 ${
                  isActive ? 'text-white' : 'text-zinc-550 group-hover:text-zinc-350'
                }`}
              >
                {item.label}
              </span>

              {/* Active Capsule Bottom Line (Slides in perfect sync) */}
              {isActive && (
                <motion.span
                  layoutId="activeTabBar"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="w-3.5 h-0.75 rounded-full bg-indigo-400 absolute bottom-1"
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
