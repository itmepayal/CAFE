import type { Server } from "socket.io";
import logger from "../../config/logger.config";
import { tryGetIO } from "../socket.registry";
import { SOCKET_ROOMS } from "../constants";
import type { AdminSocketEvent } from "./admin.events";
import { createSocketEnvelope } from "./admin.envelope";
import type { SocketEnvelope } from "./admin.types";

export const emitToAdmins = <T>(
  event: AdminSocketEvent,
  data: T,
  reason?: string,
): boolean => {
  const io = tryGetIO();

  if (!io) {
    logger.warn("Admin socket emit skipped — Socket.IO not initialized", {
      event,
      reason,
    });
    return false;
  }

  const envelope = createSocketEnvelope(event, data, reason);

  return emitEnvelopeToRoom(io, SOCKET_ROOMS.ADMINS, event, envelope);
};

export const emitToSocket = <T>(
  socketId: string,
  event: AdminSocketEvent,
  data: T,
  reason?: string,
): boolean => {
  const io = tryGetIO();

  if (!io) {
    logger.warn("Socket emit skipped — Socket.IO not initialized", {
      event,
      socketId,
      reason,
    });
    return false;
  }

  const envelope = createSocketEnvelope(event, data, reason);

  io.to(socketId).emit(event, envelope);

  logger.debug("Socket event delivered to client", {
    event,
    socketId,
    eventId: envelope.meta.eventId,
    reason,
  });

  return true;
};

const emitEnvelopeToRoom = <T>(
  io: Server,
  room: string,
  event: AdminSocketEvent,
  envelope: SocketEnvelope<T>,
): boolean => {
  io.to(room).emit(event, envelope);

  logger.info("Admin socket event emitted", {
    event,
    room,
    eventId: envelope.meta.eventId,
    reason: envelope.meta.reason,
  });

  return true;
};
