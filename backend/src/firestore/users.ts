import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData } from "firebase-admin/firestore";
import type { PreferredLanguage, UserRole } from "../domain/enums";
import { KycStatus, ProviderBusinessType } from "../domain/enums";
import { getDb } from "../lib/firebaseAdmin";

const USERS = "users";
const PROFILES = "providerProfiles";

export type UserDoc = {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  name: string;
  role: UserRole;
  photoUrl: string | null;
  preferredLanguage: PreferredLanguage;
  createdAt: string;
  updatedAt: string;
};

function tsToIso(v: unknown): string {
  if (v instanceof Timestamp) {
    return v.toDate().toISOString();
  }
  if (typeof v === "string") {
    return v;
  }
  return new Date().toISOString();
}

function toUser(id: string, data: DocumentData): UserDoc {
  return {
    id,
    email: data.email ?? null,
    phone: data.phone ?? null,
    passwordHash: data.passwordHash ?? null,
    name: data.name,
    role: data.role,
    photoUrl: data.photoUrl ?? null,
    preferredLanguage: data.preferredLanguage ?? "EN",
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}

export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const snap = await getDb().collection(USERS).where("email", "==", email).limit(1).get();
  if (snap.empty) {
    return null;
  }
  const d = snap.docs[0]!;
  return toUser(d.id, d.data());
}

export async function findUserByPhone(phone: string): Promise<UserDoc | null> {
  const snap = await getDb().collection(USERS).where("phone", "==", phone).limit(1).get();
  if (snap.empty) {
    return null;
  }
  const d = snap.docs[0]!;
  return toUser(d.id, d.data());
}

export async function getUserById(id: string): Promise<UserDoc | null> {
  const d = await getDb().collection(USERS).doc(id).get();
  if (!d.exists) {
    return null;
  }
  return toUser(d.id, d.data()!);
}

export async function emailTaken(email: string): Promise<boolean> {
  const u = await findUserByEmail(email);
  return u !== null;
}

export async function phoneTaken(phone: string): Promise<boolean> {
  const u = await findUserByPhone(phone);
  return u !== null;
}

export async function createUserWithProfile(input: {
  email?: string | null;
  phone?: string | null;
  passwordHash: string;
  name: string;
  role: UserRole;
}): Promise<UserDoc> {
  const id = randomUUID();
  const db = getDb();
  const batch = db.batch();
  const userRef = db.collection(USERS).doc(id);
  const now = FieldValue.serverTimestamp();
  batch.set(userRef, {
    email: input.email ?? null,
    phone: input.phone ?? null,
    passwordHash: input.passwordHash,
    name: input.name,
    role: input.role,
    photoUrl: null,
    preferredLanguage: "EN",
    createdAt: now,
    updatedAt: now,
  });
  if (input.role === "PROVIDER") {
    const prRef = db.collection(PROFILES).doc(id);
    batch.set(prRef, {
      userId: id,
      businessType: ProviderBusinessType.INDIVIDUAL,
      companyName: null,
      kycStatus: KycStatus.PENDING,
      idDocumentUrl: null,
      licenseDocUrl: null,
      createdAt: now,
      updatedAt: now,
    });
  }
  await batch.commit();
  const created = await getUserById(id);
  if (!created) {
    throw new Error("User create failed");
  }
  return created;
}

export async function updateUser(
  id: string,
  patch: { name?: string; preferredLanguage?: PreferredLanguage },
): Promise<UserDoc> {
  const db = getDb();
  await db
    .collection(USERS)
    .doc(id)
    .update({
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    });
  const u = await getUserById(id);
  if (!u) {
    throw new Error("User missing after update");
  }
  return u;
}

export async function getProviderProfile(userId: string): Promise<DocumentData | null> {
  const d = await getDb().collection(PROFILES).doc(userId).get();
  return d.exists ? d.data()! : null;
}

export async function updateProviderKyc(userId: string, kycStatus: KycStatus): Promise<void> {
  const db = getDb();
  const ref = db.collection(PROFILES).doc(userId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("NOT_FOUND");
  }
  await ref.update({ kycStatus, updatedAt: FieldValue.serverTimestamp() });
}

export async function countUsers(): Promise<number> {
  const snap = await getDb().collection(USERS).count().get();
  return snap.data().count;
}

export async function listUsers(take: number): Promise<UserDoc[]> {
  const snap = await getDb().collection(USERS).orderBy("createdAt", "desc").limit(take).get();
  return snap.docs.map((d) => toUser(d.id, d.data()));
}

export async function updateUserRoleName(
  id: string,
  patch: { role?: UserRole; name?: string },
): Promise<UserDoc> {
  const db = getDb();
  await db
    .collection(USERS)
    .doc(id)
    .update({
      ...patch,
      updatedAt: FieldValue.serverTimestamp(),
    });
  const u = await getUserById(id);
  if (!u) {
    throw new Error("NOT_FOUND");
  }
  return u;
}

export async function countPendingKyc(): Promise<number> {
  const snap = await getDb().collection(PROFILES).where("kycStatus", "==", KycStatus.PENDING).count().get();
  return snap.data().count;
}
