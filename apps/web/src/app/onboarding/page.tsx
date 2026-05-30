'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Wallet, ArrowRight, Sparkles, Loader2, LogOut, Check } from 'lucide-react';
import { useAuthStore } from '../../store/auth-store';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isInitialized, isLoading, updateUser, session } = useAuthStore();

  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Prefill name if available in user object
  useEffect(() => {
    if (user && user.name) {
      setName(user.name);
    }
  }, [user]);

  // Route protection inside page itself as backup
  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!user) {
        router.push('/login');
      } else if ((user.isOnboardingCompleted ?? (user as any).isOnboarded) && user.monthlySalary) {
        router.push('/');
      }
    }
  }, [user, isInitialized, isLoading, router]);

  if (!isInitialized || isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const hasPrefilledName = !!(user.name && user.name.length > 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!name || name.trim().length < 2) {
      setError('Please provide a valid name (at least 2 characters).');
      setIsSubmitting(false);
      return;
    }

    const salaryNum = Number(salary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      setError('Please provide a valid positive monthly salary.');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Prepare profile update object
      const updateData = {
        name: name.trim(),
        monthlySalary: salaryNum,
        isOnboardingCompleted: true,
      };

      // 2. Call the backend if we have a token
      if (session?.access_token) {
        try {
          const response = await fetch(`${API_URL}/api/v1/users/me`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(updateData),
          });

          if (!response.ok) {
            console.warn('Backend profile update failed, falling back to local cookies.');
          }
        } catch (backendErr) {
          console.warn(
            'Failed to connect to backend user update, falling back to local cookies:',
            backendErr
          );
        }
      }

      // 3. Update the client session cookie so mock logins are fully persisted
      const updatedUser = {
        ...user,
        ...updateData,
      };

      // Make sure the mock cookie is updated
      const mockSessionUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        monthlySalary: updatedUser.monthlySalary,
        isOnboardingCompleted: updatedUser.isOnboardingCompleted,
        user_metadata: {
          name: updatedUser.name,
          full_name: updatedUser.name,
          avatar_url: updatedUser.name.slice(0, 2).toUpperCase(),
          monthlySalary: updatedUser.monthlySalary,
          isOnboardingCompleted: updatedUser.isOnboardingCompleted,
        },
      };

      document.cookie = `expensio-session=${encodeURIComponent(JSON.stringify(mockSessionUser))}; path=/; max-age=604800; SameSite=Lax;`;

      // 4. Update local Zustand state
      updateUser(updateData);

      // 5. Trigger gorgeous success splash!
      setSuccess(true);

      setTimeout(() => {
        router.push('/');
        // Force routing refresh to bind new layouts
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Onboarding failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-gray-100 px-4 relative overflow-hidden select-none font-sans">
      {/* Premium background glow elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="onboarding-form"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative z-10"
          >
            {/* Logo Icon and Header */}
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-cyan-500 p-0.5 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/15">
                <div className="w-full h-full rounded-[14px] bg-zinc-950 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent mb-2">
                Personalize Expensio
              </h1>
              <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                {hasPrefilledName
                  ? `Welcome, ${name}! Let's define your monthly financial limits.`
                  : "Let's set up your profile details to kickstart your personal dashboard."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
                >
                  {error}
                </motion.div>
              )}

              {/* Name Input - Only if not prefilled or let them review it */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex"
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl py-3.5 pl-11 pr-4 text-sm transition-all text-white placeholder-zinc-650"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Monthly Salary Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Monthly Income (Salary)
                </label>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-bold text-cyan-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none rounded-xl py-3.5 pl-14 pr-4 text-sm transition-all text-white placeholder-zinc-650"
                    disabled={isSubmitting}
                    required
                    autoFocus={hasPrefilledName}
                  />
                </div>
                <p className="text-[10px] text-zinc-550 pl-1 leading-relaxed">
                  Used to generate accurate monthly split allowances and dynamic budget cards
                  automatically.
                </p>
              </div>

              {/* Action buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-zinc-950 font-bold active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/10 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-xs uppercase tracking-wider"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-zinc-850 pt-4 text-center">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                  } catch (e) {
                    console.error(e);
                  }
                  window.location.href = '/login';
                }}
                className="text-zinc-500 hover:text-zinc-350 text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign in with another account
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="onboarding-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-full max-w-sm bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 text-center shadow-2xl relative z-10 space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight">
                You are all set!
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Setup finalized successfully. Redirecting you to your personal financial cockpit...
              </p>
            </div>

            <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
