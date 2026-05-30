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
    <div className="p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl flex items-center justify-between group active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-3.5">
        {/* Avatar with dynamic initials background */}
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border font-bold text-xs uppercase ₹{
          isOwed 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : isOwing 
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
        }`}>
          {friend.avatar}
        </div>

        <div className="flex flex-col gap-0.5">
          <h4 className="text-sm font-bold text-zinc-100">{friend.name}</h4>
          <span className="text-[10px] font-semibold text-zinc-500">@{friend.username}</span>
        </div>
      </div>

      {/* Financial Settlement Actions / Info */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-0.5">
          {isOwed ? (
            <>
              <div className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                <ArrowUpRight className="w-3 h-3" />
                <span>Owes You</span>
              </div>
              <span className="text-sm font-extrabold text-emerald-400">₹{friend.balance.toFixed(2)}</span>
            </>
          ) : isOwing ? (
            <>
              <div className="flex items-center gap-0.5 text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                <ArrowDownRight className="w-3 h-3" />
                <span>You Owe</span>
              </div>
              <span className="text-sm font-extrabold text-rose-400">₹{Math.abs(friend.balance).toFixed(2)}</span>
            </>
          ) : (
            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800/40 px-2 py-0.5 rounded-full border border-zinc-800/30 uppercase tracking-wider">
              Settled
            </span>
          )}
        </div>

        {/* Quick settle button overlay */}
        {!isSettled && (
          <button
            onClick={() => onSettle(friend.id)}
            className="flex items-center justify-center p-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/5 active:scale-90 transition-all"
            title="Settle balance"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
}
