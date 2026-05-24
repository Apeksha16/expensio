import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq, and, ne } from 'drizzle-orm';
import { AuthUser } from '@expensio/types';
import { UpdateUserProfileDto } from './users.types.js';

export class UsersService {
  /**
   * Retrieve a user by ID
   */
  async getUserById(id: string): Promise<AuthUser | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user || null;
  }

  /**
   * Check if a username is already taken by another user
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
   * Update user profile information
   */
  async updateUser(id: string, data: UpdateUserProfileDto): Promise<AuthUser> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error('User not found or update failed');
    }

    return updatedUser;
  }
}

export const usersService = new UsersService();
