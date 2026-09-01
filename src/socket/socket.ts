import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import logger from "../config/logger.config";
import { serverConfig } from "../config";
import {
  authenticateSocket,
  registerSocketRoomHandlers,
} from "./socket.auth";

let io: Server;

export const initializeSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: serverConfig.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(authenticateSocket);

  io.on("connection", (socket: Socket) => {
    logger.info("Socket connected", {
      socketId: socket.id,
      userId: socket.data.user?.id,
      role: socket.data.user?.role,
    });

    registerSocketRoomHandlers(socket);

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
