import type { Socket } from "socket.io";
import logger from "../../config/logger.config";
import { SOCKET_PROTOCOL_VERSION, SOCKET_ROOMS } from "../constants";
import { tryGetIO } from "../socket.registry";
import { randomUUID } from "crypto";
import type { OwnerSocketEvent } from "./owner.events";
import type { SocketEnvelope } from "./owner.types";

const createOwnerEnvelope = <T>(
  event: OwnerSocketEvent,
  data: T,
  reason?: string,
): SocketEnvelope<T> => ({
  meta: {
    eventId: randomUUID(),
    event,
    timestamp: new Date().toISOString(),
    version: SOCKET_PROTOCOL_VERSION,
    ...(reason ? { reason } : {}),
  },
  data,
});

export const emitToCafeRoom = <T>(
  event: OwnerSocketEvent,
  cafeId: string,
  data: T,
  reason?: string,
): boolean => {
  const io = tryGetIO();

  if (!io) {
    logger.warn("Owner socket emit skipped — Socket.IO not initialized", {
      event,
      cafeId,
      reason,
    });
    return false;
  }

  const envelope = createOwnerEnvelope(event, data, reason);
  io.to(SOCKET_ROOMS.cafe(cafeId)).emit(event, envelope);

  logger.info("Owner socket event emitted", {
    event,
    cafeId,
    eventId: envelope.meta.eventId,
    reason,
  });

  return true;
};

export const emitToSocket = <T>(
  socketId: string,
  event: OwnerSocketEvent,
  data: T,
  reason?: string,
): boolean => {
  const io = tryGetIO();

  if (!io) {
    return false;
  }

  const envelope = createOwnerEnvelope(event, data, reason);
  io.to(socketId).emit(event, envelope);
  return true;
};

export const emitEnvelopeOnSocket = <T>(
  socket: Socket,
  event: OwnerSocketEvent,
  data: T,
  reason?: string,
): void => {
  const envelope = createOwnerEnvelope(event, data, reason);
  socket.emit(event, envelope);
};
