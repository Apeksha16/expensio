'use client';

import React, { useState } from 'react';
import BottomSheet from '../BottomSheet';
import { Camera, Check, Loader2, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@expensio/ui';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitExpense: (expense: any) => void;
  isSubmitting?: boolean;
}

export default function ReceiptScannerModal({
  isOpen,
  onClose,
  onSubmitExpense,
  isSubmitting = false,
}: ReceiptScannerModalProps) {
  const [scanStep, setScanStep] = useState<'idle' | 'uploading' | 'review'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('Initializing Scanner...');
  const [scannedExpense, setScannedExpense] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanStep('uploading');
    setScanProgress(0);
    setScanStatusText('Uploading receipt image...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setScanProgress(progress);
      if (progress === 40) {
        setScanStatusText('Analyzing receipt layout with AI...');
      } else if (progress === 80) {
        setScanStatusText('Extracting items and total bill value...');
      } else if (progress >= 100) {
        clearInterval(interval);
        // Simulate OCR failure since no real backend endpoint exists yet
        setScanStep('review');
        setScannedExpense({
          title: '',
          amount: '',
          category: 'Others',
          note: '',
        });
      }
    }, 300);
  };

  const handleClose = () => {
    setScanStep('idle');
    setScannedExpense(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedExpense || !scannedExpense.title || !scannedExpense.amount) return;

    onSubmitExpense({
      amount: Number(scannedExpense.amount),
      category: scannedExpense.category,
      paymentMethod: 'UPI',
      date: new Date().toISOString().split('T')[0],
      note: scannedExpense.title,
    });

    // reset state
    setScanStep('idle');
    setScannedExpense(null);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Smart Receipt Scanner">
      {scanStep === 'idle' && (
        <div className="space-y-6 select-none">
          <div className="p-8 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/10 flex flex-col items-center justify-center gap-4 text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
              <Camera className="w-7 h-7 stroke-[2.25]" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                Upload receipt image
              </span>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-xs mx-auto">
                Drag and drop files, browse gallery, or capture live photos to initiate OCR parsing
              </p>
            </div>
            <div className="flex gap-2.5 mt-2 justify-center">
              <label className="px-3.5 py-2 rounded-xl bg-zinc-800 dark:bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase text-zinc-350 cursor-pointer flex items-center gap-1 hover:bg-zinc-700 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Gallery</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
              <label className="px-3.5 py-2 rounded-xl bg-zinc-800 dark:bg-zinc-900 border border-zinc-800 text-[10px] font-black uppercase text-zinc-350 cursor-pointer flex items-center gap-1 hover:bg-zinc-700 transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <span>Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {scanStep === 'uploading' && (
        <div className="py-12 flex flex-col items-center justify-center gap-5 text-center select-none">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin stroke-[2.5]" />
            <div className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
              {scanStatusText}
            </span>
            <div className="w-48 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mx-auto mt-2">
              <motion.div
                className="h-full bg-indigo-600"
                initial={{ width: 0 }}
                animate={{ width: `${scanProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold block">
              {scanProgress}% completed
            </span>
          </div>
        </div>
      )}

      {scanStep === 'review' && scannedExpense && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-3 select-none">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-450 flex items-center justify-center shrink-0">
              <Check className="w-4.5 h-4.5 stroke-[3]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-black uppercase text-rose-600 dark:text-rose-450 leading-none">
                OCR Processing Failed
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed mt-1">
                Unable to reach AI OCR endpoint. Please manually enter the receipt details below.
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550 px-1">
                  Merchant
                </label>
                <input
                  type="text"
                  value={scannedExpense.title}
                  onChange={(e) => setScannedExpense({ ...scannedExpense, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs font-semibold text-zinc-850 dark:text-zinc-100 placeholder:text-zinc-550 transition-colors"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550 px-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={scannedExpense.amount}
                  onChange={(e) => setScannedExpense({ ...scannedExpense, amount: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs font-semibold text-zinc-850 dark:text-zinc-100 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550 px-1">
                Category
              </label>
              <select
                value={scannedExpense.category}
                onChange={(e) => setScannedExpense({ ...scannedExpense, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-zinc-105/85 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-xs font-semibold text-zinc-850 dark:text-zinc-100 transition-colors"
              >
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills & Utilities">Bills & Utilities</option>
                <option value="Health">Health</option>
                <option value="Investments">Investments</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Education">Education</option>
                <option value="Transport">Transport</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Udhaari">Udhaari</option>
                <option value="Rent">Rent</option>
                <option value="Travel">Travel</option>
                <option value="Gifts">Gifts</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9.5px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-550 px-1">
                Extracted Items Description
              </label>
              <textarea
                value={scannedExpense.note}
                onChange={(e) => setScannedExpense({ ...scannedExpense, note: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 text-[11px] font-semibold text-zinc-850 dark:text-zinc-100 min-h-[80px] resize-none transition-colors leading-relaxed"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Saving Verified Expense..."
          >
            Confirm & Save Expense
          </Button>
        </form>
      )}
    </BottomSheet>
  );
}
