import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import { getDb } from "../lib/firebaseAdmin";

const COL = "reviews";

export type ReviewRow = {
  id: string;
  bookingId: string;
  reviewerId: string;
  vehicleId: string;
  vehicleScore: number;
  driverScore: number;
  tags: string[];
  body: string | null;
  photoUrls: string[];
  createdAt: Date;
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

function toReview(id: string, data: DocumentData): ReviewRow {
  return {
    id,
    bookingId: data.bookingId,
    reviewerId: data.reviewerId,
    vehicleId: data.vehicleId,
    vehicleScore: data.vehicleScore,
    driverScore: data.driverScore,
    tags: (data.tags as string[]) ?? [],
    body: data.body ?? null,
    photoUrls: (data.photoUrls as string[]) ?? [],
    createdAt: tsToDate(data.createdAt),
  };
}

export async function listReviewsByVehicle(vehicleId: string): Promise<ReviewRow[]> {
  const snap = await getDb().collection(COL).where("vehicleId", "==", vehicleId).limit(200).get();
  const rows = snap.docs.map((d) => toReview(d.id, d.data()));
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows.slice(0, 100);
}

export async function aggregateReviewsForVehicle(vehicleId: string): Promise<{
  count: number;
  avgVehicle: number | null;
  avgDriver: number | null;
}> {
  const rows = await listReviewsByVehicle(vehicleId);
  if (rows.length === 0) {
    return { count: 0, avgVehicle: null, avgDriver: null };
  }
  const sumV = rows.reduce((s, r) => s + r.vehicleScore, 0);
  const sumD = rows.reduce((s, r) => s + r.driverScore, 0);
  return {
    count: rows.length,
    avgVehicle: sumV / rows.length,
    avgDriver: sumD / rows.length,
  };
}

export async function createReview(input: {
  bookingId: string;
  reviewerId: string;
  vehicleId: string;
  vehicleScore: number;
  driverScore: number;
  tags: string[];
  photoUrls: string[];
  body?: string;
}): Promise<{ id: string }> {
  const id = `${input.bookingId}_${input.reviewerId}`;
  const ref = getDb().collection(COL).doc(id);
  const existing = await ref.get();
  if (existing.exists) {
    const err = new Error("DUPLICATE_REVIEW");
    (err as { code?: string }).code = "DUPLICATE_REVIEW";
    throw err;
  }
  await ref.set({
    bookingId: input.bookingId,
    reviewerId: input.reviewerId,
    vehicleId: input.vehicleId,
    vehicleScore: input.vehicleScore,
    driverScore: input.driverScore,
    tags: input.tags,
    photoUrls: input.photoUrls,
    body: input.body ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { id };
}
