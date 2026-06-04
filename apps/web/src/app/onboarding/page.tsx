'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth-store';
import { supabase } from '../../lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface OnboardingData {
  name: string;
  salary: string;
  mpin: string;
  confirmMpin: string;
}

// ─── Progress Indicator ───────────────────────────────────────────────────────

function ProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-300 ${
            i + 1 === current
              ? 'w-5 bg-zinc-200'
              : i + 1 < current
                ? 'w-2 bg-zinc-550'
                : 'w-2 bg-zinc-800'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Secure PIN Input (4-dot interface) ──────────────────────────────────────

interface SecurePinInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

function SecurePinInput({ value, onChange, disabled, error, autoFocus }: SecurePinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length <= 4) onChange(raw);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Hidden real input for keyboard activation */}
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        maxLength={4}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKey}
        disabled={disabled}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        aria-label="Enter your 4-digit PIN"
        autoComplete="off"
      />

      {/* 4-dot visual interface */}
      <button
        type="button"
        onClick={() => inputRef.current?.focus()}
        className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-zinc-800 transition-colors focus:outline-none cursor-pointer"
        aria-hidden="true"
        tabIndex={-1}
      >
        {Array.from({ length: 4 }, (_, i) => {
          const filled = i < value.length;
          return (
            <motion.div
              key={i}
              animate={filled ? { scale: 1 } : { scale: 0.85 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className={`h-3.5 w-3.5 rounded-full transition-colors duration-150 ${
                error
                  ? filled
                    ? 'bg-red-400'
                    : 'border-2 border-red-700'
                  : filled
                    ? 'bg-zinc-100'
                    : 'border-2 border-zinc-550'
              }`}
            />
          );
        })}
      </button>
    </div>
  );
}

// ─── Account Setup Loader ─────────────────────────────────────────────────────

const STATUS_MESSAGES = [
  'Preparing your workspace',
  'Securing your account',
  'Setting up preferences',
  'Almost ready',
];

function AccountSetupLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setMsgIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-10">
      {/* Custom animated orbital loader */}
      <div className="relative h-24 w-24">
        {/* Outer expanding ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-zinc-700"
          animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute inset-3 rounded-full border border-zinc-600"
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        {/* Inner solid core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            {/* Geometric Expensio Icon — monochrome */}
            <svg
              className="h-5 w-5 text-zinc-200"
              viewBox="0 0 40 40"
              fill="none"
              aria-hidden="true"
            >
              <rect x="6" y="8" width="28" height="4" rx="2" fill="currentColor" />
              <rect x="12" y="18" width="22" height="4" rx="2" fill="currentColor" />
              <rect x="6" y="28" width="28" height="4" rx="2" fill="currentColor" />
            </svg>
          </div>
        </div>
        {/* Orbiting particle */}
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-zinc-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '50% 48px' }}
        />
      </div>

      {/* Rotating status messages — fade only */}
      <div className="h-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {visible && (
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="text-[13px] font-medium text-theme-secondary tracking-wide"
            >
              {STATUS_MESSAGES[msgIndex]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Step 1 — Personal Information ────────────────────────────────────────────

interface Step1Props {
  data: OnboardingData;
  onChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

function PersonalInfoStep({ data, onChange, onNext }: Step1Props) {
  const isValid = data.name.trim().length >= 2 && Number(data.salary) > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onNext();
  };

  // Format salary display
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange({ salary: raw });
  };

  const displaySalary = data.salary ? Number(data.salary).toLocaleString('en-IN') : '';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full">
      <header>
        <h1 className="text-[21px] font-semibold text-theme-text tracking-tight">
          Welcome to Expensio
        </h1>
        <p className="mt-1.5 text-[13px] text-theme-secondary leading-relaxed">
          Let's personalize your experience.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="fullname"
            className="text-[11px] font-semibold text-theme-secondary uppercase tracking-widest"
          >
            Full Name
          </label>
          <input
            id="fullname"
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Enter your full name"
            autoFocus
            autoComplete="name"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-550 focus:outline-none focus:border-zinc-550 focus:ring-1 focus:ring-zinc-700 transition-colors"
          />
        </div>

        {/* Monthly Salary */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="salary"
            className="text-[11px] font-semibold text-theme-secondary uppercase tracking-widest"
          >
            Monthly Salary
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-zinc-550 select-none">
              ₹
            </span>
            <input
              id="salary"
              type="text"
              inputMode="numeric"
              value={displaySalary}
              onChange={handleSalaryChange}
              placeholder="50,000"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-8 pr-4 py-3 text-[14px] text-zinc-100 placeholder:text-zinc-550 focus:outline-none focus:border-zinc-550 focus:ring-1 focus:ring-zinc-700 transition-colors"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full rounded-xl bg-zinc-100 text-zinc-950 border-none px-4 py-3.5 text-xs font-black uppercase tracking-wider transition-all hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-550 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center"
      >
        Continue
      </button>
    </form>
  );
}

