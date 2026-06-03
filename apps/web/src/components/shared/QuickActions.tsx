'use client';

import React from 'react';
import { Plus, Users, PieChart, UserPlus, FolderPlus } from 'lucide-react';
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
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      label: 'Split Bill',
      icon: Users,
      action: () => router.push('/groups'),
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      label: 'New Budget',
      icon: PieChart,
      action: onAddBudgetClick || (() => router.push('/budgets')),
      color: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    },
    {
      label: 'Add Friend',
      icon: UserPlus,
      action: onAddFriendClick || (() => router.push('/friends')),
      color: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    },
    {
      label: 'New Group',
      icon: FolderPlus,
      action: onAddGroupClick || (() => router.push('/groups')),
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Quick Actions
        </h3>
        <span className="text-[8px] font-black uppercase text-zinc-600 tracking-wider">
          Swipe for more
        </span>
      </div>

      {/* Premium Horizontal Swipeable Pill Capsule Carousel */}
      <div className="flex gap-3 overflow-x-auto pb-3 pt-0.5 px-1 scrollbar-none snap-x snap-mandatory">
        {actions.map((act, index) => (
          <button
            key={index}
            onClick={act.action}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-zinc-800/85 bg-zinc-900/40 backdrop-blur-xl hover:border-zinc-700/80 hover:bg-zinc-900/60 transition-all cursor-pointer snap-start shrink-0 outline-none shadow-sm"
          >
            {/* Elegant glassmorphic circular icon container */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center border ${act.color} shrink-0`}
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <act.icon className="w-4 h-4 stroke-[2.5]" />
              </motion.div>
            </div>

            {/* Inline Title text */}
            <span className="text-xs font-extrabold text-zinc-200 tracking-tight shrink-0 whitespace-nowrap">
              {act.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
