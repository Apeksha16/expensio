import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';
import { DashboardSummaryResponse } from '@expensio/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Hook to retrieve the dashboard aggregates summary
 */
export function useDashboardSummary() {
  const session = useAuthStore((state) => state.session);

  return useQuery<DashboardSummaryResponse>({
    queryKey: ['dashboard-summary', session?.user?.id],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/v1/dashboard/summary`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to fetch dashboard summary');
      }

      const resJson = await response.json();
      return resJson.data;
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
