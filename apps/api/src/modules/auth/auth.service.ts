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
      // Local CPU signature verification (no network call)
      const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET) as any;

      // Reconstruct SupabaseUser object to preserve existing contracts
      const user = {
        id: decoded.sub,
        email: decoded.email,
        user_metadata: decoded.user_metadata || {},
        app_metadata: decoded.app_metadata || {},
        aud: decoded.aud || 'authenticated',
        role: decoded.role || 'authenticated',
        created_at: decoded.iat
          ? new Date(decoded.iat * 1000).toISOString()
          : new Date().toISOString(),
      } as SupabaseUser;

      return user;
    } catch (error: any) {
      throw new Error('Invalid or expired authentication token');
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
