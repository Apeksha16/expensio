'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export function useSocket(roomId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection using websocket transport primarily
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Socket connected successfully:', socket.id);

      if (roomId) {
        socket.emit('join-room', roomId);
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Clean up on component unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [roomId]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}
