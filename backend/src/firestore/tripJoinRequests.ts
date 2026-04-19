import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import type { OfferStatus } from "../domain/enums";
import { OfferStatus as OfferStatusConst } from "../domain/enums";
import { getDb } from "../lib/firebaseAdmin";

const COL = "tripJoinRequests";

export type TripJoinRequestRow = {
  id: string;
  tripPostId: string;
  requesterId: string;
  seatsRequested: number;
  message: string | null;
  status: OfferStatus;
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

function toRow(id: string, data: DocumentData): TripJoinRequestRow {
  return {
    id,
    tripPostId: data.tripPostId,
    requesterId: data.requesterId,
    seatsRequested: typeof data.seatsRequested === "number" ? data.seatsRequested : 1,
    message: data.message ?? null,
    status: data.status,
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  };
}

export async function findPendingJoinRequest(tripPostId: string, requesterId: string): Promise<TripJoinRequestRow | null> {
  const snap = await getDb().collection(COL).where("tripPostId", "==", tripPostId).limit(120).get();
  const match = snap.docs.map((d) => toRow(d.id, d.data())).find((r) => r.requesterId === requesterId && r.status === OfferStatusConst.PENDING);
  return match ?? null;
}

export async function createTripJoinRequest(input: {
  tripPostId: string;
  requesterId: string;
  seatsRequested: number;
  message?: string;
}): Promise<{ id: string }> {
  const id = randomUUID();
  const now = FieldValue.serverTimestamp();
  await getDb()
    .collection(COL)
    .doc(id)
    .set({
      tripPostId: input.tripPostId,
      requesterId: input.requesterId,
      seatsRequested: input.seatsRequested,
      message: input.message ?? null,
      status: OfferStatusConst.PENDING,
      createdAt: now,
      updatedAt: now,
    });
  return { id };
}

export async function listJoinRequestsByTripPost(tripPostId: string): Promise<TripJoinRequestRow[]> {
  const snap = await getDb().collection(COL).where("tripPostId", "==", tripPostId).limit(200).get();
  const rows = snap.docs.map((d) => toRow(d.id, d.data()));
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows;
}

export async function listJoinRequestsByRequester(requesterId: string): Promise<TripJoinRequestRow[]> {
  const snap = await getDb().collection(COL).where("requesterId", "==", requesterId).limit(200).get();
  const rows = snap.docs.map((d) => toRow(d.id, d.data()));
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows.slice(0, 100);
}

export async function getJoinRequestById(id: string): Promise<TripJoinRequestRow | null> {
  const d = await getDb().collection(COL).doc(id).get();
  if (!d.exists) {
    return null;
  }
  return toRow(d.id, d.data()!);
}

export async function updateJoinRequestStatus(joinRequestId: string, status: OfferStatus): Promise<TripJoinRequestRow> {
  const ref = getDb().collection(COL).doc(joinRequestId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("NOT_FOUND");
  }
  const row = toRow(snap.id, snap.data()!);
  if (row.status !== OfferStatusConst.PENDING) {
    throw new Error("INVALID_STATE");
  }
  await ref.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });
  const next = await getJoinRequestById(joinRequestId);
  if (!next) {
    throw new Error("NOT_FOUND");
  }
  return next;
}

export async function sumAcceptedSeatsForTrip(tripPostId: string): Promise<number> {
  const rows = await listJoinRequestsByTripPost(tripPostId);
  return rows.filter((r) => r.status === OfferStatusConst.ACCEPTED).reduce((s, r) => s + r.seatsRequested, 0);
}