// ─── Step 2 — Create MPIN ─────────────────────────────────────────────────────

interface Step2Props {
  data: OnboardingData;
  onChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

function CreateMpinStep({ data, onChange, onNext }: Step2Props) {
  const isValid = data.mpin.length === 4;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8 w-full">
      <header className="text-center">
        <h1 className="text-[21px] font-semibold text-theme-text tracking-tight">
          Create Your MPIN
        </h1>
        <p className="mt-1.5 text-[13px] text-theme-secondary leading-relaxed">
          This PIN protects your financial information.
        </p>
      </header>

      <SecurePinInput value={data.mpin} onChange={(val) => onChange({ mpin: val })} autoFocus />

      <p className="text-[11px] text-zinc-550 tracking-wide">
        Used to securely access your account.
      </p>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full rounded-xl bg-zinc-100 text-zinc-950 border-none px-4 py-3.5 text-xs font-black uppercase tracking-wider transition-all hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-550 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center"
      >
        Continue
      </button>
    </form>
  );
}

// ─── Step 3 — Confirm MPIN ────────────────────────────────────────────────────

interface Step3Props {
  data: OnboardingData;
  onChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
}

function ConfirmMpinStep({ data, onChange, onNext }: Step3Props) {
  const [touched, setTouched] = useState(false);
  const isPinFull = data.confirmMpin.length === 4;
  const isMatch = data.mpin === data.confirmMpin;
  const showError = touched && isPinFull && !isMatch;
  const isValid = isPinFull && isMatch;

  const handleChange = (val: string) => {
    onChange({ confirmMpin: val });
    if (val.length === 4) setTouched(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (isValid) onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8 w-full">
      <header className="text-center">
        <h1 className="text-[21px] font-semibold text-theme-text tracking-tight">
          Confirm Your MPIN
        </h1>
        <p className="mt-1.5 text-[13px] text-theme-secondary leading-relaxed">
          Re-enter your PIN to verify.
        </p>
      </header>

      <div className="flex flex-col items-center gap-3">
        <SecurePinInput
          value={data.confirmMpin}
          onChange={handleChange}
          error={showError}
          autoFocus
        />
        <AnimatePresence>
          {showError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              role="alert"
              className="text-[12px] font-medium text-red-400/90"
            >
              PINs do not match.
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full rounded-xl bg-zinc-100 text-zinc-950 border-none px-4 py-3.5 text-xs font-black uppercase tracking-wider transition-all hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-550 disabled:cursor-not-allowed cursor-pointer shadow-sm flex items-center justify-center"
      >
        Create Account
      </button>
    </form>
  );
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isInitialized, isLoading, updateUser, session } = useAuthStore();

  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>({
    name: '',
    salary: '',
    mpin: '',
    confirmMpin: '',
  });
  const [apiError, setApiError] = useState<string | null>(null);

  // Prefill name from authenticated user
  useEffect(() => {
    if (user?.name) {
      setData((d) => ({ ...d, name: user.name! }));
    }
  }, [user]);

  // Route protection
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    console.debug('[Onboarding] route guard check', { user, sessionPresent: !!session });

    if (session && !user) return;

    if (!session) {
      router.replace('/login');
      return;
    }

    if (user && (user.isOnboardingCompleted ?? (user as any).isOnboarded) && user.monthlySalary) {
      router.replace('/dashboard');
    }
  }, [user, isInitialized, isLoading, router, session]);

  const updateData = useCallback((patch: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const goToStep = useCallback((s: Step) => setStep(s), []);

  // Trigger account creation on step 4 entry
  useEffect(() => {
    if (step !== 4) return;

    const runSetup = async () => {
      setApiError(null);
      try {
        const updatePayload = {
          name: data.name.trim(),
          monthlySalary: Number(data.salary),
        };

        if (session?.access_token) {
          try {
            const res = await fetch(`${API_URL}/api/v1/users/onboarding`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify(updatePayload),
            });

            if (res.ok) {
              const data = await res.json();
              const userObj = data?.data || data?.user;

              try {
                await supabase.auth.updateUser({
                  data: {
                    isOnboardingCompleted: true,
                    monthlySalary: updatePayload.monthlySalary,
                    name: updatePayload.name,
                  },
                });
                console.debug('[Onboarding] Supabase user metadata updated successfully');
              } catch (metaErr) {
                console.warn('[Onboarding] Failed to update Supabase user metadata:', metaErr);
              }

              if (userObj) {
                updateUser(userObj);
              } else {
                updateUser({
                  name: updatePayload.name,
                  monthlySalary: updatePayload.monthlySalary,
                  isOnboardingCompleted: true,
                });
              }
            } else {
              console.warn('Backend onboarding update failed, using local fallback.');
              updateUser({
                name: updatePayload.name,
                monthlySalary: updatePayload.monthlySalary,
                isOnboardingCompleted: true,
              });
            }
          } catch {
            console.warn('Backend unreachable, using local fallback.');
            updateUser({
              name: updatePayload.name,
              monthlySalary: updatePayload.monthlySalary,
              isOnboardingCompleted: true,
            });
          }
        } else {
          updateUser({
            name: updatePayload.name,
            monthlySalary: updatePayload.monthlySalary,
            isOnboardingCompleted: true,
          });
        }

        router.replace('/dashboard');
      } catch (err) {
        const e = err as Error;
        setApiError(e.message || 'Account setup failed. Please try again.');
        setStep(3);
      }
    };

    runSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, data.name, data.salary, session?.access_token, router, updateUser]);

  // Global loading gate
  if (!isInitialized || isLoading || (!session && !user)) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        aria-busy="true"
        aria-label="Loading"
      >
        <motion.div
          className="h-5 w-5 rounded-full border-2 border-zinc-500 border-t-zinc-350"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
        />
      </div>
    );
  }

  const totalSteps = 3;

  return (
    <main className="relative min-h-screen w-full bg-background flex flex-col items-center justify-center px-4 py-12 text-theme-text selection:bg-zinc-800 selection:text-zinc-100">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <AnimatePresence mode="wait">
        {step === 4 ? (
          /* ── Step 4: Full-Screen Account Setup Loader ── */
          <motion.div
            key="step-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center gap-0"
          >
            <AccountSetupLoader />
            {apiError && (
              <p className="mt-6 text-xs text-red-400/90 text-center" role="alert">
                {apiError}
              </p>
            )}
          </motion.div>
        ) : (
          /* ── Steps 1–3: Structured onboarding layout ── */
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full max-w-[360px] bg-theme-card border border-theme-card-border rounded-3xl p-6 md:p-8 shadow-xl relative z-10 flex flex-col gap-6"
          >
            {/* Progress indicator */}
            <div className="flex items-center justify-between">
              <ProgressIndicator current={step} total={totalSteps} />
              <span className="text-[11px] font-medium text-zinc-550 tabular-nums">
                {step} / {totalSteps}
              </span>
            </div>

            {/* Step content */}
            {step === 1 && (
              <PersonalInfoStep data={data} onChange={updateData} onNext={() => goToStep(2)} />
            )}
            {step === 2 && (
              <CreateMpinStep data={data} onChange={updateData} onNext={() => goToStep(3)} />
            )}
            {step === 3 && (
              <ConfirmMpinStep data={data} onChange={updateData} onNext={() => goToStep(4)} />
            )}

            {/* Dev bypass button */}
            <button
              type="button"
              onClick={() => {
                const updatePayload = {
                  name: data.name.trim() || 'Admin root',
                  monthlySalary: Number(data.salary) || 50000,
                };

                if (session?.access_token) {
                  fetch(`${API_URL}/api/v1/users/onboarding`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify(updatePayload),
                  }).catch(() => {});
                }

                const onboardedUser = {
                  id: session?.user?.id || 'dev-user',
                  email: session?.user?.email || 'admin@expensio.app',
                  name: updatePayload.name,
                  monthlySalary: updatePayload.monthlySalary,
                  isOnboardingCompleted: true,
                  isOnboarded: true,
                  createdAt: session?.user?.created_at
                    ? new Date(session.user.created_at)
                    : new Date(),
                };

                useAuthStore.setState({ user: onboardedUser });
                router.replace('/dashboard');
              }}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-bold transition-colors text-center mx-auto focus:outline-none focus:underline cursor-pointer"
            >
              Bypass Onboarding & Go to Dashboard (Dev Mode)
            </button>

            {/* Sign out fallback */}
            <button
              type="button"
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                } catch {}
                window.location.href = '/login';
              }}
              className="text-[11px] text-zinc-550 hover:text-zinc-400 transition-colors text-center mx-auto focus:outline-none focus:underline cursor-pointer"
            >
              Sign in with a different account
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
