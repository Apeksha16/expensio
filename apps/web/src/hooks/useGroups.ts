import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Group {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  members: string[]; // user IDs
}

export function useGroups() {
  const token = useAuthStore((state) => state.session?.access_token);

  return useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(`${API_URL}/api/v1/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data?.groups || [];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.session?.access_token);
  return useMutation({
    mutationFn: async (group: Omit<Group, 'id'>) => {
      const res = await fetch(`${API_URL}/api/v1/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(group),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useAddGroupMember() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.session?.access_token);
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const res = await fetch(`${API_URL}/api/v1/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      return res.json();
    },
    onSuccess: (_, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
