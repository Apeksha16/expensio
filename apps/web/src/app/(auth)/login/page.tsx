'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      } as any);

      if (authError) {
        throw authError;
      }
    } catch (err) {
      console.error('Google sign-in failed:', err);
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-gray-100">
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="flex items-center justify-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950 px-6 py-3 text-sm font-bold text-zinc-300 shadow-sm transition-all hover:border-zinc-700 hover:bg-zinc-900/60 hover:text-zinc-100 active:scale-[0.98]"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
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
        <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
      </button>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}
