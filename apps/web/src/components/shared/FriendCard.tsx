'use client';

import React from 'react';
import { Friend } from '../../store/finance-store';
import { CreditCard, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface FriendCardProps {
  friend: Friend;
  onSettle: (id: string) => void;
}

export default function FriendCard({ friend, onSettle }: FriendCardProps) {
  const isOwed = friend.balance > 0;
  const isOwing = friend.balance < 0;
  const isSettled = friend.balance === 0;

  return null;
}
