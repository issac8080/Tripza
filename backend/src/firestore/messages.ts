import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { getDb } from "../lib/firebaseAdmin";

const COL = "messages";

export type MessageRow = {
  id: string;
  bookingId: string | null;
  tripPostId: string | null;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: Date;
  readAt: Date | null;
};

function tsToDate(v: unknown): Date | null {
  if (v instanceof Timestamp) {
    return v.toDate();
  }
  if (typeof v === "string") {
    return new Date(v);
  }
  return null;
}

function toMessage(id: string, data: DocumentData): MessageRow {
  return {
    id,
    bookingId: data.bookingId ?? null,
    tripPostId: data.tripPostId ?? null,
    senderId: data.senderId,
    receiverId: data.receiverId,
    body: data.body,
    createdAt: tsToDate(data.createdAt) ?? new Date(),
    readAt: data.readAt ? tsToDate(data.readAt) : null,
  };
}

function threadKey(me: string, other: string, bookingId?: string, tripPostId?: string): string {
  const [a, b] = [me, other].sort();
  return `${a}__${b}__${bookingId ?? "na"}__${tripPostId ?? "na"}`;
}

export async function createMessage(input: {
  senderId: string;
  receiverId: string;
  body: string;
  bookingId?: string;
  tripPostId?: string;
}): Promise<MessageRow> {
  const id = randomUUID();
  const now = FieldValue.serverTimestamp();
  const tk = threadKey(input.senderId, input.receiverId, input.bookingId, input.tripPostId);
  await getDb()
    .collection(COL)
    .doc(id)
    .set({
      senderId: input.senderId,
      receiverId: input.receiverId,
      body: input.body,
      bookingId: input.bookingId ?? null,
      tripPostId: input.tripPostId ?? null,
      threadKey: tk,
      readAt: null,
      createdAt: now,
    });
  const m = await getMessageById(id);
  if (!m) {
    throw new Error("Message create failed");
  }
  return m;
}

export async function getMessageById(id: string): Promise<MessageRow | null> {
  const d = await getDb().collection(COL).doc(id).get();
  if (!d.exists) {
    return null;
  }
  return toMessage(d.id, d.data()!);
}

export async function listThread(params: {
  me: string;
  other: string;
  bookingId?: string;
  tripPostId?: string;
}): Promise<MessageRow[]> {
  const tk = threadKey(params.me, params.other, params.bookingId, params.tripPostId);
  const snap = await getDb().collection(COL).where("threadKey", "==", tk).limit(400).get();
  const rows = snap.docs.map((d) => toMessage(d.id, d.data()));
  rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return rows.slice(0, 200);
}
