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
    ? 'from-emerald-400 to-cyan-455'
    : group.coverImage?.includes('orange')
      ? 'from-orange-400 to-rose-455'
      : group.coverImage?.includes('pink')
        ? 'from-pink-400 to-violet-400'
        : 'from-cyan-455 to-indigo-400';

  return (
    <div className="group rounded-[22px] border border-white/[0.04] bg-[#121318]/30 p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition-all active:scale-[0.98] cursor-pointer card-clean hover:border-white/[0.08]">
      <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${accent}`} />

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/6 bg-[#0c0d12] text-indigo-400">
              <FolderOpen className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h4 className="truncate text-base font-black tracking-tight text-white group-hover:text-cyan-400 transition-colors leading-tight">
                {group.name}
              </h4>
              <p className="truncate text-[11px] text-zinc-500 font-semibold">
                {group.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-[#0c0d12]/60 px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <Users className="h-3 w-3 text-zinc-500" />
              {group.members.length + 1} members
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/5 bg-[#0c0d12]/60 px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              <Clock className="h-3 w-3 text-zinc-500" />
              {lastActivity}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2 text-right">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
            Spend
          </span>
          <span className="text-xl font-extrabold tracking-tight text-white">
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
