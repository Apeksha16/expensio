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
        redirectTo: `₹{window.location.origin}/reset-password`,
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
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-gray-100 px-4 relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="mb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent mb-2">
            Reset Password
          </h1>
          <p className="text-zinc-400 text-sm">
            Enter your email and we&apos;ll send you a password reset link
          </p>
        </div>

        <form onSubmit={handleResetRequest} className="space-y-5">
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
              className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
            >
              {success}
            </motion.div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full bg-zinc-950 border ₹{
                  validationError ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
                } focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl py-3 pl-11 pr-4 text-sm transition-all text-white placeholder-zinc-600`}
                disabled={loading}
              />
            </div>
            {validationError && (
              <span className="text-red-400 text-[10px] font-medium block">
                {validationError}
              </span>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-sm mt-2"
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
    </div>
  );
}
