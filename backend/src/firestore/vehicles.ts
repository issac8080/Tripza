import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import type { LuxuryLevel, VehicleStatus, VehicleType } from "../domain/enums";
import { VehicleStatus as VehicleStatusConst } from "../domain/enums";
import { getDb } from "../lib/firebaseAdmin";

const COL = "vehicles";

export type VehicleImageRow = { id: string; url: string; sortOrder: number };

export type VehicleRow = {
  id: string;
  providerId: string;
  type: VehicleType;
  brand: string;
  model: string;
  seatingCapacity: number;
  fuelType: string | null;
  transmission: string | null;
  ac: boolean;
  musicSystem: boolean;
  luxuryLevel: LuxuryLevel;
  driverIncluded: boolean;
  selfDriveAllowed: boolean;
  baseAddress: string;
  /** Extra towns / areas (comma-separated) for place search, e.g. "Thrissur, Kochi". */
  serviceAreas: string | null;
  baseLat: number | null;
  baseLng: number | null;
  pricePerKm: number;
  pricePerDay: number;
  minimumCharge: number;
  /** WhatsApp / call number for this listing (falls back to account phone in API if omitted). */
  contactPhone: string | null;
  status: VehicleStatus;
  images: VehicleImageRow[];
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

function toVehicle(id: string, data: DocumentData): VehicleRow {
  const imagesRaw = (data.images as VehicleImageRow[] | undefined) ?? [];
  return {
    id,
    providerId: data.providerId,
    type: data.type,
    brand: data.brand,
    model: data.model,
    seatingCapacity: data.seatingCapacity,
    fuelType: data.fuelType ?? null,
    transmission: data.transmission ?? null,
    ac: Boolean(data.ac),
    musicSystem: Boolean(data.musicSystem),
    luxuryLevel: data.luxuryLevel ?? "BASIC",
    driverIncluded: data.driverIncluded !== false,
    selfDriveAllowed: Boolean(data.selfDriveAllowed),
    baseAddress: data.baseAddress,
    serviceAreas: data.serviceAreas != null ? String(data.serviceAreas) : null,
    baseLat: data.baseLat ?? null,
    baseLng: data.baseLng ?? null,
    pricePerKm: Number(data.pricePerKm),
    pricePerDay: Number(data.pricePerDay),
    minimumCharge: Number(data.minimumCharge),
    contactPhone: data.contactPhone != null && String(data.contactPhone).trim() ? String(data.contactPhone).trim() : null,
    status: data.status,
    images: imagesRaw.map((img) => ({
      id: img.id,
      url: img.url,
      sortOrder: img.sortOrder ?? 0,
    })),
    createdAt: tsToDate(data.createdAt),
    updatedAt: tsToDate(data.updatedAt),
  };
}

function matchesPlace(row: VehicleRow, place: string): boolean {
  const q = place.trim().toLowerCase();
  if (!q) {
    return true;
  }
  const hay = `${row.baseAddress} ${row.serviceAreas ?? ""}`.toLowerCase();
  return hay.includes(q);
}

export async function listActiveVehicles(filters: {
  type?: VehicleType;
  ac?: boolean;
  minSeats?: number;
  place?: string;
}): Promise<VehicleRow[]> {
  // Equality + limit only (no orderBy) — avoids Firestore composite indexes; sort in memory.
  const snap = await getDb()
    .collection(COL)
    .where("status", "==", VehicleStatusConst.ACTIVE)
    .limit(400)
    .get();
  let rows = snap.docs.map((d) => toVehicle(d.id, d.data()));
  rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  if (filters.type) {
    rows = rows.filter((v) => v.type === filters.type);
  }
  if (filters.ac !== undefined) {
    rows = rows.filter((v) => v.ac === filters.ac);
  }
  const minSeats = filters.minSeats;
  if (minSeats !== undefined) {
    rows = rows.filter((v) => v.seatingCapacity >= minSeats);
  }
  if (filters.place?.trim()) {
    rows = rows.filter((v) => matchesPlace(v, filters.place!));
  }
  return rows.slice(0, 50);
}

export async function listVehiclesByProvider(providerId: string): Promise<VehicleRow[]> {
  const snap = await getDb().collection(COL).where("providerId", "==", providerId).limit(150).get();
  const rows = snap.docs.map((d) => toVehicle(d.id, d.data()));
  rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  return rows.slice(0, 100);
}

export async function getVehicleById(id: string): Promise<VehicleRow | null> {
  const d = await getDb().collection(COL).doc(id).get();
  if (!d.exists) {
    return null;
  }
  return toVehicle(d.id, d.data()!);
}

export async function getActiveVehicleById(id: string): Promise<VehicleRow | null> {
  const v = await getVehicleById(id);
  if (!v || v.status !== VehicleStatusConst.ACTIVE) {
    return null;
  }
  return v;
}

export async function createVehicle(input: {
  providerId: string;
  type: VehicleType;
  brand: string;
  model: string;
  seatingCapacity: number;
  fuelType?: string;
  transmission?: string;
  ac: boolean;
  musicSystem: boolean;
  luxuryLevel: LuxuryLevel;
  driverIncluded: boolean;
  selfDriveAllowed: boolean;
  baseAddress: string;
  serviceAreas?: string | null;
  baseLat?: number;
  baseLng?: number;
  pricePerKm: number;
  pricePerDay: number;
  minimumCharge: number;
  contactPhone?: string | null;
  status: VehicleStatus;
  imageUrls?: string[];
}): Promise<VehicleRow> {
  const id = randomUUID();
  const now = FieldValue.serverTimestamp();
  const images: VehicleImageRow[] = (input.imageUrls ?? []).map((url, idx) => ({
    id: randomUUID(),
    url,
    sortOrder: idx,
  }));
  const ref = getDb().collection(COL).doc(id);
  await ref.set({
    providerId: input.providerId,
    type: input.type,
    brand: input.brand,
    model: input.model,
    seatingCapacity: input.seatingCapacity,
    fuelType: input.fuelType ?? null,
    transmission: input.transmission ?? null,
    ac: input.ac,
    musicSystem: input.musicSystem,
    luxuryLevel: input.luxuryLevel,
    driverIncluded: input.driverIncluded,
    selfDriveAllowed: input.selfDriveAllowed,
    baseAddress: input.baseAddress,
    serviceAreas: input.serviceAreas?.trim() ? input.serviceAreas.trim() : null,
    baseLat: input.baseLat ?? null,
    baseLng: input.baseLng ?? null,
    pricePerKm: input.pricePerKm,
    pricePerDay: input.pricePerDay,
    minimumCharge: input.minimumCharge,
    contactPhone: input.contactPhone?.trim() ? input.contactPhone.trim() : null,
    status: input.status,
    images,
    createdAt: now,
    updatedAt: now,
  });
  const created = await getVehicleById(id);
  if (!created) {
    throw new Error("Vehicle create failed");
  }
  return created;
}

export async function updateVehicleStatus(id: string, status: VehicleStatus): Promise<VehicleRow> {
  await getDb()
    .collection(COL)
    .doc(id)
    .update({ status, updatedAt: FieldValue.serverTimestamp() });
  const v = await getVehicleById(id);
  if (!v) {
    throw new Error("NOT_FOUND");
  }
  return v;
}

export async function listVehiclesByStatus(status: VehicleStatus): Promise<VehicleRow[]> {
  const snap = await getDb().collection(COL).where("status", "==", status).limit(300).get();
  const rows = snap.docs.map((d) => toVehicle(d.id, d.data()));
  rows.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return rows.slice(0, 200);
}

export async function countVehicles(): Promise<number> {
  const snap = await getDb().collection(COL).count().get();
  return snap.data().count;
}

export async function countVehiclesByStatus(status: VehicleStatus): Promise<number> {
  const snap = await getDb().collection(COL).where("status", "==", status).count().get();
  return snap.data().count;
}

export async function assertVehicleOwnedBy(vehicleId: string, providerId: string): Promise<VehicleRow> {
  const v = await getVehicleById(vehicleId);
  if (!v || v.providerId !== providerId) {
    throw new Error("NOT_FOUND");
  }
  return v;
}
