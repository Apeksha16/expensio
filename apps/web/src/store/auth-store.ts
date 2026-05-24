import { create } from 'zustand';
import { AuthUser } from '@expensio/types';
import { Session } from '@supabase/supabase-js';

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  setSession: (session: Session | null, user: AuthUser | null) => void;
  clearSession: () => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  updateUser: (user: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,
  setSession: (session, user) => set({ session, user, isLoading: false }),
  clearSession: () => set({ session: null, user: null, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  updateUser: (user) => set((state) => ({
    user: state.user ? { ...state.user, ...user } : null
  })),
}));
