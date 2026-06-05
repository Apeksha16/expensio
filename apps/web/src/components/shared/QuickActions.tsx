'use client';

import React from 'react';
import { Plus, PieChart, Scan, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface QuickActionsProps {
  onAddExpenseClick: () => void;
  onAddBudgetClick?: () => void;
  onScanReceiptClick?: () => void;
  enabledActions?: string[];
}

export default function QuickActions({
  onAddExpenseClick,
  onAddBudgetClick,
  onScanReceiptClick,
  enabledActions = ['Add Expense', 'Add Budget', 'Scan Receipt', 'Split Expense'],
}: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      label: 'Add Expense',
      icon: Plus,
      action: onAddExpenseClick,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    },
    {
      label: 'Add Budget',
      icon: PieChart,
      action: onAddBudgetClick || (() => router.push('/budgets')),
      color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    },
    {
      label: 'Scan Receipt',
      icon: Scan,
      action: onScanReceiptClick || (() => {}),
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      label: 'Split Expense',
      icon: Users,
      action: () => router.push('/groups'),
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
  ].filter((act) => enabledActions.includes(act.label));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-800 dark:text-zinc-200">
          Quick actions
        </h3>
      </div>

      <div
        className={`grid gap-3 ${
          actions.length === 4
            ? 'grid-cols-4'
            : actions.length === 3
              ? 'grid-cols-3'
              : actions.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-1'
        }`}
      >
        {actions.map((act, index) => (
          <motion.button
            key={index}
            onClick={act.action}
            aria-label={act.label}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="flex flex-col items-center gap-2.5 p-3 rounded-[20px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_6px_18px_rgba(0,0,0,0.02)] cursor-pointer group outline-none"
          >
            {/* Squircle Action Icon Container */}
            <div
              className={`w-11 h-11 rounded-[14px] flex items-center justify-center transition-all duration-300 relative overflow-hidden ${act.color}`}
            >
              <act.icon className="w-4.5 h-4.5 stroke-[2.75] relative z-10 transition-transform duration-300 group-hover:scale-105" />
            </div>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors text-center leading-none">
              {act.label.split(' ')[0]} <br />
              <span className="text-[8px] font-bold tracking-normal text-zinc-400 dark:text-zinc-500 lowercase mt-0.5 block">
                {act.label.split(' ')[1] || ''}
              </span>
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
