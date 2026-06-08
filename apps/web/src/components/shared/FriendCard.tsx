'use client';

import React from 'react';
import { Friend } from '../../hooks/useFriends';
import { ChevronRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface FriendCardProps {
  friend: Friend;
  onClick: (friend: Friend) => void;
}

export default function FriendCard({ friend, onClick }: FriendCardProps) {
  const isOwed = friend.balance > 0;
  const isOwing = friend.balance < 0;
  const isSettled = friend.balance === 0;

  const handleCardClick = () => {
    onClick(friend);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      onClick={handleCardClick}
      className="p-3.5 rounded-[22px] flex items-center justify-between border border-zinc-100 dark:border-zinc-850 bg-white dark:bg-zinc-900/60 shadow-[0_2px_12px_-3px_rgba(0,0,0,0.015)] select-none transition-all duration-200 cursor-pointer active:scale-[0.99] hover:bg-zinc-50/50 dark:hover:bg-zinc-900/80 group"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Avatar with dynamic initials background */}
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs uppercase tracking-wider shrink-0 transition-transform duration-300 group-hover:scale-105 ${
            isOwed
              ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30'
              : isOwing
                ? 'bg-pink-50 dark:bg-pink-950/20 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/30'
                : 'bg-zinc-50 dark:bg-zinc-950/25 text-zinc-550 dark:text-zinc-500 border border-zinc-150 dark:border-zinc-850'
          }`}
        >
          {friend.avatarUrl ? (
            <img src={friend.avatarUrl} className="w-full h-full rounded-2xl object-cover" />
          ) : (
            friend.name.slice(0, 2).toUpperCase()
          )}
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <h4 className="text-xs font-black text-theme-text leading-snug truncate">
            {friend.name}
          </h4>
          <span className="text-[10px] font-bold text-theme-secondary">@{friend.username}</span>
        </div>
      </div>

      {/* Financial Settlement Actions / Info */}
      <div className="flex items-center gap-3.5 shrink-0 select-none">
        <div className="flex flex-col items-end gap-0.5">
          {isOwed ? (
            <>
              <span className="text-[8px] font-black uppercase text-theme-secondary/80 tracking-widest">
                Owes You
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-450 tracking-tight">
                ₹{friend.balance.toFixed(2)}
              </span>
            </>
          ) : isGridOwe(friend.balance) ? (
            <>
              <span className="text-[8px] font-black uppercase text-rose-600 dark:text-rose-450 tracking-widest">
                You Owe
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-455 tracking-tight">
                ₹{Math.abs(friend.balance).toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-[8px] font-black text-theme-secondary bg-zinc-50 dark:bg-zinc-950 px-2 py-0.75 rounded-lg border border-zinc-200/60 dark:border-zinc-850 uppercase tracking-widest">
              Settled
            </span>
          )}
        </div>

        {/* Status icon or navigation indicator */}
        {!isSettled ? (
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-500 shrink-0 select-none">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Helper to determine if we owe
function isGridOwe(balance: number): boolean {
  return balance < 0;
}
