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

  return (
    <div className="p-4 rounded-2xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-md flex items-center justify-between group active:scale-[0.99] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:border-zinc-800">
      <div className="flex items-center gap-3.5">
        {/* Avatar with dynamic initials background */}
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center border font-bold text-xs uppercase tracking-wider ${
            isOwed
              ? 'bg-indigo-500/5 border-indigo-500/15 text-cyan-400 shadow-sm'
              : isOwing
                ? 'bg-rose-500/5 border-rose-500/15 text-rose-400 shadow-sm'
                : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-500'
          }`}
        >
          {friend.avatar}
        </div>

        <div className="flex flex-col gap-0.5">
          <h4 className="text-sm font-black text-zinc-100 leading-snug">{friend.name}</h4>
          <span className="text-[10px] font-bold text-zinc-500">@{friend.username}</span>
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
              <div className="flex items-center gap-0.5 text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                <ArrowDownRight className="w-2.5 h-2.5 text-rose-500" />
                <span>You Owe</span>
              </div>
              <span className="text-sm font-black text-rose-400 tracking-tight">
                ₹{Math.abs(friend.balance).toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-[8px] font-bold text-zinc-550 bg-zinc-800/30 px-2 py-0.5 rounded-lg border border-zinc-800/20 uppercase tracking-widest">
              Settled
            </span>
          )}
        </div>

        {/* Quick settle button overlay */}
        {!isSettled && (
          <button
            onClick={() => onSettle(friend.id)}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-950/40 hover:bg-indigo-500/10 border border-zinc-800 hover:border-indigo-500/30 text-zinc-450 hover:text-cyan-400 active:scale-90 transition-all cursor-pointer shadow-inner"
            title="Settle balance"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );
}
