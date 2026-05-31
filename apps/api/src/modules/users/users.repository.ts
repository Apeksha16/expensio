import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq, and, ne } from 'drizzle-orm';
import { User } from '@expensio/types';

export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  /**
   * Find user by Supabase auth ID
   */
  async findBySupabaseId(supabaseAuthId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseAuthId, supabaseAuthId))
      .limit(1);
    return user || null;
  }

  /**
   * Check if username is taken by another user
   */
  async isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
    const conditions = [eq(users.username, username)];

    if (excludeUserId) {
      conditions.push(ne(users.id, excludeUserId));
    }

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(...conditions))
      .limit(1);

    return !!existingUser;
  }

  /**
   * Create a new user
   */
  async create(data: {
    id: string;
    email: string;
    name?: string | null;
    avatarUrl?: string | null;
    supabaseAuthId?: string;
    provider?: string;
  }): Promise<User> {
    const [newUser] = await db
      .insert(users)
      .values({
        id: data.id,
        email: data.email,
        name: data.name || null,
        avatarUrl: data.avatarUrl || null,
        supabaseAuthId: data.supabaseAuthId as any,
        provider: data.provider || 'google',
        currency: 'INR',
        isOnboardingCompleted: false,
      })
      .returning();

    return newUser;
  }

  /**
   * Update user information
   */
  async update(
    id: string,
    data: {
      email?: string;
      name?: string | null;
      username?: string | null;
      avatarUrl?: string | null;
      currency?: string;
      timezone?: string;
      monthlySalary?: number | null;
      isOnboardingCompleted?: boolean;
      supabaseAuthId?: string;
      provider?: string;
    }
  ): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        supabaseAuthId: data.supabaseAuthId ?? undefined,
        provider: data.provider ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found or update failed');
    }

    return updatedUser;
  }

  /**
   * Sync user from Supabase auth provider
   */
  async syncFromSupabase(supabaseUser: any): Promise<User> {
    // Type as any since Supabase User type can vary
    const typedUser = supabaseUser as {
      id: string;
      email: string;
      user_metadata?: {
        name?: string;
        full_name?: string;
        avatar_url?: string;
      };
    };

    const userId = typedUser.id;
    const email = typedUser.email;

    if (!email) {
      throw new Error('User email is required to sync profile');
    }

    const name = typedUser.user_metadata?.name || typedUser.user_metadata?.full_name || null;
    const avatarUrl = typedUser.user_metadata?.avatar_url || null;

    // Check if user already exists
    const existingUser = await this.findBySupabaseId(userId);

    if (existingUser) {
      // Update if details changed
      if (
        existingUser.email !== email ||
        existingUser.name !== name ||
        existingUser.avatarUrl !== avatarUrl
      ) {
        return this.update(userId, {
          email,
          name,
          avatarUrl,
          supabaseAuthId: userId,
          provider: 'google',
        });
      }
      return existingUser;
    }

    const existingUserByEmail = await this.findByEmail(email);

    if (existingUserByEmail) {
      return this.update(existingUserByEmail.id, {
        email,
        name,
        avatarUrl,
        supabaseAuthId: userId,
        provider: 'google',
      });
    }

    // Create new user
    return this.create({
      id: userId,
      email,
      name,
      avatarUrl,
      supabaseAuthId: userId as any,
      provider: 'google',
    });
  }
}

export const userRepository = new UserRepository();
