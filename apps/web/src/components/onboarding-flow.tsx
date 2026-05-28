'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Step = 1 | 2 | 3;

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const mpinInputRef = useRef<HTMLInputElement>(null);
  const confirmMpinInputRef = useRef<HTMLInputElement>(null);

  // Autofill name if available in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('expensio_auth_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.name) {
          setName(parsed.name);
        }
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  // Handle focus helper
  const focusInput = (stepNum: number) => {
    if (stepNum === 2) {
      mpinInputRef.current?.focus();
    } else if (stepNum === 3) {
      confirmMpinInputRef.current?.focus();
    }
  };

  useEffect(() => {
    focusInput(step);
  }, [step]);

  const handleGoBack = () => {
    if (step > 1) {
      setPinError(false);
      setStep((prev) => (prev - 1) as Step);
    } else {
      router.push('/');
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && salary) {
      setStep(2);
    }
  };

  const handleMpinChange = (val: string) => {
    const sanitized = val.replace(/[^0-9]/g, '').slice(0, 4);
    setMpin(sanitized);
  };

  const handleConfirmMpinChange = (val: string) => {
    const sanitized = val.replace(/[^0-9]/g, '').slice(0, 4);
    setConfirmMpin(sanitized);
    setPinError(false);

    if (sanitized.length === 4) {
      if (sanitized === mpin) {
        // Trigger success & redirect sequence
        setIsFinishing(true);
        // Save details to localStorage
        localStorage.setItem(
          'expensio_profile',
          JSON.stringify({
            name,
            salary,
            mpin: mpin,
          })
        );
        // Set session unlocked
        sessionStorage.setItem('expensio_unlocked', 'true');

        setTimeout(() => {
          router.push('/dashboard');
        }, 2500);
      } else {
        // Vibrate/Shake
        setPinError(true);
        // Clear confirm pin so they can retry
        setTimeout(() => {
          setConfirmMpin('');
          confirmMpinInputRef.current?.focus();
        }, 800);
      }
    }
  };

  return (
    <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[430px] flex-col bg-background px-7 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-[calc(env(safe-area-inset-top,0px)+16px)] text-foreground">
      {/* Top Navbar */}
      {!isFinishing && (
        <header className="flex items-center justify-between py-2">
          <button
            onClick={handleGoBack}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/70 shadow-sm backdrop-blur-md transition-all active:scale-95 dark:border-white/10 dark:bg-white/5"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
          
          <div className="flex flex-col items-end">
            <span className="text-[12px] font-black tracking-wider uppercase text-muted">
              Step {step} of 3
            </span>
            <div className="mt-1 flex gap-1">
              <div className={`h-1.5 w-6 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-muted/20'}`} />
              <div className={`h-1.5 w-6 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-muted/20'}`} />
              <div className={`h-1.5 w-6 rounded-full transition-all ${step >= 3 ? 'bg-primary' : 'bg-muted/20'}`} />
            </div>
          </div>
        </header>
      )}

      {/* Screens with Slide & Fade Animations */}
      <AnimatePresence mode="wait">
        {isFinishing ? (
          <WorkspaceLoader />
        ) : step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 flex-col"
          >
            {/* Header */}
            <div className="mt-4 text-center">
              <h1 className="text-[28px] font-black tracking-tight">Let’s set up your wallet ✨</h1>
              <p className="mt-1.5 text-[15px] font-medium text-muted">
                This helps personalize your budgets and insights.
              </p>
            </div>

            {/* Premium Wallet Illustration */}
            <div className="my-6 flex justify-center">
              <WalletIllustration />
            </div>

            {/* Form */}
            <form onSubmit={handleStep1Submit} className="flex flex-1 flex-col justify-between">
              <div className="space-y-5">
                {/* Name Field */}
                <div className="space-y-2">
                  <label htmlFor="name-input" className="text-[14px] font-black text-muted">
                    Your name
                  </label>
                  <div className="relative">
                    <input
                      id="name-input"
                      type="text"
                      required
                      placeholder="e.g. Pranav"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-[18px] border border-[#E6E8F1] bg-white px-5 py-4 text-[16px] font-bold text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.02)] outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5"
                    />
                    {name.trim().length > 1 && (
                      <span className="absolute right-4 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <Check size={14} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Salary Field */}
                <div className="space-y-2">
                  <label htmlFor="salary-input" className="text-[14px] font-black text-muted">
                    Current monthly salary
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-5 text-[22px] font-black text-muted">₹</span>
                    <input
                      id="salary-input"
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="50,000"
                      value={salary}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        // Format with commas
                        setSalary(val ? Number(val).toLocaleString('en-IN') : '');
                      }}
                      className="w-full rounded-[18px] border border-[#E6E8F1] bg-white pb-4 pl-11 pr-5 pt-4 text-[22px] font-black text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.02)] outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10 dark:border-white/10 dark:bg-white/5"
                    />
                  </div>
                </div>

                {/* Privacy Card */}
                <div className="rounded-[18px] bg-emerald-50/50 p-4 border border-emerald-100/50 dark:bg-emerald-500/5 dark:border-emerald-500/10">
                  <ul className="space-y-2 text-[13px] font-semibold text-emerald-800 dark:text-emerald-400">
                    <li className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      Used for personalized insights
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      Helps smarter budget planning
                    </li>
                    <li className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      Completely private & secure
                    </li>
                  </ul>
                </div>
              </div>

              {/* Continue CTA */}
              <div className="mt-8">
                <motion.button
                  type="submit"
                  disabled={!name.trim() || !salary}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-between rounded-full bg-[linear-gradient(135deg,#B894FF_0%,#7C5CFF_52%,#5C49E6_100%)] px-6 py-4.5 text-[16px] font-black text-white shadow-[0_16px_32px_rgba(124,92,255,0.3)] transition disabled:opacity-50 disabled:shadow-none"
                >
                  <span>Continue</span>
                  <ArrowRight size={20} strokeWidth={2.5} />
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : step === 2 ? (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 flex-col"
          >
            {/* Header */}
            <div className="mt-4 text-center" onClick={() => focusInput(2)}>
              <h1 className="text-[28px] font-black tracking-tight">Create your MPIN 🔐</h1>
              <p className="mt-1.5 text-[15px] font-medium text-muted">
                This keeps your wallet secure every time you open Expensio.
              </p>
            </div>

            {/* Lock Illustration */}
            <div className="my-6 flex justify-center" onClick={() => focusInput(2)}>
              <LockIllustration />
            </div>

            {/* MPIN Entry Area */}
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex flex-col items-center space-y-6">
                <p className="text-[14px] font-black text-muted uppercase tracking-wider">Create 4-digit MPIN</p>

                {/* Hidden Native Input */}
                <input
                  ref={mpinInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={mpin}
                  onChange={(e) => handleMpinChange(e.target.value)}
                  className="absolute h-0 w-0 opacity-0 pointer-events-none"
                  autoFocus
                />

                {/* PIN Squares Container */}
                <div 
                  className="flex gap-4 cursor-pointer" 
                  onClick={() => focusInput(2)}
                >
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = mpin.length > index;
                    return (
                      <div
                        key={index}
                        className={`flex h-15 w-15 items-center justify-center rounded-[18px] border-2 text-[20px] font-black transition-all ${
                          isFilled
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-[#E6E8F1] bg-white dark:border-white/10 dark:bg-white/5'
                        }`}
                      >
                        {isFilled ? (
                          <span className="h-3.5 w-3.5 rounded-full bg-primary" />
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <p className="text-[13px] font-semibold text-muted">
                  Your MPIN stays encrypted on your device.
                </p>
              </div>

              {/* Continue CTA */}
              <div className="mt-8">
                <motion.button
                  onClick={() => setStep(3)}
                  disabled={mpin.length !== 4}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-between rounded-full bg-[linear-gradient(135deg,#B894FF_0%,#7C5CFF_52%,#5C49E6_100%)] px-6 py-4.5 text-[16px] font-black text-white shadow-[0_16px_32px_rgba(124,92,255,0.3)] transition disabled:opacity-50 disabled:shadow-none"
                >
                  <span>Continue</span>
                  <ArrowRight size={20} strokeWidth={2.5} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 flex-col"
          >
            {/* Header */}
            <div className="mt-4 text-center" onClick={() => focusInput(3)}>
              <h1 className="text-[28px] font-black tracking-tight">Confirm your MPIN</h1>
              <p className="mt-1.5 text-[15px] font-medium text-muted">
                Re-enter your secure PIN to continue.
              </p>
            </div>

            {/* Shield Illustration */}
            <div className="my-6 flex justify-center" onClick={() => focusInput(3)}>
              <ShieldIllustration />
            </div>

            {/* Confirm PIN Entry */}
            <div className="flex flex-1 flex-col justify-between">
              <div className="flex flex-col items-center space-y-6">
                <p className="text-[14px] font-black text-muted uppercase tracking-wider">Confirm 4-digit MPIN</p>

                {/* Hidden Native Input */}
                <input
                  ref={confirmMpinInputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={confirmMpin}
                  onChange={(e) => handleConfirmMpinChange(e.target.value)}
                  className="absolute h-0 w-0 opacity-0 pointer-events-none"
                />

                {/* Shake Animation on Mismatch */}
                <motion.div
                  animate={pinError ? { x: [-10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="flex gap-4 cursor-pointer"
                  onClick={() => focusInput(3)}
                >
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = confirmMpin.length > index;
                    return (
                      <div
                        key={index}
                        className={`flex h-15 w-15 items-center justify-center rounded-[18px] border-2 text-[20px] font-black transition-all ${
                          pinError
                            ? 'border-red-500 bg-red-50/50 dark:bg-red-500/5'
                            : isFilled
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-[#E6E8F1] bg-white dark:border-white/10 dark:bg-white/5'
                        }`}
                      >
                        {isFilled ? (
                          <span className={`h-3.5 w-3.5 rounded-full ${pinError ? 'bg-red-500' : 'bg-primary'}`} />
                        ) : null}
                      </div>
                    );
                  })}
                </motion.div>

                {pinError ? (
                  <p className="flex items-center gap-1.5 text-[14px] font-black text-red-500">
                    <ShieldAlert size={16} />
                    MPIN does not match
                  </p>
                ) : (
                  <p className="text-[13px] font-semibold text-muted">
                    Must match your previously created PIN.
                  </p>
                )}
              </div>

              {/* Loader Trigger Button (Disabled, automatically triggers on 4 digits) */}
              <div className="mt-8">
                <button
                  disabled
                  className="flex w-full items-center justify-center rounded-full bg-muted/20 px-6 py-4.5 text-[16px] font-black text-muted/50 transition"
                >
                  Verifying PIN...
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ----------------------------------------------------
// HIGH-FIDELITY DESIGN ASSET ILLUSTRATIONS (CSS-based)
// ----------------------------------------------------

function WalletIllustration() {
  return (
    <div className="relative h-[180px] w-[220px]">
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.15)_0%,transparent_70%)]" />

      {/* Floating Card Left */}
      <div className="absolute left-2 top-4 h-[72px] w-[90px] -rotate-[12deg] rounded-[14px] bg-[linear-gradient(135deg,#FFF0D9_0%,#FFE1B5_100%)] p-2.5 shadow-md dark:bg-[linear-gradient(135deg,#3A2A10_0%,#261B0A_100%)] border border-amber-200/20">
        <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center">
          <span className="text-[11px] font-bold text-amber-600">₹</span>
        </div>
        <div className="mt-4 h-2 w-10 rounded-full bg-amber-700/20" />
      </div>

      {/* Floating Card Right */}
      <div className="absolute right-4 top-2 h-[72px] w-[90px] rotate-[10deg] rounded-[14px] bg-[linear-gradient(135deg,#E6F8EF_0%,#C8F2DD_100%)] p-2.5 shadow-md dark:bg-[linear-gradient(135deg,#103322_0%,#091D13_100%)] border border-emerald-200/20">
        <TrendingUp size={16} className="text-emerald-600" />
        <div className="mt-4 h-2 w-12 rounded-full bg-emerald-700/20" />
      </div>

      {/* Floating Rupees Coin */}
      <div className="absolute left-10 bottom-6 z-25 flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-300 bg-[linear-gradient(135deg,#FFE7A8,#D8A232)] text-[18px] font-black text-amber-800 shadow-md">
        ₹
      </div>

      {/* Central Premium Wallet Body */}
      <div className="absolute bottom-2 left-1/2 z-20 h-[96px] w-[140px] -translate-x-1/2 rounded-[22px] bg-[linear-gradient(145deg,#9D75FF_0%,#7250EF_52%,#4E36C9_100%)] p-4 shadow-[0_16px_36px_rgba(87,61,210,0.35)]">
        {/* Wallet stitch detail */}
        <div className="absolute inset-x-3.5 top-3 h-px bg-white/20" />
        {/* Card slots mock */}
        <div className="absolute top-[22px] left-4 right-4 h-4 rounded-md bg-[#5839DD]/40 border-t border-white/10" />
        {/* Wallet latch */}
        <div className="absolute -right-3 top-1/2 h-[34px] w-[50px] -translate-y-1/2 rounded-[12px] bg-[linear-gradient(135deg,#8E6BFF,#5238D7)] shadow-md border border-white/10 flex items-center justify-end pr-2.5">
          <div className="h-5 w-5 rounded-full bg-white shadow-inner" />
        </div>
      </div>
    </div>
  );
}

function LockIllustration() {
  return (
    <div className="relative h-[180px] w-[200px] flex items-center justify-center">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,92,255,0.18)_0%,transparent_70%)]" />

      {/* Glowing ring */}
      <div className="absolute h-36 w-36 rounded-full border border-primary/20 bg-primary/5 animate-pulse" />
      
      {/* Secondary ring */}
      <div className="absolute h-28 w-28 rounded-full border border-primary/10" />

      {/* Security Particles */}
      <span className="absolute left-6 top-8 text-[18px] text-primary/40">✦</span>
      <span className="absolute right-8 top-12 text-[14px] text-primary/30">✦</span>
      <span className="absolute left-12 bottom-10 text-[16px] text-primary/20">✦</span>
      <span className="absolute right-10 bottom-6 h-3 w-3 rounded-full bg-emerald-400/60 shadow-[0_0_12px_rgba(52,211,153,0.5)]" />

      {/* Floating Shield Lock Container */}
      <div className="relative z-10 flex h-[104px] w-[88px] items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#B894FF,#7C5CFF_50%,#5C49E6)] shadow-[0_20px_45px_rgba(124,92,255,0.4)]">
        <Lock className="text-white" size={38} strokeWidth={2.4} />
      </div>
    </div>
  );
}

function ShieldIllustration() {
  return (
    <div className="relative h-[180px] w-[200px] flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,transparent_70%)]" />

      <div className="absolute h-32 w-32 rounded-full border border-emerald-500/20 bg-emerald-500/5 animate-pulse" />

      {/* Glowing check shield */}
      <div className="relative z-10 flex h-[104px] w-[90px] items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,#34D399,#10B981_50%,#047857)] shadow-[0_20px_45px_rgba(16,185,129,0.35)]">
        <Check className="text-white" size={42} strokeWidth={3.5} />
      </div>
    </div>
  );
}

function WorkspaceLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background px-8 text-center"
    >
      <div className="relative flex h-[120px] w-[120px] items-center justify-center">
        {/* Pulse rings */}
        <div className="absolute inset-0 rounded-[38px] bg-primary/10 animate-ping" />
        
        {/* Animated expanding wallet */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-10 grid h-[104px] w-[104px] place-items-center rounded-[32px] bg-[linear-gradient(135deg,#B894FF_0%,#7C5CFF_50%,#5C49E6_100%)] shadow-[0_22px_54px_rgba(124,92,255,0.4)]"
        >
          <Wallet className="text-white" size={44} strokeWidth={2.4} />
        </motion.div>
      </div>

      <h2 className="mt-10 text-[22px] font-black text-foreground">Preparing your workspace...</h2>
      <p className="mt-2.5 max-w-[260px] text-[15px] font-semibold leading-relaxed text-muted">
        Building your secure digital vault
      </p>
    </motion.div>
  );
}
