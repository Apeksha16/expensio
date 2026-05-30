import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { FastifyBaseLogger } from 'fastify';

export class SocketManager {
  private io: SocketServer | null = null;
  private logger: FastifyBaseLogger;

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

    this.io.on('connection', (socket: Socket) => {
      this.logger.info(`Client connected: ₹{socket.id}`);
      
      socket.on('join-room', (roomId: string) => {
        socket.join(roomId);
        this.logger.info(`Socket ₹{socket.id} joined room ₹{roomId}`);
      });

      socket.on('disconnect', () => {
        this.logger.info(`Client disconnected: ₹{socket.id}`);
      });
    });

    this.logger.info('Socket.IO successfully attached to the server');
    return this.io;
  }

  getIO() {
    return this.io;
  }
}
