import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';

let io: Server;

export const initializeSocketServer = (socketIo: Server) => {
  io = socketIo;

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = verifyAccessToken(token) as any;
    if (!decoded) {
      return next(new Error('Authentication error'));
    }

    // Attach user info to socket
    (socket as any).user = decoded;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.userId}`);

    // Join user room
    socket.join(`user:${user.userId}`);

    // Join organization room
    if (user.organizationId) {
      socket.join(`org:${user.organizationId}`);
    }

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.userId}`);
    });
  });
};

export const broadcastToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const broadcastToOrg = (organizationId: string, event: string, data: any) => {
  if (io) {
    io.to(`org:${organizationId}`).emit(event, data);
  }
};
