import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications(page = 1, limit = 20) {
  const session = useAuthStore((state) => state.session);

  return useQuery<{ notifications: Notification[] }>({
    queryKey: ['notifications', { page, limit }],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');
      const searchParams = new URLSearchParams({ page: String(page), limit: String(limit) });
      const response = await fetch(`${API_URL}/api/v1/notifications?${searchParams.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      return data;
    },
    enabled: !!session?.access_token,
  });
}

export function useUnreadNotificationCount() {
  const session = useAuthStore((state) => state.session);

  return useQuery({
    queryKey: ['notification-unread-count'],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');
      const response = await fetch(`${API_URL}/api/v1/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      return data;
    },
    enabled: !!session?.access_token,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!session?.access_token) throw new Error('Not authenticated');
      const response = await fetch(`${API_URL}/api/v1/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      const data = await response.json();
      return data;
    },
    onSuccess: (data, id) => {
      // Optimistically update lists where this notification appears
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map((n: Notification) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        };
      });

      // Update unread count if it was successfully marked as read
      queryClient.setQueryData(['notification-unread-count'], (oldCount: any) => {
        if (!oldCount) return oldCount;
        return { count: Math.max(0, oldCount.count - 1) };
      });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);

  return useMutation({
    mutationFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated');
      const response = await fetch(`${API_URL}/api/v1/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: oldData.notifications.map((n: Notification) => ({ ...n, isRead: true })),
        };
      });

      queryClient.setQueryData(['notification-unread-count'], { count: 0 });
    },
  });
}
