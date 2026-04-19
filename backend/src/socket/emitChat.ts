import type { MessageRow } from "../firestore/messages";
import { getSocketIO } from "./ioSingleton";

export function emitChatMessage(message: MessageRow) {
  const io = getSocketIO();
  if (!io) {
    return;
  }

  const payload = {
    id: message.id,
    bookingId: message.bookingId,
    tripPostId: message.tripPostId,
    senderId: message.senderId,
    receiverId: message.receiverId,
    body: message.body,
    createdAt: message.createdAt,
  };

  if (message.bookingId) {
    io.to(`booking:${message.bookingId}`).emit("chat:message", payload);
  }
  if (message.tripPostId) {
    io.to(`trip:${message.tripPostId}`).emit("chat:message", payload);
  }
}
