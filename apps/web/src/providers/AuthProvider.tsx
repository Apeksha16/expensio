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
  const { user, isInitialized, isLoading } = useAuthStore();

  const syncUserWithBackend = async (session: Session) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Backend sync failed');
      }

      const data = await response.json();
      const dbUser: AuthUser = data.user;
      setSession(session, dbUser);
    } catch (err) {
      console.error('Failed to sync user profile with backend:', err);
      // Fallback: Use supabase user metadata
      const user = session.user;
      const fallbackUser: AuthUser = {
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
      setSession(session, fallbackUser);
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
          await syncUserWithBackend(session);
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
      console.log('Supabase auth event:', event);
      if (session) {
        setLoading(true);
        await syncUserWithBackend(session);
      } else {
        clearSession();
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
    if (!isInitialized || isLoading) return;

    const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/offline'];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user) {
      if (!isPublicRoute) {
        router.push('/login');
      }
    } else {
      // User is logged in
      const isOnboarded =
        (user.isOnboardingCompleted ?? (user as any).isOnboarded) && user.monthlySalary;

      if (!isOnboarded) {
        if (pathname !== '/onboarding') {
          router.push('/onboarding');
        }
      } else {
        // User is onboarded
        if (pathname === '/onboarding' || pathname === '/login' || pathname === '/register') {
          router.push('/');
        }
      }
    }
  }, [user, isInitialized, isLoading, pathname, router]);

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
