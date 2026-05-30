import { AuthUser } from '@expensio/types';

export interface UpdateUserProfileDto {
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  currency?: string;
  timezone?: string;
  monthlySalary?: number | null;
  isOnboarded?: boolean;
}
