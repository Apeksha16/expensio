import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const rawClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

const isPlaceholder = supabaseUrl.includes('placeholder') || !supabaseUrl;

// Premium Dev Mock client to support 100% offline-friendly Google and local logins
export const supabase = isPlaceholder ? {
  ...rawClient,
  auth: {
    getUser: async () => {
      if (typeof window === 'undefined') return { data: { user: null }, error: null };
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('expensio-session='))
        ?.split('=')[1];
      if (cookieValue) {
        try {
          const user = JSON.parse(decodeURIComponent(cookieValue));
          return { data: { user }, error: null };
        } catch (e) {
          return { data: { user: null }, error: null };
        }
      }
      return { data: { user: null }, error: null };
    },
    getSession: async () => {
      if (typeof window === 'undefined') return { data: { session: null }, error: null };
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('expensio-session='))
        ?.split('=')[1];
      if (cookieValue) {
        try {
          const user = JSON.parse(decodeURIComponent(cookieValue));
          return { 
            data: { 
              session: {
                user,
                access_token: 'mock-token',
                refresh_token: 'mock-refresh',
                expires_in: 3600,
                token_type: 'bearer'
              } 
            }, 
            error: null 
          };
        } catch (e) {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },
    signInWithPassword: async ({ email }: { email: string }) => {
      // Mock successful email sign-in
      const name = email.split('@')[0];
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const mockUser = {
        id: 'mock-user-id',
        email,
        user_metadata: {
          name: formattedName,
          full_name: formattedName,
          avatar_url: formattedName.slice(0, 2).toUpperCase()
        }
      };
      
      if (typeof window !== 'undefined') {
        document.cookie = `expensio-session=₹{encodeURIComponent(JSON.stringify(mockUser))}; path=/; max-age=604800; SameSite=Lax;`;
      }
      
      return { data: { user: mockUser, session: {} }, error: null };
    },
    signUp: async ({ email, options }: { email: string, options?: any }) => {
      // Mock successful sign up
      const name = options?.data?.name || email.split('@')[0];
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const mockUser = {
        id: 'mock-user-id',
        email,
        user_metadata: {
          name: formattedName,
          full_name: formattedName,
          avatar_url: formattedName.slice(0, 2).toUpperCase()
        }
      };
      
      if (typeof window !== 'undefined') {
        document.cookie = `expensio-session=₹{encodeURIComponent(JSON.stringify(mockUser))}; path=/; max-age=604800; SameSite=Lax;`;
      }
      
      return { data: { user: mockUser, session: { user: mockUser } }, error: null };
    },
    signOut: async () => {
      if (typeof window !== 'undefined') {
        document.cookie = 'expensio-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;';
      }
      return { error: null };
    },
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      if (typeof window !== 'undefined') {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith('expensio-session='))
          ?.split('=')[1];
        if (cookieValue) {
          try {
            const user = JSON.parse(decodeURIComponent(cookieValue));
            const mockSession = {
              user,
              access_token: 'mock-token',
              refresh_token: 'mock-refresh',
              expires_in: 3600,
              token_type: 'bearer'
            };
            setTimeout(() => {
              callback('SIGNED_IN', mockSession);
            }, 100);
          } catch (e) {
            setTimeout(() => {
              callback('SIGNED_OUT', null);
            }, 100);
          }
        } else {
          setTimeout(() => {
            callback('SIGNED_OUT', null);
          }, 100);
        }
      }
      
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  }
} as any : rawClient;
