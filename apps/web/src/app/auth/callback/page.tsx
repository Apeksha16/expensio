'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Finishing sign in...');

  useEffect(() => {
    const finalizeAuth = async () => {
      const nextPath = searchParams.get('next') || '/';
      const code = searchParams.get('code');

      try {
        if (code && supabase.auth.exchangeCodeForSession) {
          const { error } = await supabase.auth.exchangeCodeForSession(code as any);
          if (error) {
            throw error;
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          throw new Error('No session found after Google sign-in.');
        }

        router.replace(nextPath);
      } catch (err) {
        console.error('Auth callback failed:', err);
        setMessage(err instanceof Error ? err.message : 'Unable to complete sign in.');
        setTimeout(() => router.replace('/login'), 1800);
      }
    };

    finalizeAuth();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-200 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  );
}
