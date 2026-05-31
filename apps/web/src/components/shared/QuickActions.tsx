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

  return null;
}
