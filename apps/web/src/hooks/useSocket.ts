'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket(roomId?: string) {
  const [socket] = useState<Socket>(() =>
    io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    })
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      console.debug('Socket connected successfully:', socket.id);

      if (roomId) {
        socket.emit('join-room', roomId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.debug('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Clean up on component unmount
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
    };
  }, [socket, roomId]);

  return {
    socket,
    isConnected,
  };
}
