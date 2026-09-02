import type { Server } from "socket.io";
import logger from "../config/logger.config";

let io: Server | undefined;

export const setSocketServer = (server: Server): void => {
  io = server;
};

export const isSocketInitialized = (): boolean => Boolean(io);

export const tryGetIO = (): Server | null => io ?? null;

export const getIO = (): Server => {
  if (!io) {
    logger.error("Socket.IO access attempted before initialization");
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};
