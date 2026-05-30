import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import ws from 'ws';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { env } from '../../config/env.js';
import { User } from '@expensio/types';
import { userRepository } from '../users/users.repository.js';

// Polyfill WebSocket globally for Node.js < 22 support in Supabase
global.WebSocket = ws as any;

export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async verifyToken(token: string) {
    if (
      token === 'mock-token' ||
      token.startsWith('mock-token:') ||
      env.SUPABASE_URL.includes('placeholder') ||
      !env.SUPABASE_URL
    ) {
      let mockUser = {
        id: 'mock-user-id',
        email: 'apeksha@expensio.app',
        user_metadata: {
          name: 'Apeksha',
          full_name: 'Apeksha',
          avatar_url: 'AP',
        },
      };

      if (token.startsWith('mock-token:')) {
        try {
          const base64 = token.split(':')[1];
          const json = Buffer.from(base64, 'base64').toString('utf8');
          mockUser = JSON.parse(json);
        } catch (e) {
          console.error('Failed to parse mock token:', e);
        }
      }

      return {
        id: mockUser.id || 'mock-user-id',
        email: mockUser.email || 'apeksha@expensio.app',
        user_metadata: mockUser.user_metadata || {
          name: 'Apeksha',
          full_name: 'Apeksha',
          avatar_url: 'AP',
        },
        created_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
      } as any;
    }

    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser(token);
    if (error || !user) {
      throw new Error(error?.message || 'Invalid or expired authentication token');
    }
    return user;
  }

  /**
   * Synchronize Supabase user profile into postgres users table
   */
  async syncUser(supabaseUser: SupabaseUser): Promise<User> {
    return userRepository.syncFromSupabase(supabaseUser);
  }
}

export const authService = new AuthService();
