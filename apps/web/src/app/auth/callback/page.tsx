'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const hasStartedRef = useRef(false);
  const [message, setMessage] = useState('Finishing sign in...');

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;
    let isMounted = true;

    const finalizeAuth = async () => {
      const searchParams =
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const nextPath = (searchParams && searchParams.get('next')) || '/';
      const code = searchParams?.get('code');

      try {
        // Prefer reacting to the client's auth event. If the client already
        // created the session during initialization, `getSession()` will return
        // it immediately. Otherwise listen for `SIGNED_IN` and redirect once
        // the subscription reports the session.
        console.debug(
          'AuthCallbackPage: waiting for session (onAuthStateChange + polling fallback)'
        );

        let unsub: any = null;
        const { data: subData } = supabase.auth.onAuthStateChange((event, session) => {
          console.debug('AuthCallbackPage:onAuthStateChange', event, !!session);
          if (event === 'SIGNED_IN' && session) {
            try {
              unsub?.subscription.unsubscribe?.();
            } catch {}
            if (isMounted) router.replace(nextPath);
          }
        });
        unsub = subData;

        // Immediate check + polling fallback
        for (let attempt = 0; attempt < 20; attempt += 1) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            try {
              unsub?.subscription.unsubscribe?.();
            } catch {}
            if (isMounted) router.replace(nextPath);
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 150));
        }

        throw new Error('No session found after Google sign-in.');
      } catch (err) {
        console.error('Auth callback failed:', err);
        if (isMounted) {
          setMessage(err instanceof Error ? err.message : 'Unable to complete sign in.');
          setTimeout(() => router.replace('/login'), 1800);
        }
      }
    };

    finalizeAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-200 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  );
}
