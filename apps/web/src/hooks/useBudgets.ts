import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';
import {
  BudgetSummary,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  BudgetFilters,
  BudgetListResponse,
} from '@expensio/types';
import { db } from '../utils/indexeddb';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, accessToken: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.message || 'Request failed');
  }

  const json = await response.json();
  return json.data;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches all budget summaries for the current user.
 */
export function useBudgets(filters: BudgetFilters = {}) {
  const session = useAuthStore((state) => state.session);

  return useQuery<BudgetSummary[]>({
    queryKey: ['budgets', session?.user?.id, filters],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');

      const params = new URLSearchParams();
      if (filters.period) params.append('period', filters.period);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);

      const data = await apiFetch<BudgetListResponse>(
        `/api/v1/budgets?${params.toString()}`,
        session.access_token
      );

      return data.budgets ?? [];
    },
    enabled: !!session?.access_token,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetches a single budget summary by ID.
 */
export function useBudget(id: string) {
  const session = useAuthStore((state) => state.session);

  return useQuery<BudgetSummary>({
    queryKey: ['budget', session?.user?.id, id],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');
      return apiFetch<BudgetSummary>(`/api/v1/budgets/${id}`, session.access_token);
    },
    enabled: !!session?.access_token && !!id,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Creates a new budget.
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation<BudgetSummary, Error, CreateBudgetRequest>({
    mutationFn: async (payload) => {
      if (!session?.access_token) throw new Error('Not authenticated');
      try {
        return await apiFetch<BudgetSummary>('/api/v1/budgets', session.access_token, {
          method: 'POST',
          headers: {
            'Idempotency-Key': crypto.randomUUID(),
          },
          body: JSON.stringify(payload),
        });
      } catch (err: any) {
        if (!navigator.onLine || err.message === 'Request failed') {
          const fakeId = crypto.randomUUID();
          await db.mutations.add({
            id: fakeId,
            type: 'CREATE_BUDGET',
            payload,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
          });
          return {
            id: fakeId,
            categoryId: payload.categoryId,
            budgetAmount: payload.amount,
            spentAmount: 0,
            remainingAmount: payload.amount,
            utilizationPercentage: 0,
            period: payload.period,
            startDate: payload.startDate,
            endDate: payload.endDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as unknown as BudgetSummary;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

/**
 * Updates an existing budget.
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation<BudgetSummary, Error, { id: string; data: UpdateBudgetRequest }>({
    mutationFn: async ({ id, data }) => {
      if (!session?.access_token) throw new Error('Not authenticated');
      return apiFetch<BudgetSummary>(`/api/v1/budgets/${id}`, session.access_token, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

/**
 * Deletes a budget by ID.
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      if (!session?.access_token) throw new Error('Not authenticated');
      const response = await fetch(`${API_URL}/api/v1/budgets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || 'Failed to delete budget');
      }
    },
    onSuccess: (_result, id) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
