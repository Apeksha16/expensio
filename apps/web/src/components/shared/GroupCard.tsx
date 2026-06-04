'use client';

import React from 'react';
import { Group, useFinanceStore } from '../../store/finance-store';
import { FolderOpen, Users, Clock, ArrowUpRight } from 'lucide-react';

interface GroupCardProps {
  group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
  const { expenses } = useFinanceStore();

  const groupExpenses = expenses.filter((e) => e.groupId === group.id);
  const totalSpend = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

  const lastActivity = groupExpenses.length > 0 ? 'Active' : 'No activity';
  const accent = group.coverImage?.includes('emerald')
    ? 'from-emerald-400 to-cyan-500'
    : group.coverImage?.includes('orange')
      ? 'from-orange-400 to-rose-500'
      : group.coverImage?.includes('pink')
        ? 'from-pink-400 to-violet-400'
        : 'from-cyan-500 to-indigo-400';

  return (
    <div className="group rounded-[22px] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.3)] transition-all active:scale-[0.98] cursor-pointer card-clean">
      <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${accent}`} />

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-500/10 dark:border-zinc-800 bg-indigo-500/5 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400">
              <FolderOpen className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-base font-black tracking-tight text-zinc-100 group-hover:text-cyan-400 transition-colors leading-tight">
                {group.name}
              </h4>
              <p className="truncate text-[11px] text-zinc-500 font-semibold">
                {group.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">
              <Users className="h-3 w-3 text-zinc-500" />
              {group.members.length + 1} members
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-wider">
              <Clock className="h-3 w-3 text-zinc-500" />
              {lastActivity}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 text-right">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-550">
            Spend
          </span>
          <span className="text-xl font-extrabold tracking-tight text-zinc-100">
            ₹{totalSpend.toFixed(0)}
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-cyan-400">
            <ArrowUpRight className="h-3 w-3" />
            Open
          </span>
        </div>
      </div>
    </div>
  );
}
