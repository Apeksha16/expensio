'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-background text-theme-text select-none">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-theme-card border border-theme-card-border p-8 rounded-3xl shadow-xl flex flex-col items-center text-center gap-5"
      >
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-2">
          <AlertCircle className="w-8 h-8 stroke-[2]" />
        </div>

        <div>
          <h2 className="text-xl font-bold tracking-tight text-theme-text mb-2">
            Something went wrong
          </h2>
          <p className="text-sm font-medium text-theme-secondary">
            {error.message || 'We encountered an unexpected error while loading your data.'}
          </p>
        </div>

        <div className="flex gap-3 w-full mt-4">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider transition-colors active:scale-95"
          >
            <RefreshCcw className="w-4 h-4" />
            Try Again
          </button>

          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-black uppercase tracking-wider transition-colors active:scale-95"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
