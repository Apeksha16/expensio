'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { forgotPasswordSchema } from '@expensio/validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setValidationError(null);
    setLoading(true);

    // Validate inputs using shared Zod schema
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setValidationError(result.error.errors[0]?.message || 'Invalid email');
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (authError) {
        throw authError;
      }

      setSuccess('Password reset link has been sent to your email address.');
      setEmail('');
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12 text-theme-text selection:bg-zinc-800 selection:text-zinc-100 select-none">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-[360px] bg-theme-card border border-theme-card-border rounded-3xl p-6 md:p-8 shadow-xl relative z-10 flex flex-col gap-6"
      >
        <div className="flex justify-start">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-theme-secondary hover:text-indigo-400 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>

        <header className="text-center">
          <h1 className="text-theme-text text-[21px] font-semibold tracking-tight leading-none">
            Reset Password
          </h1>
          <p className="mt-2 text-[12px] font-semibold text-theme-secondary">
            Enter your email and we&apos;ll send you a password reset link
          </p>
        </header>

        <form onSubmit={handleResetRequest} className="flex flex-col gap-5">
          {/* Error and Success notifications */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium"
            >
              {success}
            </motion.div>
          )}

          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-theme-secondary uppercase tracking-widest">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full bg-zinc-900 border ${
                  validationError
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-zinc-800 hover:border-zinc-700 focus:border-zinc-550 focus:ring-zinc-700'
                } focus:outline-none focus:ring-1 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-550 transition-colors`}
                disabled={loading}
              />
            </div>
            {validationError && (
              <span className="text-red-400 text-[10px] font-medium block">{validationError}</span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-550 disabled:cursor-not-allowed text-xs uppercase tracking-wider mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
