'use client';

import React from 'react';
import { Group, Expense, useFinanceStore } from '../../store/finance-store';
import {
  FolderOpen,
  Users,
  Clock,
  ChevronRight,
  Utensils,
  Briefcase,
  Home,
  Car,
} from 'lucide-react';

interface GroupCardProps {
  group: Group;
}

// Map group name to beautiful theme-aware squircles and icons
const getGroupIconMeta = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('goa')) {
    return {
      icon: FolderOpen,
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
      textColor: 'text-indigo-650 dark:text-indigo-455',
      borderColor: 'border-indigo-100/50 dark:border-indigo-900/30',
    };
  }
  if (n.includes('dinner') || n.includes('food') || n.includes('lunch') || n.includes('meals')) {
    return {
      icon: Utensils,
      bgColor: 'bg-pink-50 dark:bg-pink-950/30',
      textColor: 'text-pink-650 dark:text-pink-455',
      borderColor: 'border-pink-100/50 dark:border-pink-900/30',
    };
  }
  if (n.includes('office') || n.includes('team') || n.includes('work')) {
    return {
      icon: Briefcase,
      bgColor: 'bg-sky-50 dark:bg-sky-950/30',
      textColor: 'text-sky-600 dark:text-sky-455',
      borderColor: 'border-sky-100/50 dark:border-sky-900/30',
    };
  }
  if (n.includes('flat') || n.includes('house') || n.includes('rent') || n.includes('room')) {
    return {
      icon: Home,
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      textColor: 'text-orange-655 dark:text-orange-455',
      borderColor: 'border-orange-100/50 dark:border-orange-900/30',
    };
  }
  if (n.includes('road') || n.includes('trip') || n.includes('car') || n.includes('drive')) {
    return {
      icon: Car,
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      textColor: 'text-purple-650 dark:text-purple-455',
      borderColor: 'border-purple-100/50 dark:border-purple-900/30',
    };
  }
  return {
    icon: FolderOpen,
    bgColor: 'bg-zinc-50 dark:bg-zinc-950/30',
    textColor: 'text-zinc-600 dark:text-zinc-450',
    borderColor: 'border-zinc-100 dark:border-zinc-900/30',
  };
};

export default function GroupCard({ group }: GroupCardProps) {
  const { expenses } = useFinanceStore();

  const groupExpenses = expenses.filter((e) => e.groupId === group.id);
  const totalSpend = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPaidByMe = groupExpenses
    .filter((e) => e.paidBy === 'me')
    .reduce((sum, e) => sum + e.amount, 0);

  // Calculate net balance for user in this group
  let netBalance = 0;
  groupExpenses.forEach((exp) => {
    const shareCount = group.members.length + 1;
    const shareAmount = exp.amount / shareCount;
    if (exp.paidBy === 'me') {
      netBalance += shareAmount * (shareCount - 1);
    } else {
      netBalance -= shareAmount;
    }
  });

  const roundedBalance = Number(netBalance.toFixed(2));
  const hasActivity = groupExpenses.length > 0;

  const meta = getGroupIconMeta(group.name);
  const Icon = meta.icon;

  return (
    <div className="group rounded-3xl p-4.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850/80 shadow-[0_4px_16px_rgba(0,0,0,0.01)] transition-all active:scale-[0.98] hover:scale-[1.01] duration-250 cursor-pointer flex flex-col gap-1 select-none">
      <div className="flex items-center justify-between gap-3">
        {/* Left Icon Squircle */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-11 h-11 rounded-2xl border ${meta.bgColor} ${meta.borderColor} ${meta.textColor} flex items-center justify-center shrink-0`}
          >
            <Icon className="w-5 h-5 stroke-[2.25]" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[13px] font-black text-theme-text group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate leading-tight">
              {group.name}
            </h4>
            <p className="text-[9.5px] font-bold text-theme-secondary truncate mt-0.5">
              {group.members.length + 1} members • Created by You
            </p>

            {/* Active/Activity status indicator */}
            <div className="mt-1.5 flex">
              <span
                className={`px-2 py-0.5 rounded text-[7.5px] font-black tracking-wider uppercase border ${
                  hasActivity
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450'
                    : 'bg-zinc-100 dark:bg-zinc-950 border-zinc-200/40 dark:border-zinc-800 text-zinc-550 dark:text-zinc-500'
                }`}
              >
                {hasActivity ? 'Active' : 'No Activity'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Balance Area */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end text-right">
            {roundedBalance > 0 ? (
              <>
                <span className="text-[7.5px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-widest leading-none">
                  You are owed
                </span>
                <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-450 mt-1 tracking-tight">
                  ₹{Math.round(roundedBalance)}
                </span>
              </>
            ) : roundedBalance < 0 ? (
              <>
                <span className="text-[7.5px] font-black text-rose-600 dark:text-rose-455 uppercase tracking-widest leading-none">
                  You owe
                </span>
                <span className="text-[13px] font-black text-rose-600 dark:text-rose-455 mt-1 tracking-tight">
                  ₹{Math.round(Math.abs(roundedBalance))}
                </span>
              </>
            ) : (
              <>
                <span className="text-[7.5px] font-black text-zinc-550 dark:text-zinc-500 uppercase tracking-widest leading-none">
                  You owe
                </span>
                <span className="text-[13px] font-black text-zinc-550 dark:text-zinc-500 mt-1 tracking-tight">
                  ₹0
                </span>
              </>
            )}
          </div>
          <ChevronRight className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
        </div>
      </div>

      {/* Optional Progress bar at bottom */}
      {hasActivity && totalSpend > 0 && (
        <div className="mt-3.5 pt-3 border-t border-zinc-100/50 dark:border-zinc-800/40 flex flex-col gap-1.5">
          <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-850 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalPaidByMe / totalSpend) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
