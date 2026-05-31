'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { AuthUser } from '@expensio/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const AuthContext = createContext({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, clearSession, setInitialized, setLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const { user, session, isInitialized, isLoading } = useAuthStore();

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
    try {
      // Temporary debug: log masked access token before calling backend
      try {
        const token = session.access_token;
        const masked = token ? `${token.slice(0, 8)}...${token.slice(-4)}` : 'no-token';
        console.debug('[AuthProvider] syncUserWithBackend - token:', masked);
      } catch (err) {
        console.debug('[AuthProvider] syncUserWithBackend - token masking failed');
      }
      const response = await fetch(`${API_URL}/api/v1/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        console.warn(`Backend sync skipped: ${response.status} ${response.statusText}`);
        setSession(session, buildFallbackUser(session));
        return;
      }

      const data = await response.json();
      const dbUser: AuthUser = data.user;
      setSession(session, dbUser);
    } catch (err) {
      console.warn('Backend sync unavailable, using Supabase session data:', err);
      setSession(session, buildFallbackUser(session));
    }
  };

  useEffect(() => {
    // Check active session immediately on mount
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          setSession(session, buildFallbackUser(session));
          void syncUserWithBackend(session);
        } else {
          clearSession();
        }
      } catch (err) {
        console.error('Error during initial session validation:', err);
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
      console.log('[AuthProvider] Supabase auth event:', event);
      if (session) {
        console.log('[AuthProvider] session received, applying fallback user and syncing backend');
        setSession(session, buildFallbackUser(session));
        setLoading(false);
        void syncUserWithBackend(session);
      } else {
        clearSession();
      }
      setInitialized(true);
      console.log('[AuthProvider] initialized=true, isLoading:', false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // REDIRECTION GUARD
  useEffect(() => {
    if (!isInitialized) return;

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

    if (!effectiveUser && !session) {
      if (!isPublicRoute) {
        console.debug('[AuthProvider] redirecting to /login from', pathname);
        router.replace('/login');
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
            '[AuthProvider] user not onboarded, redirecting to /onboarding from',
            pathname,
            'user:',
            effectiveUser
          );
          router.replace('/onboarding');
        }
      } else {
        // User is onboarded
        if (pathname === '/onboarding' || pathname === '/login' || pathname === '/register') {
          console.debug('[AuthProvider] user onboarded, redirecting to / from', pathname);
          router.replace('/');
        }
      }
    }
  }, [user, session, isInitialized, isLoading, pathname, router]);

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
