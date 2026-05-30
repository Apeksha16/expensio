import { User } from '@expensio/types';

export interface UpdateUserProfileDto {
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  currency?: string;
  timezone?: string;
  monthlySalary?: number | null;
  isOnboardingCompleted?: boolean;
}

export interface CompleteOnboardingDto {
  name: string;
  monthlySalary: number;
}

export type { User };
