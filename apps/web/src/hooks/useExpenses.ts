import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';
import { CreateExpenseRequest, UpdateExpenseRequest, ExpenseFilters } from '@expensio/types';
import { Expense as StoreExpense } from '../store/mockData';
import { db } from '../utils/indexeddb';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Maps a backend API expense response to the shape expected by the frontend store components.
 */
export function mapAPIExpenseToStoreExpense(apiExp: any): StoreExpense {
  if (!apiExp) return apiExp;

  const splits = apiExp.splits || [];
  const splitWith = splits.map((s: any) => s.userId);

  // Determine split type and percentages from splits if available
  let splitType: 'equal' | 'percentage' | undefined;
  let splitPercentages: Record<string, number> | undefined;

  if (splits.length > 0) {
    const hasPercentages = splits.some(
      (s: any) => s.percentage !== null && s.percentage !== undefined
    );
    splitType = hasPercentages ? 'percentage' : 'equal';

    if (hasPercentages) {
      splitPercentages = {};
      splits.forEach((s: any) => {
        if (s.userId) {
          splitPercentages![s.userId] = s.percentage || 0;
        }
      });
    }
  }

  // Format date to YYYY-MM-DD
  let dateStr = new Date().toISOString().split('T')[0];
  if (apiExp.date) {
    dateStr =
      typeof apiExp.date === 'string'
        ? apiExp.date.split('T')[0]
        : new Date(apiExp.date).toISOString().split('T')[0];
  }

  return {
    id: apiExp.id,
    title: apiExp.description || apiExp.note || 'Expense',
    amount: apiExp.amount,
    category: apiExp.category,
    date: dateStr,
    note: apiExp.note || apiExp.description || undefined,
    paidBy: 'me',
    splitWith: splitWith.length > 0 ? splitWith : undefined,
    splitType,
    splitPercentages,
    groupId: apiExp.groupId || undefined,
    paymentMethod: apiExp.paymentMethod || 'Credit Card',
  };
}

export interface ExpenseListUIResponse {
  expenses: StoreExpense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Hook to retrieve the paginated, filtered list of expenses
 */
export function useExpenses(filters: ExpenseFilters = {}) {
  const session = useAuthStore((state) => state.session);

  return useQuery<ExpenseListUIResponse>({
    queryKey: ['expenses', session?.user?.id, filters],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const searchParams = new URLSearchParams();
      if (filters.page) searchParams.append('page', String(filters.page));
      if (filters.limit) searchParams.append('limit', String(filters.limit));
      if (filters.search) searchParams.append('search', filters.search);
      if (filters.category && filters.category !== 'All') {
        searchParams.append('category', filters.category);
      }
      if (filters.startDate) searchParams.append('startDate', filters.startDate);
      if (filters.endDate) searchParams.append('endDate', filters.endDate);
      if (filters.accountId) searchParams.append('accountId', filters.accountId);
      if (filters.groupId) searchParams.append('groupId', filters.groupId);
      if (filters.minAmount) searchParams.append('minAmount', String(filters.minAmount));
      if (filters.maxAmount) searchParams.append('maxAmount', String(filters.maxAmount));
      if (filters.sort) searchParams.append('sort', filters.sort);

      const response = await fetch(`${API_URL}/api/v1/expenses?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to fetch expenses');
      }

      const resJson = await response.json();
      const rawData = resJson.data || {
        expenses: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };

      return {
        expenses: (rawData.expenses || []).map(mapAPIExpenseToStoreExpense),
        pagination: rawData.pagination,
      };
    },
    enabled: !!session?.access_token,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to retrieve details of a single expense
 */
export function useExpense(id: string) {
  const session = useAuthStore((state) => state.session);

  return useQuery<StoreExpense>({
    queryKey: ['expense', session?.user?.id, id],
    queryFn: async () => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/v1/expenses/${id}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Failed to fetch expense details');
      }

      const data = await response.json();
      return mapAPIExpenseToStoreExpense(data.data);
    },
    enabled: !!session?.access_token && !!id,
  });
}

/**
 * Hook to create a new expense
 */
export function useCreateExpense() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation<
    StoreExpense,
    Error,
    CreateExpenseRequest,
    { previousExpenses: any; previousSummary: any }
  >({
    mutationFn: async (expenseData: CreateExpenseRequest & { _idempotencyKey?: string }) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      if (!expenseData._idempotencyKey) {
        expenseData._idempotencyKey = crypto.randomUUID();
      }

      try {
        const response = await fetch(`${API_URL}/api/v1/expenses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            'Idempotency-Key': expenseData._idempotencyKey,
          },
          body: JSON.stringify(expenseData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error?.message || errorData.message || 'Failed to create expense'
          );
        }

        const data = await response.json();
        return mapAPIExpenseToStoreExpense(data.data);
      } catch (err: any) {
        // If network error, add to offline queue
        if (!navigator.onLine || err.message === 'Failed to fetch') {
          const fakeId = crypto.randomUUID();
          await db.mutations.add({
            id: fakeId,
            type: 'CREATE_EXPENSE',
            payload: expenseData,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
          });
          // Return an optimistic fake expense so UI doesn't crash
          return {
            id: fakeId,
            amount: expenseData.amount,
            currency: 'USD',
            description: expenseData.note || null,
            categoryId: expenseData.category,
            accountId: expenseData.accountId || '',
            date: expenseData.date,
            isSplit: false,
            createdAt: new Date().toISOString(),
            title: expenseData.note || 'Offline Expense',
            category: {
              id: expenseData.category,
              name: expenseData.category,
              color: '#000000',
              icon: 'offline',
            },
            paidBy: { id: session.user.id, name: 'You', avatar: null },
            isOffline: true,
          } as unknown as StoreExpense;
        }
        throw err;
      }
    },
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard-summary'] });

