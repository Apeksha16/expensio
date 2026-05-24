'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { resetPasswordSchema } from '@expensio/validation';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setValidationError(null);
    setLoading(true);

    // Validate inputs using shared Zod schema
    const result = resetPasswordSchema.safeParse({ password });
    if (!result.success) {
      setValidationError(result.error.errors[0]?.message || 'Invalid password');
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password,
      });

      if (authError) {
        throw authError;
      }

      setSuccess('Your password has been successfully updated. Redirecting...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Failed to update password');
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent mb-2">
            New Password
          </h1>
          <p className="text-zinc-400 text-sm">
            Enter your new secure password below
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-5">
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

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-zinc-950 border ${
                  validationError ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
                } focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl py-3 pl-11 pr-11 text-sm transition-all text-white placeholder-zinc-600`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-400"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
