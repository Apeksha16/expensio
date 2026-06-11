import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface RecurringExpense {
  id: string;
  amount: number;
  currency: string;
  description: string | null;
  categoryId: string;
  accountId: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  type: 'standard' | 'subscription';
  provider: string | null;
  startDate: string;
  endDate: string | null;
  lastGeneratedDate: string | null;
  nextGenerationDate: string;
  status: 'active' | 'paused' | 'cancelled';
}

export function useRecurring() {
  const token = useAuthStore((state) => state.session?.access_token);

  return useQuery<RecurringExpense[]>({
    queryKey: ['recurring'],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(`${API_URL}/api/v1/recurring`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data?.items || [];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export interface SubscriptionInsights {
  totalActive: number;
  totalMonthlyCommitment: number;
  totalAnnualCommitment: number;
  upcomingRenewals: RecurringExpense[];
}

export function useSubscriptionInsights() {
  const token = useAuthStore((state) => state.session?.access_token);

  return useQuery<SubscriptionInsights>({
    queryKey: ['subscriptionInsights'],
    queryFn: async () => {
      if (!token)
        return {
          totalActive: 0,
          totalMonthlyCommitment: 0,
          totalAnnualCommitment: 0,
          upcomingRenewals: [],
        };
      const res = await fetch(`${API_URL}/api/v1/recurring/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateRecurring() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (data: Partial<RecurringExpense> & { _idempotencyKey?: string }) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      if (!data._idempotencyKey) {
        data._idempotencyKey = crypto.randomUUID();
      }

      const { _idempotencyKey, ...payload } = data;

      const res = await fetch(`${API_URL}/api/v1/recurring`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          'Idempotency-Key': _idempotencyKey,
        },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionInsights'] });
    },
  });
}

export function useUpdateRecurring() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.session?.access_token);

  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<RecurringExpense> & { id: string }) => {
      const res = await fetch(`${API_URL}/api/v1/recurring/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionInsights'] });
    },
  });
}
