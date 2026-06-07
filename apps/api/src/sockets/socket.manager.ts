import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { FastifyBaseLogger } from 'fastify';
import { authService } from '../modules/auth/auth.service.js';

export class SocketManager {
  private io: SocketServer | null = null;
  public logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  initialize(server: HttpServer) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST'],
      },
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          this.logger.warn(`Authentication error: Missing token for socket ${socket.id}`);
          return next(new Error('Authentication error: Missing token'));
        }
        const user = await authService.verifyToken(token);
        socket.data.user = user;
        next();
      } catch (err) {
        this.logger.warn(`Authentication error: Invalid token for socket ${socket.id}`);
        next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.user.id;
      this.logger.info(`Client connected: ${socket.id}, User: ${userId}`);

      // Enforce room isolation: automatically join their own room
      socket.join(userId);
      this.logger.info(`Socket ${socket.id} joined secure room ${userId}`);

      // Allow explicit join-room but enforce it matches their own userId
      socket.on('join-room', (roomId: string) => {
        if (roomId !== userId) {
          this.logger.warn(`User ${userId} attempted to join unauthorized room ${roomId}`);
          return;
        }
        socket.join(roomId);
      });

      socket.on('disconnect', () => {
        this.logger.info(`Client disconnected: ${socket.id}, User: ${userId}`);
      });
    });

    this.logger.info('Socket.IO successfully attached to the server');
    return this.io;
  }

  getIO() {
    return this.io;
  }

  emitToUser(userId: string, eventName: string, payload: any) {
    if (this.io) {
      // Rooms are named after user ids
      this.io.to(userId).emit(eventName, payload);
      this.logger.debug(`[SocketManager] Emitted ${eventName} to user room ${userId}`);
    } else {
      this.logger.warn('[SocketManager] emitToUser called but Socket.IO is not initialized');
    }
  }
}

// Export a singleton or register it via Fastify. Since it's instantiated in index.ts, we need to export a global instance or pass it.
// Wait, index.ts instantiates `new SocketManager(fastify.log)`.
// We should probably export a global instance or allow setting the instance.
export const socketManagerInstance = new SocketManager(console as any);
