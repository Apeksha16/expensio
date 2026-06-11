import React from 'react';
import { motion } from 'framer-motion';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-6 select-none animate-pulse px-4 pt-6 max-w-md mx-auto w-full">
      {/* 1. Wallet Hero Card Skeleton */}
      <div className="w-full h-[180px] rounded-[32px] bg-zinc-200/50 dark:bg-zinc-800/50 shadow-sm" />

      {/* 2. Squircle Quick Actions Skeleton */}
      <div className="flex gap-4">
        <div className="flex-1 h-[88px] rounded-[24px] bg-zinc-200/50 dark:bg-zinc-800/50 shadow-sm" />
        <div className="flex-1 h-[88px] rounded-[24px] bg-zinc-200/50 dark:bg-zinc-800/50 shadow-sm" />
      </div>

      {/* 3. Budget Status Card Skeleton */}
      <div className="w-full h-[160px] rounded-[28px] bg-zinc-200/50 dark:bg-zinc-800/50 shadow-sm" />

      {/* 4. Recent Transactions Header */}
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between px-1">
          <div className="w-32 h-4 bg-zinc-200/80 dark:bg-zinc-800/80 rounded" />
          <div className="w-12 h-3 bg-zinc-200/80 dark:bg-zinc-800/80 rounded" />
        </div>

        {/* Transaction Items Skeleton */}
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 pl-4 rounded-[20px] bg-zinc-100/50 dark:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80 shrink-0" />
                <div className="space-y-1.5">
                  <div className="w-24 h-3.5 bg-zinc-200/80 dark:bg-zinc-800/80 rounded" />
                  <div className="w-16 h-2.5 bg-zinc-200/80 dark:bg-zinc-800/80 rounded" />
                </div>
              </div>
              <div className="w-16 h-5 bg-zinc-200/80 dark:bg-zinc-800/80 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
