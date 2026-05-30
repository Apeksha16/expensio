'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, PieChart, Users, FolderOpen, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavigationProps {}

export default function BottomNavigation({}: BottomNavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Expenses', icon: Receipt, href: '/expenses' },
    { label: 'Budgets', icon: PieChart, href: '/budgets' },
    { label: 'Friends', icon: Users, href: '/friends' },
    { label: 'Groups', icon: FolderOpen, href: '/groups' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/80 border-t border-zinc-800/60 backdrop-blur-xl pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 relative text-zinc-400 group outline-none"
            >
              {/* Highlight Slide Background */}
              {isActive && (
                <motion.span
                  layoutId="activeTabGlow"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-x-2 top-1 bottom-1 bg-zinc-800/40 rounded-xl -z-10 border border-zinc-800/30"
                />
              )}

              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <item.icon
                  className={`w-5 h-5 mb-0.5 transition-colors ${
                    isActive 
                      ? 'text-cyan-400' 
                      : 'group-hover:text-zinc-100'
                  }`}
                />
              </motion.div>
              
              <span
                className={`text-[10px] font-medium tracking-tight transition-colors ${
                  isActive 
                    ? 'text-zinc-100 font-semibold' 
                    : 'group-hover:text-zinc-100'
                }`}
              >
                {item.label}
              </span>

              {/* Active Dot */}
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-emerald-400 absolute bottom-1.5" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
