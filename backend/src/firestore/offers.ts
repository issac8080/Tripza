import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import type { OfferStatus } from "../domain/enums";
import { OfferStatus as OfferStatusConst } from "../domain/enums";
import { getDb } from "../lib/firebaseAdmin";

const COL = "offers";

export type OfferRow = {
  id: string;
  tripPostId: string;
  providerId: string;
  vehicleId: string | null;
  quotedPrice: number;
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

function toOffer(id: string, data: DocumentData): OfferRow {
  return {
    id,
    tripPostId: data.tripPostId,
    providerId: data.providerId,
    vehicleId: data.vehicleId ?? null,
    quotedPrice: Number(data.quotedPrice),
    message: data.message ?? null,
    status: data.status,
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  };
}

export async function createOffer(input: {
  tripPostId: string;
  providerId: string;
  vehicleId?: string;
  quotedPrice: number;
  message?: string;
}): Promise<{ id: string }> {
  const id = randomUUID();
  const now = FieldValue.serverTimestamp();
  const db = getDb();
  const batch = db.batch();
  const offerRef = db.collection(COL).doc(id);
  batch.set(offerRef, {
    tripPostId: input.tripPostId,
    providerId: input.providerId,
    vehicleId: input.vehicleId ?? null,
    quotedPrice: input.quotedPrice,
    message: input.message ?? null,
    status: OfferStatusConst.PENDING,
    createdAt: now,
    updatedAt: now,
  });
  const tripRef = db.collection("tripPosts").doc(input.tripPostId);
  batch.update(tripRef, {
    offersCount: FieldValue.increment(1),
    updatedAt: now,
  });
  await batch.commit();
  return { id };
}

export async function listOffersByTripPost(tripPostId: string): Promise<OfferRow[]> {
  const snap = await getDb().collection(COL).where("tripPostId", "==", tripPostId).limit(200).get();
  const rows = snap.docs.map((d) => toOffer(d.id, d.data()));
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows.slice(0, 100);
}

export async function findOfferByTripAndProvider(tripPostId: string, providerId: string): Promise<OfferRow | null> {
  const snap = await getDb().collection(COL).where("tripPostId", "==", tripPostId).limit(100).get();
  const match = snap.docs.map((d) => toOffer(d.id, d.data())).find((o) => o.providerId === providerId);
  return match ?? null;
}

export async function countOffers(): Promise<number> {
  const snap = await getDb().collection(COL).count().get();
  return snap.data().count;
}
