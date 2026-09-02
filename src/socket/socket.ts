import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import logger from "../config/logger.config";
import { serverConfig } from "../config";
import { SOCKET_CONFIG } from "./constants";
import {
  authenticateSocket,
  registerSocketRoomHandlers,
  autoJoinAdminRoom,
  autoJoinOwnerCafeRoom,
} from "./socket.auth";
import { deliverAdminInitialSnapshot } from "./admin/admin.notifier";
import { deliverOwnerInitialSnapshot } from "./owner/owner.notifier";
import { setSocketServer } from "./socket.registry";

export { getIO, tryGetIO, isSocketInitialized } from "./socket.registry";

export const initializeSocket = (server: HttpServer): Server => {
  const socketServer = new Server(server, {
    cors: {
      origin: serverConfig.CLIENT_URL,
      credentials: true,
    },
    pingTimeout: SOCKET_CONFIG.PING_TIMEOUT_MS,
    pingInterval: SOCKET_CONFIG.PING_INTERVAL_MS,
    connectionStateRecovery: {
      maxDisconnectionDuration: SOCKET_CONFIG.MAX_DISCONNECTION_DURATION_MS,
      skipMiddlewares: true,
    },
  });

  setSocketServer(socketServer);

  socketServer.use(authenticateSocket);

  socketServer.on("connection", (socket: Socket) => {
    const user = socket.data.user as { id: string; role: string } | undefined;

    logger.info("Socket connected", {
      socketId: socket.id,
      userId: user?.id,
      role: user?.role,
    });

    registerSocketRoomHandlers(socket);
    autoJoinAdminRoom(socket);

    if (user?.role === "super_admin") {
      void deliverAdminInitialSnapshot(socket, user.id);
    }

    if (user?.role === "cafe_owner") {
      void autoJoinOwnerCafeRoom(socket).then((joined) => {
        if (joined && user) {
          void deliverOwnerInitialSnapshot(socket, user.id);
        }
      });
    }

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

  return socketServer;
};
