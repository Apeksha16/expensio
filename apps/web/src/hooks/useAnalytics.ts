import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';
import { AnalyticsResponse } from '@expensio/types';
import { AnalyticsFiltersInput } from '@expensio/validation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Hook to retrieve the analytics summaries and trends
 */
export function useAnalyticsSummary(filters?: AnalyticsFiltersInput) {
  const session = useAuthStore((state) => state.session);

  return useQuery<AnalyticsResponse>({
    queryKey: ['analytics-summary', session?.user?.id, filters],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const queryParams = new URLSearchParams();
      if (filters) {
        if (filters.startDate) queryParams.append('startDate', filters.startDate);
        if (filters.endDate) queryParams.append('endDate', filters.endDate);
        if (filters.month !== undefined) queryParams.append('month', String(filters.month));
        if (filters.year !== undefined) queryParams.append('year', String(filters.year));
      }

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const response = await fetch(`${API_URL}/api/v1/analytics/summary${queryString}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to fetch analytics summary');
      }

      const resJson = await response.json();
      return resJson.data;
    },
    enabled: !!session?.access_token,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
  });
}

export interface HealthScoreResponse {
  score: number;
  riskLevel: string;
  metrics: {
    savingsRate: number;
    budgetDiscipline: number;
    subscriptionBurden: number;
  };
}

export function useHealthScore() {
  const session = useAuthStore((state) => state.session);

  return useQuery<HealthScoreResponse>({
    queryKey: ['health-score', session?.user?.id],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');
      const response = await fetch(`${API_URL}/api/v1/analytics/health`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to fetch health score');
      }
      const resJson = await response.json();
      return resJson.data;
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60000,
  });
}
