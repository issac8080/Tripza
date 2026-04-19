import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import type { TripPostStatus, VehicleType } from "../domain/enums";
import { TripPostStatus as TripPostStatusConst } from "../domain/enums";
import { getDb } from "../lib/firebaseAdmin";

const COL = "tripPosts";

export type TripPostRow = {
  id: string;
  travelerId: string;
  title: string;
  description: string | null;
  destinationLabel: string;
  pickupAddress: string;
  startDate: Date;
  endDate: Date;
  numPeople: number;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredTypes: VehicleType[];
  status: TripPostStatus;
  /** Denormalized count of offers (maintained when offers are created). */
  offersCount: number;
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

function toTripPost(id: string, data: DocumentData): TripPostRow {
  const preferred = (data.preferredTypes as string[] | undefined) ?? [];
  return {
    id,
    travelerId: data.travelerId,
    title: data.title,
    description: data.description ?? null,
    destinationLabel: data.destinationLabel,
    pickupAddress: data.pickupAddress,
    startDate: tsToDate(data.startDate),
    endDate: tsToDate(data.endDate),
    numPeople: data.numPeople,
    budgetMin: data.budgetMin != null ? Number(data.budgetMin) : null,
    budgetMax: data.budgetMax != null ? Number(data.budgetMax) : null,
    preferredTypes: preferred as VehicleType[],
    status: data.status,
    offersCount: typeof data.offersCount === "number" ? data.offersCount : 0,
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  };
}

/** Open demand plus posts marked “contacted” so providers can still follow up on the board. */
export async function listPublicTripBoardPosts(): Promise<TripPostRow[]> {
  const snap = await getDb()
    .collection(COL)
    .where("status", "in", [TripPostStatusConst.OPEN, TripPostStatusConst.CONTACTED])
    .limit(200)
    .get();
  const rows = snap.docs.map((d) => toTripPost(d.id, d.data()));
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows.slice(0, 50);
}

export async function createTripPost(input: {
  travelerId: string;
  title: string;
  description?: string;
  destinationLabel: string;
  pickupAddress: string;
  startDate: Date;
  endDate: Date;
  numPeople: number;
  budgetMin?: number;
  budgetMax?: number;
  preferredTypes: VehicleType[];
}): Promise<{ id: string }> {
  const id = randomUUID();
  const now = FieldValue.serverTimestamp();
  await getDb()
    .collection(COL)
    .doc(id)
    .set({
      travelerId: input.travelerId,
      title: input.title,
      description: input.description ?? null,
      destinationLabel: input.destinationLabel,
      pickupAddress: input.pickupAddress,
      startDate: Timestamp.fromDate(input.startDate),
      endDate: Timestamp.fromDate(input.endDate),
      numPeople: input.numPeople,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      preferredTypes: input.preferredTypes,
      status: TripPostStatusConst.OPEN,
      offersCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  return { id };
}

export async function getTripPostById(id: string): Promise<TripPostRow | null> {
  const d = await getDb().collection(COL).doc(id).get();
  if (!d.exists) {
    return null;
  }
  return toTripPost(d.id, d.data()!);
}

export async function listTripPostsByTraveler(travelerId: string): Promise<TripPostRow[]> {
  const snap = await getDb().collection(COL).where("travelerId", "==", travelerId).limit(100).get();
  const rows = snap.docs.map((d) => toTripPost(d.id, d.data()));
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return rows;
}

export async function countTripPosts(): Promise<number> {
  const snap = await getDb().collection(COL).count().get();
  return snap.data().count;
}

export async function updateTripPostStatusForTraveler(
  tripId: string,
  travelerId: string,
  status: TripPostStatus,
): Promise<TripPostRow> {
  const ref = getDb().collection(COL).doc(tripId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("NOT_FOUND");
  }
  const row = toTripPost(snap.id, snap.data()!);
  if (row.travelerId !== travelerId) {
    throw new Error("FORBIDDEN");
  }
  await ref.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });
  const next = await getTripPostById(tripId);
  if (!next) {
    throw new Error("NOT_FOUND");
  }
  return next;
}

export async function updateTripPostStatusAsAdmin(tripId: string, status: TripPostStatus): Promise<TripPostRow> {
  const ref = getDb().collection(COL).doc(tripId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("NOT_FOUND");
  }
  await ref.update({
    status,
    updatedAt: FieldValue.serverTimestamp(),
  });
  const next = await getTripPostById(tripId);
  if (!next) {
    throw new Error("NOT_FOUND");
  }
  return next;
}
