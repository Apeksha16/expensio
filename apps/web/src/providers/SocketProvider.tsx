'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth-store';

const fallbackSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL?.includes('localhost')
  ? null
  : process.env.NEXT_PUBLIC_SOCKET_URL;
const SOCKET_URL = fallbackSocketUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Only connect if we have a valid session and user ID
    if (!session || !user?.id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Prevent creating multiple connections if one is already active for this user
    if (socket?.connected) {
      return;
    }

    console.debug('[SocketProvider] Initializing socket connection...');
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: session.access_token,
      },
    });

    setSocket(newSocket);

    const onConnect = () => {
      setIsConnected(true);
      console.debug('[SocketProvider] Socket connected successfully:', newSocket.id);
      // Join the user's room based on the backend contract: socket.join(userId)
      newSocket.emit('join-room', user.id);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.debug('[SocketProvider] Socket disconnected');
    };

    const onConnectError = (error: Error) => {
      console.error('[SocketProvider] Socket connection error:', error);
    };

    // Event Handlers for React Query Invalidation Bridge
    const onBudgetThresholdCrossed = (payload: any) => {
      console.debug('[SocketProvider] Received budget.threshold.crossed', payload);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      // Dashboard summary also contains budget info
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    };

    const onBudgetExceeded = (payload: any) => {
      console.debug('[SocketProvider] Received budget.exceeded', payload);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    };

    const onNotificationNew = (payload: any) => {
      console.debug('[SocketProvider] Received notification.new', payload);
      // Optimistic update for notifications
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          notifications: [payload, ...oldData.notifications],
        };
      });
      // Increment unread count
      queryClient.setQueryData(['notification-unread-count'], (oldCount: any) => {
        if (!oldCount) return oldCount;
        return { count: oldCount.count + 1 };
      });
    };

    const onExpenseMutated = (payload: any) => {
      console.debug('[SocketProvider] Received expense mutation', payload);
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    };

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);
    newSocket.on('connect_error', onConnectError);
    newSocket.on('budget.threshold.crossed', onBudgetThresholdCrossed);
    newSocket.on('budget.exceeded', onBudgetExceeded);
    newSocket.on('notification.new', onNotificationNew);
    newSocket.on('expense.created', onExpenseMutated);
    newSocket.on('expense.updated', onExpenseMutated);
    newSocket.on('expense.deleted', onExpenseMutated);

    return () => {
      console.debug('[SocketProvider] Cleaning up socket connection...');
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      newSocket.off('connect_error', onConnectError);
      newSocket.off('budget.threshold.crossed', onBudgetThresholdCrossed);
      newSocket.off('budget.exceeded', onBudgetExceeded);
      newSocket.off('notification.new', onNotificationNew);
      newSocket.off('expense.created', onExpenseMutated);
      newSocket.off('expense.updated', onExpenseMutated);
      newSocket.off('expense.deleted', onExpenseMutated);
      newSocket.disconnect();
    };
  }, [session, user?.id, queryClient]); // Re-run only if session/user changes

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>
  );
}

export const useSocketContext = () => useContext(SocketContext);
