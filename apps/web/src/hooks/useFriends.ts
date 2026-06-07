import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface Friend {
  id: string; // The friend's user ID
  friendshipId: string; // The ID of the friendship record
  name: string;
  username: string;
  avatarUrl: string | null;
  balance: number;
  online?: boolean;
}

export function useFriends() {
  const token = useAuthStore((state) => state.session?.access_token);

  return useQuery<Friend[]>({
    queryKey: ['friends'],
    queryFn: async () => {
      if (!token) return [];
      const res = await fetch(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data?.friends || [];
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePendingRequests() {
  const token = useAuthStore((state) => state.session?.access_token);

  return useQuery({
    queryKey: ['friend-requests'],
    queryFn: async () => {
      if (!token) return { inbound: [], outbound: [] };
      const res = await fetch(`${API_URL}/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data || { inbound: [], outbound: [] };
    },
    enabled: !!token,
  });
}

export function useCreateFriend() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.session?.access_token);
  return useMutation({
    mutationFn: async (username: string) => {
      const res = await fetch(`${API_URL}/friends/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useRespondRequest() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.session?.access_token);
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
      const res = await fetch(`${API_URL}/friends/requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useSettleWithFriend() {
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.session?.access_token);
  return useMutation({
    mutationFn: async ({ receiverId, amount }: { receiverId: string; amount: number }) => {
      const res = await fetch(`${API_URL}/settlements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId, amount }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
    },
  });
}
