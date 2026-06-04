'use client';

import React from 'react';
import { Friend } from '../../store/finance-store';
import { CreditCard, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface FriendCardProps {
  friend: Friend;
  onSettle: (id: string) => void;
}

export default function FriendCard({ friend, onSettle }: FriendCardProps) {
  const isOwed = friend.balance > 0;
  const isOwing = friend.balance < 0;
  const isSettled = friend.balance === 0;

  return (
    <div className="p-4 rounded-2xl flex items-center justify-between group active:scale-[0.99] transition-all duration-200 shadow-sm border border-white/[0.04] bg-[#0c0d12]/30 card-clean">
      <div className="flex items-center gap-3.5">
        {/* Avatar with dynamic initials background */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs uppercase tracking-wider ${
            isOwed
              ? 'bg-indigo-500/8 text-cyan-400 border border-indigo-500/10'
              : isOwing
                ? 'bg-rose-500/8 text-rose-455 border border-rose-500/10'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-900'
          }`}
        >
          {friend.avatar}
        </div>

        <div className="flex flex-col gap-0.5">
          <h4 className="text-sm font-black text-zinc-100 leading-snug">{friend.name}</h4>
          <span className="text-[10px] font-bold text-zinc-550">@{friend.username}</span>
        </div>
      </div>

      {/* Financial Settlement Actions / Info */}
      <div className="flex items-center gap-3.5">
        <div className="flex flex-col items-end gap-0.5">
          {isOwed ? (
            <>
              <div className="flex items-center gap-0.5 text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                <ArrowUpRight className="w-2.5 h-2.5 text-cyan-500" />
                <span>Owes You</span>
              </div>
              <span className="text-sm font-black text-cyan-400 tracking-tight">
                ₹{friend.balance.toFixed(2)}
              </span>
            </>
          ) : isOwing ? (
            <>
              <div className="flex items-center gap-0.5 text-[8px] text-zinc-550 font-bold uppercase tracking-widest">
                <ArrowDownRight className="w-2.5 h-2.5 text-rose-500" />
                <span>You Owe</span>
              </div>
              <span className="text-sm font-black text-rose-455 tracking-tight">
                ₹{Math.abs(friend.balance).toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-[8px] font-black text-zinc-550 bg-zinc-800/20 px-2 py-0.5 rounded-lg border border-zinc-800/10 uppercase tracking-widest">
              Settled
            </span>
          )}
        </div>

        {/* Quick settle button overlay */}
        {!isSettled && (
          <button
            onClick={() => onSettle(friend.id)}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-950/80 border border-zinc-850 hover:border-indigo-500/30 text-zinc-100 hover:text-cyan-400 active:scale-95 transition-all cursor-pointer shadow-sm"
            title="Settle balance"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );
}
