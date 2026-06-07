'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Handle iOS virtual keyboard
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        // If difference is significant (> 100px), assume keyboard is open
        setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-zinc-950/80 backdrop-blur-sm"
          />

          {/* Bottom sheet content drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 z-[100] max-w-md mx-auto bg-shell border-t border-theme-border rounded-t-[32px] shadow-2xl overflow-hidden pb-safe max-h-[85vh] flex flex-col transition-colors duration-300"
          >
            {/* Top Handle Drag Bar */}
            <div className="flex justify-center py-3 cursor-grab" onClick={onClose}>
              <div className="w-12 h-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 transition-colors" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 flex items-center justify-between border-b border-theme-border/60">
              {title ? (
                <h3 className="text-lg font-bold tracking-tight text-theme-text">{title}</h3>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-theme-secondary hover:text-theme-text hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Area */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-8 scrollbar-thin"
              style={{
                paddingBottom: `calc(4rem + env(safe-area-inset-bottom) + ${keyboardHeight}px)`,
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
