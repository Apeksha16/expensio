'use client';

import React from 'react';
import { Plus, Users, PieChart, UserPlus, FolderPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  onAddGroupClick
}: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    { 
      label: 'Add Expense', 
      icon: Plus, 
      action: onAddExpenseClick, 
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
    },
    { 
      label: 'Split Bill', 
      icon: Users, 
      action: () => router.push('/groups'), 
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
    },
    { 
      label: 'New Budget', 
      icon: PieChart, 
      action: onAddBudgetClick || (() => router.push('/budgets')), 
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
    },
    { 
      label: 'Add Friend', 
      icon: UserPlus, 
      action: onAddFriendClick || (() => router.push('/friends')), 
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
    },
    { 
      label: 'New Group', 
      icon: FolderPlus, 
      action: onAddGroupClick || (() => router.push('/groups')), 
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 px-1">Quick Actions</h3>
      
      {/* Horizontal Scrollable Touch Pill List */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory px-1">
        {actions.map((act, index) => (
          <button
            key={index}
            onClick={act.action}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border backdrop-blur-md active:scale-95 transition-all snap-start shrink-0 font-semibold text-xs cursor-pointer ₹{act.color}`}
          >
            <act.icon className="w-4 h-4" />
            <span>{act.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
