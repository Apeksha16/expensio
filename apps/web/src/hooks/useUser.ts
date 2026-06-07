import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';
import { UpdateProfileInput, CompleteOnboardingInput, UpdateMpinInput } from '@expensio/validation';
import { AuthUser } from '@expensio/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Hook to retrieve the current user profile from server
 */
export function useCurrentUser() {
  const session = useAuthStore((state) => state.session);

  return useQuery<AuthUser>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to fetch user profile');
      }
      const data = await response.json();
      return data.data || data.user;
    },
    enabled: !!session?.access_token,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to update user profile information
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const updateUserLocal = useAuthStore((state) => state.updateUser);

  return useMutation<AuthUser, Error, UpdateProfileInput>({
    mutationFn: async (formData) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to update profile'
        );
      }

      const data = await response.json();
      return data.data || data.user;
    },
    onSuccess: (updatedUser) => {
      updateUserLocal(updatedUser);
      queryClient.setQueryData(['user-profile'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

/**
 * Hook to update security MPIN
 */
export function useUpdateMpin() {
  const session = useAuthStore((state) => state.session);

  return useMutation<void, Error, Omit<UpdateMpinInput, 'confirmMpin'>>({
    mutationFn: async (mpinData) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${API_URL}/api/v1/users/mpin`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(mpinData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update MPIN');
      }
    },
  });
}

/**
 * Hook to complete onboarding steps
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const updateUserLocal = useAuthStore((state) => state.updateUser);

  return useMutation<AuthUser, Error, CompleteOnboardingInput>({
    mutationFn: async (onboardingData) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${API_URL}/api/v1/users/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(onboardingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to complete onboarding'
        );
      }

      const data = await response.json();
      return data.data || data.user;
    },
    onSuccess: (updatedUser) => {
      updateUserLocal(updatedUser);
      queryClient.setQueryData(['user-profile'], updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
