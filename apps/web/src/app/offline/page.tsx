'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WifiOff, RefreshCw, Home } from 'lucide-react';

import Link from 'next/link';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#09090b] text-gray-100 px-4 relative overflow-hidden select-none">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full text-center z-10 flex flex-col items-center">
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
            delay: 0.1,
          }}
          className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-transparent rounded-3xl" />
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <WifiOff className="w-10 h-10 text-red-400" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent mb-3"
        >
          You are offline
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-zinc-400 text-sm md:text-base mb-8 max-w-sm"
        >
          Expensio is currently unable to reach the servers. Please check your internet connection and try again.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          <button
            onClick={handleRetry}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-zinc-950 font-semibold hover:bg-zinc-200 active:scale-95 transition-all shadow-lg hover:shadow-white/5 cursor-pointer text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold active:scale-95 transition-all cursor-pointer text-sm"
          >
            <Home className="w-4 h-4" />
            Go Dashboard
          </Link>
        </motion.div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12 text-zinc-600 text-xs tracking-wider uppercase"
        >
          Expensio PWA Fallback
        </motion.div>
      </div>
    </div>
  );
}