      const previousExpenses = queryClient.getQueryData(['expenses']);
      const previousSummary = queryClient.getQueryData(['dashboard-summary']);

      // Optimistically add the new expense to the dashboard summary recent expenses
      queryClient.setQueryData(['dashboard-summary', session?.user?.id], (old: any) => {
        if (!old) return old;
        const optimisticExpense = {
          id: `temp-${Date.now()}`,
          amount: newExpense.amount,
          description: newExpense.note || 'New Expense',
          category: newExpense.category,
          date: newExpense.date || new Date().toISOString(),
          paymentMethod: newExpense.paymentMethod || 'Credit Card',
        };
        return {
          ...old,
          totalExpenses: old.totalExpenses + newExpense.amount,
          recentExpenses: [optimisticExpense, ...old.recentExpenses].slice(0, 5),
        };
      });

      return { previousExpenses, previousSummary };
    },
    onError: (err, newExpense, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses);
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(['dashboard-summary', session?.user?.id], context.previousSummary);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

/**
 * Hook to update an existing expense
 */
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation<
    StoreExpense,
    Error,
    { id: string; data: UpdateExpenseRequest },
    { previousExpenses: any; previousSummary: any }
  >({
    mutationFn: async ({ id, data }) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/v1/expenses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to update expense'
        );
      }

      const dataJson = await response.json();
      return mapAPIExpenseToStoreExpense(dataJson.data);
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard-summary'] });

      const previousExpenses = queryClient.getQueryData(['expenses']);
      const previousSummary = queryClient.getQueryData(['dashboard-summary']);

      queryClient.setQueryData(['dashboard-summary', session?.user?.id], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          recentExpenses: old.recentExpenses.map((exp: any) =>
            exp.id === id ? { ...exp, ...data } : exp
          ),
        };
      });

      queryClient.setQueriesData({ queryKey: ['expenses'] }, (old: any) => {
        if (!old || !old.expenses) return old;
        return {
          ...old,
          expenses: old.expenses.map((exp: any) => (exp.id === id ? { ...exp, ...data } : exp)),
        };
      });

      return { previousExpenses, previousSummary };
    },
    onError: (err, variables, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses);
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(['dashboard-summary', session?.user?.id], context.previousSummary);
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

/**
 * Hook to delete a single expense
 */
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation<void, Error, string, { previousExpenses: any; previousSummary: any }>({
    mutationFn: async (id) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/v1/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to delete expense'
        );
      }
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['expenses'] });
      await queryClient.cancelQueries({ queryKey: ['dashboard-summary'] });

      const previousExpenses = queryClient.getQueryData(['expenses']);
      const previousSummary = queryClient.getQueryData(['dashboard-summary']);

      queryClient.setQueryData(['dashboard-summary', session?.user?.id], (old: any) => {
        if (!old) return old;
        const expToDelete = old.recentExpenses.find((e: any) => e.id === id);
        const amountToDeduct = expToDelete ? expToDelete.amount : 0;
        return {
          ...old,
          totalExpenses: Math.max(0, old.totalExpenses - amountToDeduct),
          recentExpenses: old.recentExpenses.filter((e: any) => e.id !== id),
        };
      });

      queryClient.setQueriesData({ queryKey: ['expenses'] }, (old: any) => {
        if (!old || !old.expenses) return old;
        return {
          ...old,
          expenses: old.expenses.filter((e: any) => e.id !== id),
        };
      });

      return { previousExpenses, previousSummary };
    },
    onError: (err, variables, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(['expenses'], context.previousExpenses);
      }
      if (context?.previousSummary) {
        queryClient.setQueryData(['dashboard-summary', session?.user?.id], context.previousSummary);
      }
    },
    onSettled: (data, error, id) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

/**
 * Hook to bulk delete expenses
 */
export function useBulkDeleteExpenses() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation<void, Error, string[]>({
    mutationFn: async (ids) => {
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/api/v1/expenses/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to bulk delete expenses'
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
