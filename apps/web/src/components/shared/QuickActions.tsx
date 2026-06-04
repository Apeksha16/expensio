'use client';

import React from 'react';
import { Plus, PieChart, Scan, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface QuickActionsProps {
  onAddExpenseClick: () => void;
  onAddFriendClick?: () => void;
  onAddBudgetClick?: () => void;
  onAddGroupClick?: () => void;
}

export default function QuickActions({
  onAddExpenseClick,
  onAddFriendClick,
  onAddBudgetClick,
  onAddGroupClick,
}: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      label: 'Add Expense',
      icon: Plus,
      action: onAddExpenseClick,
      color: 'bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      label: 'Add Budget',
      icon: PieChart,
      action: onAddBudgetClick || (() => router.push('/budgets')),
      color: 'bg-orange-500/10 text-orange-650 dark:text-orange-400 border-orange-500/20',
    },
    {
      label: 'Scan Receipt',
      icon: Scan,
      action: () =>
        alert(
          'Receipt Scanner: Camera scanning mode loaded. Select a receipt to extract items automatically.'
        ),
      color: 'bg-amber-500/10 text-amber-650 dark:text-amber-400 border-amber-500/20',
    },
    {
      label: 'Split Expense',
      icon: Share2,
      action: () => router.push('/groups'),
      color: 'bg-purple-500/10 text-purple-650 dark:text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-550">
          Quick Actions
        </h3>
      </div>

      {/* Grid: 4 Columns */}
      <div className="grid grid-cols-4 gap-3.5">
        {actions.map((act, index) => (
          <motion.button
            key={index}
            onClick={act.action}
            aria-label={act.label}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="flex flex-col items-center gap-2.5 p-3 rounded-[24px] bg-theme-card border border-theme-card-border shadow-[0_4px_16px_rgba(0,0,0,0.02)] cursor-pointer group outline-none"
          >
            {/* Squircle Action Icon Container */}
            <div
              className={`w-11 h-11 rounded-[16px] flex items-center justify-center transition-all duration-300 relative overflow-hidden ${act.color}`}
            >
              <act.icon className="w-5 h-5 stroke-[2.75] relative z-10 transition-transform duration-300 group-hover:scale-105" />
            </div>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors text-center leading-none">
              {act.label.split(' ')[0]} <br />
              <span className="text-[8px] font-medium tracking-normal text-zinc-450 dark:text-zinc-500 lowercase">
                {act.label.split(' ')[1] || ''}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
