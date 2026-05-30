import { User } from '@expensio/types';
import { userRepository } from './users.repository.js';

export class UsersService {
  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return userRepository.findById(id);
  }

  /**
   * Check if a username is already taken by another user
   */
  async isUsernameTaken(username: string, excludeUserId?: string): Promise<boolean> {
    return userRepository.isUsernameTaken(username, excludeUserId);
  }

  /**
   * Update user profile information
   */
  async updateUser(
    id: string,
    data: {
      name?: string | null;
      username?: string | null;
      avatarUrl?: string | null;
      currency?: string;
      timezone?: string;
      monthlySalary?: number | null;
      isOnboardingCompleted?: boolean;
    }
  ): Promise<User> {
    return userRepository.update(id, data);
  }

  /**
   * Complete user onboarding
   */
  async completeOnboarding(
    userId: string,
    data: {
      name: string;
      monthlySalary: number;
    }
  ): Promise<User> {
    // Validate input
    if (!data.name || data.name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters');
    }

    if (data.name.length > 100) {
      throw new Error('Name must be at most 100 characters');
    }

    if (typeof data.monthlySalary !== 'number' || data.monthlySalary <= 0) {
      throw new Error('Monthly salary must be greater than 0');
    }

    // Update user with onboarding data
    return userRepository.update(userId, {
      name: data.name.trim(),
      monthlySalary: data.monthlySalary,
      isOnboardingCompleted: true,
    });
  }
}

export const usersService = new UsersService();
