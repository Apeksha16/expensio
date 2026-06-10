'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { AuthUser } from '@expensio/types';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const AuthContext = createContext({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, clearSession, setInitialized, setLoading } = useAuthStore(
    useShallow((state) => ({
      setSession: state.setSession,
      clearSession: state.clearSession,
      setInitialized: state.setInitialized,
      setLoading: state.setLoading,
    }))
  );
  const pathname = usePathname();
  const router = useRouter();
  const { user, session, isInitialized, isLoading } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      session: state.session,
      isInitialized: state.isInitialized,
      isLoading: state.isLoading,
    }))
  );
  const syncInProgressRef = useRef<string | null>(null);
  const lastSyncedTokenRef = useRef<string | null>(null);

  const buildFallbackUser = (session: Session): AuthUser => {
    const user = session.user;
    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || user.user_metadata?.full_name || '',
      avatarUrl: user.user_metadata?.avatar_url || '',
      monthlySalary: user.user_metadata?.monthlySalary || (user as any).monthlySalary || null,
      isOnboardingCompleted:
        user.user_metadata?.isOnboardingCompleted ||
        user.user_metadata?.isOnboarded ||
        (user as any).isOnboardingCompleted ||
        (user as any).isOnboarded ||
        false,
      createdAt: new Date(user.created_at),
    };
  };

  const syncUserWithBackend = async (session: Session) => {
    const token = session.access_token;
    if (syncInProgressRef.current === token) {
      console.debug(
        '[AuthProvider] Sync already in progress for this token, skipping duplicate call'
      );
      return;
    }
    if (lastSyncedTokenRef.current === token) {
      console.debug('[AuthProvider] Token already synced successfully, skipping duplicate call');
      return;
    }
    syncInProgressRef.current = token;

    try {
      console.debug('[AuthProvider] Starting backend sync...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(
          `[AuthProvider] Backend sync skipped: ${response.status} ${response.statusText}`
        );
        return;
      }

      const data = await response.json();
      const dbUser: AuthUser = data.data?.user || data.user;
      console.debug('[AuthProvider] Backend sync successful:', dbUser);
      lastSyncedTokenRef.current = token;
      setSession(session, dbUser);
    } catch (err) {
      console.warn('[AuthProvider] Backend sync unavailable, using Supabase session data:', err);
    } finally {
      if (syncInProgressRef.current === token) {
        syncInProgressRef.current = null;
      }
    }
  };

  useEffect(() => {
    console.log(
      `%c🚀 Expensio App Version: ${process.env.NEXT_PUBLIC_APP_VERSION}`,
      'color: #3b82f6; font-size: 14px; font-weight: bold; padding: 4px; border-radius: 4px; background: #eff6ff;'
    );
    console.debug('[AuthProvider] Mount: registering auth listener and checking session');

    // Check active session immediately on mount
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const current = useAuthStore.getState().session;
          if (current?.access_token === session.access_token) {
            console.debug('[AuthProvider] Initial session already handled by listener, skipping');
            return;
          }
          console.debug('[AuthProvider] Initial session found via getSession');
          setSession(session, buildFallbackUser(session));
          await syncUserWithBackend(session);
        } else {
          console.debug('[AuthProvider] No initial session found via getSession');
          clearSession();
        }
      } catch (err) {
        console.error('[AuthProvider] Error during initial session validation:', err);
        clearSession();
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      const state = useAuthStore.getState();
      const alreadyInitialized = state.isInitialized;
      const currentSession = state.session;

      console.debug(
        '[AuthProvider] Supabase auth event:',
        event,
        'alreadyInitialized:',
        alreadyInitialized,
        'sessionPresent:',
        !!session
      );

      if (session) {
        if (currentSession?.access_token === session.access_token) {
          console.debug('[AuthProvider] Session token matches current session, skipping update');
          return;
        }

        if (!alreadyInitialized) {
          setLoading(true);
        }

        const fallbackUser = buildFallbackUser(session);
        const currentUser = state.user;
        const mergedUser = currentUser ? { ...fallbackUser, ...currentUser } : fallbackUser;

        setSession(session, mergedUser);

        if (!alreadyInitialized) {
          await syncUserWithBackend(session);
        } else {
          void syncUserWithBackend(session);
        }
      } else {
        if (currentSession) {
          clearSession();
        }
      }

      setInitialized(true);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // REDIRECTION GUARD
  useEffect(() => {
    console.debug(
      '[AuthProvider] Redirection guard effect running. isInitialized:',
      isInitialized,
      'pathname:',
      pathname
    );
    if (!isInitialized) {
      return;
    }

    const publicRoutes = [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/offline',
      '/auth/callback',
    ];
    const isPublicRoute = publicRoutes.includes(pathname);
    const effectiveUser = user ?? (session ? buildFallbackUser(session) : null);

    console.debug('[AuthProvider] Redirection guard processing:', {
      userPresent: !!user,
      sessionPresent: !!session,
      isInitialized,
      isLoading,
      pathname,
      isPublicRoute,
      effectiveUserPresent: !!effectiveUser,
    });

    let timeoutId: NodeJS.Timeout;

    if (!effectiveUser && !session) {
      if (!isPublicRoute) {
        console.debug('[AuthProvider] Redirecting to /login from', pathname);
        router.replace('/login');

        // Fallback hard redirect if router.replace stalls
        timeoutId = setTimeout(() => {
          if (window.location.pathname !== '/login') {
            console.warn(
              '[AuthProvider] Router replace stalled, performing hard redirect to /login'
            );
            window.location.replace('/login');
          }
        }, 8000);
      }
    } else {
      // User is logged in
      const isOnboarded = effectiveUser
        ? (effectiveUser.isOnboardingCompleted ?? (effectiveUser as any).isOnboarded) &&
          effectiveUser.monthlySalary
        : false;

      if (!isOnboarded) {
        if (pathname !== '/onboarding') {
          console.debug(
            '[AuthProvider] User not onboarded, redirecting to /onboarding from',
            pathname,
            'user:',
            effectiveUser
          );
          router.replace('/onboarding');

          // Fallback hard redirect if router.replace stalls
          timeoutId = setTimeout(() => {
            if (window.location.pathname !== '/onboarding') {
              console.warn(
                '[AuthProvider] Router replace stalled, performing hard redirect to /onboarding'
              );
              window.location.replace('/onboarding');
            }
          }, 8000);
        }
      } else {
        // User is onboarded
        if (pathname === '/onboarding' || pathname === '/login' || pathname === '/register') {
          console.debug('[AuthProvider] User onboarded, redirecting to /dashboard from', pathname);
          router.replace('/dashboard');

          // Fallback hard redirect if router.replace stalls
          timeoutId = setTimeout(() => {
            if (window.location.pathname !== '/dashboard' && window.location.pathname !== '/') {
              console.warn(
                '[AuthProvider] Router replace stalled, performing hard redirect to /dashboard'
              );
              window.location.replace('/dashboard');
            }
          }, 8000);
        }
      }
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, session, isInitialized, isLoading, pathname, router]);

  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/offline',
    '/auth/callback',
  ];
  const isPublicRoute = publicRoutes.includes(pathname);
  const effectiveUser = user ?? (session ? buildFallbackUser(session) : null);
  const isAuthenticated = !!effectiveUser || !!session;
  const isOnboarded = effectiveUser
    ? (effectiveUser.isOnboardingCompleted ?? (effectiveUser as any).isOnboarded) &&
      !!effectiveUser.monthlySalary
    : false;

  const showSplash =
    !isInitialized ||
    isLoading ||
    (isAuthenticated && !isOnboarded && pathname !== '/onboarding') ||
    (!isAuthenticated && !isPublicRoute);

  if (showSplash) {
    return (
      <div className="min-h-screen w-full bg-background text-theme-text flex flex-col items-center justify-center select-none relative overflow-hidden transition-colors duration-350">
        {/* Ambient background glows */}
        <div className="absolute top-[-20%] left-[-20%] w-[500px] h-[500px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col items-center gap-8 z-10">
          {/* Concentric rotating dashed vector circles wrapper */}
          <div className="relative h-32 w-32 flex items-center justify-center">
            {/* Outer dashed ring rotating clockwise */}
            <motion.div
              className="absolute inset-0 rounded-full border border-dashed border-indigo-500/20 dark:border-indigo-500/30"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
            />
            {/* Middle dashed ring rotating counter-clockwise */}
            <motion.div
              className="absolute inset-3 rounded-full border border-dashed border-cyan-500/25 dark:border-cyan-500/35"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 9, ease: 'linear' }}
            />
            {/* Inner dashed ring rotating clockwise */}
            <motion.div
              className="absolute inset-6 rounded-full border border-dashed border-indigo-400/15 dark:border-indigo-400/25"
              animate={{ rotate: 180 }}
              transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            />

            {/* Pulsing Expensio Geometric Logo */}
            <motion.div
              className="h-16 w-16 rounded-[22px] bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 shadow-[0_8px_32px_rgba(99,102,241,0.15)] dark:shadow-[0_8px_32px_rgba(99,102,241,0.25)] z-10"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <div className="h-full w-full rounded-[20px] bg-theme-card flex items-center justify-center">
                <svg
                  className="h-8 w-8 text-zinc-100"
                  viewBox="0 0 40 40"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect x="6" y="8" width="28" height="4.5" rx="2.25" fill="currentColor" />
                  <rect x="12" y="17.75" width="22" height="4.5" rx="2.25" fill="currentColor" />
                  <rect x="6" y="27.5" width="28" height="4.5" rx="2.25" fill="currentColor" />
                </svg>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-black tracking-widest uppercase bg-gradient-to-b from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Expensio
            </h1>
            <p className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest animate-pulse">
              Securing connection
            </p>
          </div>

          {/* Premium linear page loader with ambient glow */}
          <div className="w-36 h-1 rounded-full bg-zinc-800 overflow-hidden relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
              initial={{ left: '-40%', width: '40%' }}
              animate={{ left: '100%' }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              style={{ position: 'absolute', top: 0 }}
            />
          </div>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
