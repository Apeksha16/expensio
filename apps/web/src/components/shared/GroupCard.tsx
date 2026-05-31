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
  const groupExpenses = expenses.filter((e) => e.groupId === group.id);
  const totalSpend = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

  const lastActivity = groupExpenses.length > 0 ? 'Active' : 'No activity';

  return null;
}
