'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Premium Google Login Simulation States
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleSigningIn, setGoogleSigningIn] = useState(false);
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
      showToast("Account created successfully!");
      
      setTimeout(() => {
        router.push('/');
        window.location.href = '/';
      }, 800);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setError(error.message || 'Registration failed');
      setLoading(false);
    }
  };

  const handleGoogleLoginSelect = (account: { name: string; email: string; avatar: string }) => {
    setGoogleSigningIn(true);
    setError(null);

    // Simulate standard Google authentication token resolution delay
    setTimeout(() => {
      const mockUser = {
        id: 'mock-user-id-' + account.avatar.toLowerCase(),
        email: account.email,
        user_metadata: {
          name: account.name,
          full_name: account.name,
          avatar_url: account.avatar
        }
      };

      // Set session cookie
      document.cookie = `expensio-session=${encodeURIComponent(JSON.stringify(mockUser))}; path=/; max-age=604800; SameSite=Lax;`;

      showToast(`Welcome back, ${account.name}!`);
      
      setTimeout(() => {
        setGoogleSigningIn(false);
        setShowGoogleChooser(false);
        router.push('/');
        window.location.href = '/';
      }, 600);
    }, 1200);
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
            Create Account
          </h1>
          <p className="text-zinc-400 text-sm">
            Sign up for Expensio to start managing your expenses
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
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

          {/* Full Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={`w-full bg-zinc-950 border ${
                  validationErrors.name ? 'border-red-500/50' : 'border-zinc-800 hover:border-zinc-700'
                } focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none rounded-xl py-3 pl-11 pr-4 text-sm transition-all text-white placeholder-zinc-600`}
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
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Password
            </label>
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
                Signing Up...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800/80"></div>
          </div>
          <span className="relative px-3 bg-zinc-900/60 text-zinc-550 text-[10px] font-black uppercase tracking-widest">
            Or continue with
          </span>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={() => setShowGoogleChooser(true)}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60 active:scale-[0.98] text-zinc-300 hover:text-zinc-100 font-bold transition-all shadow-sm cursor-pointer text-sm"
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
          <span>Continue with Google</span>
        </button>

        <div className="mt-8 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </motion.div>

      {/* Premium Google Accounts Chooser Overlay */}
      <AnimatePresence>
        {showGoogleChooser && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm">
            {/* Backdrop Click Dismiss */}
            <div className="absolute inset-0" onClick={() => !googleSigningIn && setShowGoogleChooser(false)} />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 relative z-10 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto pb-safe"
            >
              {/* Header Drag bar indicator */}
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto" />
              
              <div className="text-center space-y-1.5">
                <div className="w-10 h-10 bg-zinc-950 border border-zinc-850 flex items-center justify-center mx-auto rounded-xl">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <h2 className="text-base font-black text-zinc-100 tracking-tight">Sign up with Google</h2>
                <p className="text-xs text-zinc-555 leading-relaxed">Choose an account to continue to <span className="text-emerald-400 font-bold">Expensio</span></p>
              </div>

              {googleSigningIn ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs text-zinc-400 font-bold">Signing up with Google...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Simulated Google Accounts */}
                  {[
                    { name: 'Apeksha', email: 'apeksha@expensio.app', avatar: 'AP', verified: true },
                    { name: 'Rahul Sharma', email: 'rahul.sharma@gmail.com', avatar: 'RS', verified: false },
                    { name: 'Amit Verma', email: 'amit.verma@yahoo.com', avatar: 'AV', verified: false },
                    { name: 'Pranav Singh', email: 'pranav.singh@gmail.com', avatar: 'PS', verified: false }
                  ].map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => handleGoogleLoginSelect(account)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-zinc-850 hover:border-zinc-700 bg-zinc-950/40 hover:bg-zinc-950 active:scale-[0.99] transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center font-bold text-zinc-250 group-hover:border-zinc-700">
                          {account.avatar}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-zinc-200">{account.name}</span>
                            {account.verified && (
                              <span className="w-3.5 h-3.5 rounded-full bg-emerald-450/15 border border-emerald-500/25 flex items-center justify-center text-[7px] font-black text-emerald-400 uppercase tracking-widest shrink-0">
                                ✓
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-555 font-medium">{account.email}</span>
                        </div>
                      </div>
                      
                      <span className="text-[9px] font-black uppercase text-zinc-555 tracking-wider group-hover:text-emerald-400 transition-colors">
                        Use Account
                      </span>
                    </button>
                  ))}

                  <div className="pt-2 border-t border-zinc-900/60 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGoogleChooser(false);
                        showToast("Adding new account is disabled in mock preview.");
                      }}
                      className="w-full py-3.5 rounded-xl border border-zinc-800 bg-transparent text-zinc-400 hover:text-zinc-200 font-bold active:scale-98 transition-all text-xs cursor-pointer text-center"
                    >
                      Use another account
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 right-6 z-[250] max-w-sm mx-auto p-4 rounded-xl border border-zinc-850 bg-[#09090b]/95 backdrop-blur-xl flex items-center gap-3 shadow-[0_10px_25px_rgba(0,0,0,0.5)] animate-slide-up">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-xs font-bold text-zinc-200">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
