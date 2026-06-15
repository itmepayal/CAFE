import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import logger from "../config/logger.config";
import { serverConfig } from "../config";

interface JoinStudentPayload {
  userId: string;
}

interface JoinCafePayload {
  cafeId: string;
}

interface JoinOrderPayload {
  orderId: string;
}

let io: Server;

export const initializeSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: serverConfig.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.info("Socket connected", {
      socketId: socket.id,
    });

    socket.on("join:student", ({ userId }: JoinStudentPayload): void => {
      socket.join(`student:${userId}`);
      logger.info("Student joined room", {
        socketId: socket.id,
        userId,
        room: `student:${userId}`,
      });
    });

    socket.on("join:cafe", ({ cafeId }: JoinCafePayload): void => {
      socket.join(`cafe:${cafeId}`);
      logger.info("Cafe joined room", {
        socketId: socket.id,
        cafeId,
        room: `cafe:${cafeId}`,
      });
    });

    socket.on("join:order", ({ orderId }: JoinOrderPayload): void => {
      socket.join(`order:${orderId}`);
      logger.info("Order room joined", {
        socketId: socket.id,
        orderId,
        room: `order:${orderId}`,
      });
    });

    socket.on("disconnect", (reason: string): void => {
      logger.info("Socket disconnected", {
        socketId: socket.id,
        reason,
      });
    });

    socket.on("error", (error: Error): void => {
      logger.error("Socket error", {
        socketId: socket.id,
        message: error.message,
        stack: error.stack,
      });
    });
  });

  logger.info("Socket.IO initialized successfully");

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    logger.error("Socket.IO access attempted before initialization");
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};
