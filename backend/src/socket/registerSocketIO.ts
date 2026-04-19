import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { getBookingById } from "../firestore/bookings";
import { findOfferByTripAndProvider } from "../firestore/offers";
import { getTripPostById } from "../firestore/tripPosts";
import { verifyToken } from "../utils/jwt";
import { getCorsOrigins } from "../config/env";
import { setSocketIO } from "./ioSingleton";

type JoinPayload = { bookingId?: string; tripPostId?: string };

export function registerSocketIO(httpServer: HttpServer) {
  const origins = getCorsOrigins();
  const io = new Server(httpServer, {
    cors: {
      origin: origins.length <= 1 ? origins[0] ?? true : origins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const raw = socket.handshake.auth;
      const token = typeof raw === "object" && raw !== null && "token" in raw ? String((raw as { token?: unknown }).token ?? "") : "";
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const payload = verifyToken(token);
      (socket.data as { userId: string; role: string }).userId = payload.sub;
      (socket.data as { userId: string; role: string }).role = payload.role;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket.data as { userId: string }).userId;

    socket.on("join", async (payload: JoinPayload, ack?: (err?: Error) => void) => {
      try {
        if (payload.bookingId) {
          const booking = await getBookingById(payload.bookingId);
          if (!booking || ![booking.travelerId, booking.providerId].includes(userId)) {
            throw new Error("Forbidden");
          }
          await socket.join(`booking:${payload.bookingId}`);
        } else if (payload.tripPostId) {
          const trip = await getTripPostById(payload.tripPostId);
          if (!trip) {
            throw new Error("Not found");
          }
          if (trip.travelerId === userId) {
            await socket.join(`trip:${payload.tripPostId}`);
          } else {
            const offer = await findOfferByTripAndProvider(payload.tripPostId, userId);
            if (!offer) {
              throw new Error("Forbidden");
            }
            await socket.join(`trip:${payload.tripPostId}`);
          }
        } else {
          throw new Error("bookingId or tripPostId required");
        }
        ack?.();
      } catch (e) {
        ack?.(e instanceof Error ? e : new Error("Join failed"));
      }
    });
  });

  setSocketIO(io);
  return io;
}
