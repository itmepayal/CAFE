import { Socket } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { serverConfig } from "../config";
import { findCafeByUserId } from "../modules/cafes/cafe.repository";
import { findOrderByIdRepo } from "../modules/order/order.repository";
import logger from "../config/logger.config";

interface SocketUser {
  id: string;
  role: string;
  email?: string;
}

interface JwtPayload {
  sub: string;
  email?: string;
  role: string;
  provider: string;
}

export const authenticateSocket = (
  socket: Socket,
  next: (err?: Error) => void,
): void => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie ?? "");
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      cookies.accessToken;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(
      token,
      serverConfig.JWT_ACCESS_SECRET,
    ) as JwtPayload;

    socket.data.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
    } satisfies SocketUser;

    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
};

export const registerSocketRoomHandlers = (socket: Socket): void => {
  const user = socket.data.user as SocketUser;

  socket.on("join:student", ({ userId }: { userId: string }): void => {
    if (user.id !== userId && user.role !== "super_admin") {
      logger.warn("Unauthorized student room join attempt", {
        socketId: socket.id,
        requestedUserId: userId,
        authenticatedUserId: user.id,
      });
      return;
    }

    socket.join(`student:${userId}`);
    logger.info("Student joined room", { socketId: socket.id, userId });
  });

  socket.on("join:cafe", async ({ cafeId }: { cafeId: string }): Promise<void> => {
    if (user.role === "super_admin") {
      socket.join(`cafe:${cafeId}`);
      return;
    }

    if (user.role !== "cafe_owner") {
      logger.warn("Unauthorized cafe room join attempt", {
        socketId: socket.id,
        cafeId,
        role: user.role,
      });
      return;
    }

    const cafe = await findCafeByUserId(user.id);

    if (!cafe || cafe._id.toString() !== cafeId) {
      logger.warn("Cafe owner tried to join another cafe room", {
        socketId: socket.id,
        userId: user.id,
        cafeId,
      });
      return;
    }

    socket.join(`cafe:${cafeId}`);
    logger.info("Cafe joined room", { socketId: socket.id, cafeId });
  });

  socket.on(
    "join:order",
    async ({ orderId }: { orderId: string }): Promise<void> => {
      try {
        const order = await findOrderByIdRepo(orderId);

        const studentId = order.studentId._id
          ? order.studentId._id.toString()
          : order.studentId.toString();
        const orderCafeId = order.cafeId._id
          ? order.cafeId._id.toString()
          : order.cafeId.toString();

        const isStudent = user.id === studentId;
        const isSuperAdmin = user.role === "super_admin";

        let isCafeOwner = false;

        if (user.role === "cafe_owner") {
          const cafe = await findCafeByUserId(user.id);
          isCafeOwner = cafe?._id.toString() === orderCafeId;
        }

        if (!isStudent && !isCafeOwner && !isSuperAdmin) {
          logger.warn("Unauthorized order room join attempt", {
            socketId: socket.id,
            userId: user.id,
            orderId,
          });
          return;
        }

        socket.join(`order:${orderId}`);
        logger.info("Order room joined", { socketId: socket.id, orderId });
      } catch (error) {
        logger.warn("Failed to join order room", {
          socketId: socket.id,
          orderId,
          error,
        });
      }
    },
  );

  socket.on("join:admin", (): void => {
    if (user.role !== "super_admin") {
      logger.warn("Unauthorized admin room join attempt", {
        socketId: socket.id,
        userId: user.id,
      });
      return;
    }

    socket.join("admins");
    logger.info("Admin joined room", { socketId: socket.id, userId: user.id });
  });
};
