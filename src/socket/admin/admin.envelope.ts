import { randomUUID } from "crypto";
import type { AdminSocketEvent } from "./admin.events";
import type { SocketEnvelope } from "./admin.types";
import { SOCKET_PROTOCOL_VERSION } from "../constants";

export const createSocketEnvelope = <T>(
  event: AdminSocketEvent,
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
