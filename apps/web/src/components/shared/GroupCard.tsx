'use client';

import React from 'react';
import { Group, useFinanceStore } from '../../store/finance-store';
import { FolderOpen, Users, Clock } from 'lucide-react';

interface GroupCardProps {
  group: Group;
}

export default function GroupCard({ group }: GroupCardProps) {
  const { expenses } = useFinanceStore();

  // Dynamically calculate actual total spent inside this split group
  const groupExpenses = expenses.filter(e => e.groupId === group.id);
  const totalSpend = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

  const lastActivity = groupExpenses.length > 0 
    ? 'Active' 
    : 'No activity';

  return (
    <div className="rounded-2xl border border-zinc-850 bg-zinc-900/20 hover:bg-zinc-900/40 backdrop-blur-md overflow-hidden flex flex-col group active:scale-[0.98] transition-all cursor-pointer shadow-md">
      
      {/* Top Banner Cover with Vibrant Gradients or High-Res Cover Photo */}
      <div 
        className={`h-32 flex items-end p-4 relative bg-cover bg-center ${!group.coverUrl ? `bg-gradient-to-tr ${group.coverImage}` : ''}`}
        style={group.coverUrl ? { backgroundImage: `url(${group.coverUrl})` } : undefined}
      >
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-zinc-950/10 backdrop-blur-[0.5px]" />
        
        {/* Floating folder circle tag */}
        <div className="w-10 h-10 rounded-xl bg-zinc-900/90 border border-zinc-800/65 backdrop-blur-md flex items-center justify-center text-zinc-100 z-10 shadow-lg">
          <FolderOpen className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      {/* Body Info */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 flex-1">
            <h4 className="text-base font-black text-zinc-100 group-hover:text-emerald-400 transition-colors leading-snug">
              {group.name}
            </h4>
            <p className="text-[11px] text-zinc-450 line-clamp-2 leading-relaxed">
              {group.description}
            </p>
          </div>

          {/* Breathtaking Overlapping Face Chips */}
          <div className="flex -space-x-1.5 overflow-hidden shrink-0 mt-1">
            <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] font-black text-zinc-300">
              AP
            </div>
            {group.members.slice(0, 2).map((member, idx) => (
              <div 
                key={idx}
                className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[8px] font-black text-zinc-500 uppercase"
              >
                {member.split(' ').map(n => n[0]).join('')}
              </div>
            ))}
            {group.members.length > 2 && (
              <div className="w-6 h-6 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[7px] font-black text-emerald-400">
                +{group.members.length - 2}
              </div>
            )}
          </div>
        </div>

        {/* Footer Info Row */}
        <div className="pt-3.5 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-zinc-450" />
            <span>{group.members.length + 1} members</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-black text-zinc-300">
            <span className="text-zinc-500 font-normal">Spend:</span>
            <span className="text-emerald-400">${totalSpend.toFixed(0)}</span>
          </div>

          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span className="text-[9px] font-medium">{lastActivity}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
