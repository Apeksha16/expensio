'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { registerSchema } from '@expensio/validation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    setLoading(true);

    // Validate inputs using shared Zod schema
    const result = registerSchema.safeParse({ name, email, password });
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
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            full_name: name,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      setSuccess('Registration successful! Logging you in...');
      showToast('Account created successfully!');

      setTimeout(() => {
        router.push('/dashboard');
        window.location.href = '/dashboard';
      }, 800);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Registration failed');
      setLoading(false);
    }
  };

  const handleGoogleLoginSelect = async () => {
    setError(null);
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      } as any);

      if (authError) {
        throw authError;
      }

      if (data?.url) {
        window.location.assign(data.url);
      }
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Google sign-in failed');
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
        <header className="text-center">
          <h1 className="text-theme-text text-[21px] font-semibold tracking-tight leading-none">
            Create Account
          </h1>
          <p className="mt-2 text-[12px] font-semibold text-theme-secondary">
            Sign up for Expensio to start managing your expenses
          </p>
        </header>

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
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

          {/* Full Name input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-theme-secondary uppercase tracking-widest">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={`w-full bg-zinc-900 border ${
                  validationErrors.name
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-zinc-800 hover:border-zinc-700 focus:border-zinc-550 focus:ring-zinc-700'
                } focus:outline-none focus:ring-1 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-550 transition-colors`}
                disabled={loading}
              />
            </div>
            {validationErrors.name && (
              <span className="text-red-400 text-[10px] font-medium block">
                {validationErrors.name}
              </span>
            )}
          </div>

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
                  validationErrors.email
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-zinc-800 hover:border-zinc-700 focus:border-zinc-550 focus:ring-zinc-700'
                } focus:outline-none focus:ring-1 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-550 transition-colors`}
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
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-theme-secondary uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-550" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-zinc-900 border ${
                  validationErrors.password
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-zinc-800 hover:border-zinc-700 focus:border-zinc-550 focus:ring-zinc-700'
                } focus:outline-none focus:ring-1 rounded-xl py-3 pl-11 pr-11 text-sm text-zinc-100 placeholder:text-zinc-550 transition-colors`}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-550 hover:text-zinc-400 cursor-pointer"
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
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-bold active:scale-[0.98] transition-all shadow-md cursor-pointer disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-550 disabled:cursor-not-allowed text-xs uppercase tracking-wider mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing Up...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center w-full py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-theme-border"></div>
          </div>
          <span className="relative px-3 bg-theme-card text-theme-muted text-[10px] font-black uppercase tracking-widest">
            Or continue with
          </span>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLoginSelect}
          disabled={loading}
          className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-100 shadow-sm transition-all hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.6 15.03 1 12 1 7.24 1 3.2 3.73 1.24 7.72l3.87 3a6.978 6.978 0 0 1 6.89-5.68z"
            />
            <path
              fill="#4285F4"
              d="M23.45 12.3c0-.82-.07-1.6-.2-2.3H12v4.35h6.43a5.5 5.5 0 0 1-2.39 3.61l3.71 2.87c2.17-2 3.7-4.94 3.7-8.53z"
            />
            <path
              fill="#FBBC05"
              d="M5.11 14.72A6.89 6.89 0 0 1 4.75 12c0-.96.16-1.9.46-2.78L1.24 6.22A11.94 11.94 0 0 0 0 12c0 2.12.55 4.12 1.52 5.89l3.59-3.17z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.71-2.87c-1.03.69-2.35 1.1-4.25 1.1-3.79 0-6.99-2.56-8.13-6.02L1.27 15.3A11.96 11.96 0 0 0 12 23z"
            />
          </svg>
          <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>

        <footer className="text-center mt-2">
          <p className="text-xs font-semibold text-theme-secondary">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </footer>
      </motion.div>

      {/* Global Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 right-6 z-[250] max-w-sm mx-auto p-4 rounded-xl border border-theme-card-border bg-theme-card backdrop-blur-xl flex items-center gap-3 shadow-xl animate-slide-up">
          <div className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-xs font-semibold text-theme-text">{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
