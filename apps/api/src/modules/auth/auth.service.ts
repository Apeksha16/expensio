import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
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
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  async verifyToken(token: string): Promise<SupabaseUser> {
    try {
      // Fast path: verify JWT token locally using Supabase JWT secret
      const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET) as any;
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid authentication token payload');
      }
      return {
        id: decoded.sub,
        email: decoded.email || '',
        user_metadata: decoded.user_metadata || {},
        app_metadata: decoded.app_metadata || {},
        aud: decoded.aud || 'authenticated',
        created_at: decoded.iat
          ? new Date(decoded.iat * 1000).toISOString()
          : new Date().toISOString(),
      } as any;
    } catch (jwtError: any) {
      // Fallback: if local verification fails (e.g. key rotation or expired), query Supabase API
      try {
        const { data, error } = await this.supabase.auth.getUser(token);
        if (error || !data.user) {
          throw new Error('Invalid or expired authentication token');
        }
        return data.user;
      } catch (apiError: any) {
        throw new Error('Invalid or expired authentication token');
      }
    }
  }

  /**
   * Synchronize Supabase user profile into postgres users table
   */
  async syncUser(supabaseUser: SupabaseUser): Promise<User> {
    return userRepository.syncFromSupabase(supabaseUser);
  }
}

export const authService = new AuthService();
