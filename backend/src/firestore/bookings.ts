import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import type { BookingMode, BookingStatus, BookingType } from "../domain/enums";
import { getDb } from "../lib/firebaseAdmin";

const COL = "bookings";

export type BookingRow = {
  id: string;
  travelerId: string;
  providerId: string;
  vehicleId: string;
  tripPostId: string | null;
  mode: BookingMode;
  bookingType: BookingType;
  status: BookingStatus;
  startAt: Date;
  endAt: Date;
  pickupNotes: string | null;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
};

function tsToDate(v: unknown): Date {
  if (v instanceof Timestamp) {
    return v.toDate();
  }
  if (typeof v === "string") {
    return new Date(v);
  }
  return new Date();
}

function toBooking(id: string, data: DocumentData): BookingRow {
  return {
    id,
    travelerId: data.travelerId,
    providerId: data.providerId,
    vehicleId: data.vehicleId,
    tripPostId: data.tripPostId ?? null,
    mode: data.mode,
    bookingType: data.bookingType,
    status: data.status,
    startAt: tsToDate(data.startAt),
    endAt: tsToDate(data.endAt),
    pickupNotes: data.pickupNotes ?? null,
    totalPrice: Number(data.totalPrice),
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  };
}

export async function createBooking(input: {
  travelerId: string;
  providerId: string;
  vehicleId: string;
  tripPostId?: string;
  mode: BookingMode;
  bookingType: BookingType;
  status: BookingStatus;
  startAt: Date;
  endAt: Date;
  pickupNotes?: string;
  totalPrice: number;
}): Promise<BookingRow> {
  const id = randomUUID();
  const now = FieldValue.serverTimestamp();
  await getDb()
    .collection(COL)
    .doc(id)
    .set({
      travelerId: input.travelerId,
      providerId: input.providerId,
      vehicleId: input.vehicleId,
      tripPostId: input.tripPostId ?? null,
      mode: input.mode,
      bookingType: input.bookingType,
      status: input.status,
      startAt: Timestamp.fromDate(input.startAt),
      endAt: Timestamp.fromDate(input.endAt),
      pickupNotes: input.pickupNotes ?? null,
      totalPrice: input.totalPrice,
      createdAt: now,
      updatedAt: now,
    });
  const b = await getBookingById(id);
  if (!b) {
    throw new Error("Booking create failed");
  }
  return b;
}

export async function getBookingById(id: string): Promise<BookingRow | null> {
  const d = await getDb().collection(COL).doc(id).get();
  if (!d.exists) {
    return null;
  }
  return toBooking(d.id, d.data()!);
}

export async function listBookingsForUser(userId: string): Promise<BookingRow[]> {
  const db = getDb();
  const [a, b] = await Promise.all([
    db.collection(COL).where("travelerId", "==", userId).limit(80).get(),
    db.collection(COL).where("providerId", "==", userId).limit(80).get(),
  ]);
  const map = new Map<string, BookingRow>();
  for (const d of a.docs) {
    map.set(d.id, toBooking(d.id, d.data()));
  }
  for (const d of b.docs) {
    map.set(d.id, toBooking(d.id, d.data()));
  }
  return [...map.values()].sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime()).slice(0, 50);
}

export async function listBookingsAdmin(take: number): Promise<BookingRow[]> {
  const snap = await getDb().collection(COL).orderBy("createdAt", "desc").limit(take).get();
  return snap.docs.map((d) => toBooking(d.id, d.data()));
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<BookingRow> {
  await getDb()
    .collection(COL)
    .doc(id)
    .update({ status, updatedAt: FieldValue.serverTimestamp() });
  const b = await getBookingById(id);
  if (!b) {
    throw new Error("NOT_FOUND");
  }
  return b;
}

export async function countBookings(): Promise<number> {
  const snap = await getDb().collection(COL).count().get();
  return snap.data().count;
}
