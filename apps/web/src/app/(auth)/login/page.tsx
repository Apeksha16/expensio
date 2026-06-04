'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';

// High-end, clean circular loader spinner
function LoadingSpinner() {
  return (
    <motion.svg
      className="h-4.5 w-4.5 text-zinc-500 dark:text-zinc-400"
      xmlns="http://www.w3.org/2555/svg"
      fill="none"
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.75, ease: 'linear' }}
      aria-hidden="true"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </motion.svg>
  );
}

// Geometric Monochromatic Expensio Logo Component
function ExpensioLogo() {
  return (
    <svg
      className="h-10 w-10 text-zinc-100"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="6" y="8" width="28" height="4.5" rx="2.25" fill="currentColor" />
      <rect x="12" y="17.75" width="22" height="4.5" rx="2.25" fill="currentColor" />
      <rect x="6" y="27.5" width="28" height="4.5" rx="2.25" fill="currentColor" />
    </svg>
  );
}

// Sleek Google Sign-In Button Component with snap interactions
interface GoogleSignInButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

function GoogleSignInButton({ onClick, isLoading }: GoogleSignInButtonProps) {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    if (isLoading) return;
    setIsClicked(true);
    onClick();
  };

  useEffect(() => {
    if (isClicked && !isLoading) {
      const timer = setTimeout(() => setIsClicked(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isClicked, isLoading]);

  const iconVariants = {
    default: { rotate: 0, y: 0, scale: 1 },
    animating: {
      rotate: [0, -8, 6, 0],
      y: [0, -2, 1, 0],
      transition: { duration: 0.22, ease: 'easeInOut' },
    },
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      whileTap={{ scale: 0.98 }}
      className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-zinc-100 shadow-sm transition-all hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      aria-label="Continue with Google"
      aria-busy={isLoading}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <motion.svg
          className="h-4.5 w-4.5 shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
          variants={iconVariants}
          animate={isClicked ? 'animating' : 'default'}
        >
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
        </motion.svg>
      )}
      <span>{isLoading ? 'Signing you in...' : 'Continue with Google'}</span>
    </motion.button>
  );
}

// Greenfield, Centered Viewport Login Page
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

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
      console.error('Google sign-in failed:', err);
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-12 text-theme-text selection:bg-zinc-800 selection:text-zinc-100">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[360px] bg-theme-card border border-theme-card-border rounded-3xl p-6 md:p-8 shadow-xl relative z-10 flex flex-col items-center gap-6"
      >
        {/* 1. Geometric Logo */}
        <div className="text-theme-text" aria-hidden="true">
          <ExpensioLogo />
        </div>

        {/* 2. Welcome Message */}
        <header className="text-center">
          <h1 className="text-theme-text text-[21px] font-semibold tracking-tight leading-none">
            Sign in to Expensio
          </h1>
          <p className="mt-2 text-[12px] font-semibold text-theme-secondary">
            Enter your workspace with Google authentication.
          </p>
        </header>

        {/* 3. Google Sign In Button Container */}
        <div className="w-full">
          <GoogleSignInButton onClick={handleGoogleLogin} isLoading={isLoading} />

          {error && (
            <p className="mt-4 text-center text-xs font-semibold text-red-500/90" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* 4. Small Legal Text */}
        <footer className="text-center w-full">
          <p className="text-[10px] leading-relaxed text-theme-muted">
            By continuing, you agree to Expensio's{' '}
            <a href="#" className="underline hover:text-theme-text transition-colors">
              Terms
            </a>{' '}
            and{' '}
            <a href="#" className="underline hover:text-theme-text transition-colors">
              Privacy Policy
            </a>
            .
          </p>
        </footer>
      </motion.div>
    </main>
  );
}
