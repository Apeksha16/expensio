'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { loginSchema } from '@expensio/validation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});
    setLoading(true);

    // Validate inputs using shared Zod schema
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setValidationErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Invalid email or password');
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
            Welcome Back
          </h1>
          <p className="text-zinc-400 text-sm">
            Enter your credentials to access your Expensio account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Global error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
            >
              {error}
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
                className={`w-full bg-zinc-950 border ${
                  validationErrors.email ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
                } focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl py-3 pl-11 pr-4 text-sm transition-all text-white placeholder-zinc-600`}
                disabled={loading}
              />
            </div>
            {validationErrors.email && (
              <span className="text-red-400 text-[10px] font-medium block">
                {validationErrors.email}
              </span>
            )}
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-zinc-950 border ${
                  validationErrors.password ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
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
            {validationErrors.password && (
              <span className="text-red-400 text-[10px] font-medium block">
                {validationErrors.password}
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
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
