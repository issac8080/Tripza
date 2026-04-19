import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { env } from "../config/env";

let app: App | null = null;
let firestore: Firestore | null = null;

function initApp(): App {
  if (app) {
    return app;
  }
  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }

  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON) as Record<string, unknown>;
      app = initializeApp({ credential: cert(sa as Parameters<typeof cert>[0]) });
      return app;
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON. Paste the full service account object as one line, or use a key file path instead.",
      );
    }
  }

  if (env.GOOGLE_APPLICATION_CREDENTIALS) {
    const keyPath = env.GOOGLE_APPLICATION_CREDENTIALS;
    const raw = readFileSync(keyPath, "utf8");
    if (!raw.trim()) {
      throw new Error(
        `Service account file is empty: ${keyPath}. Replace it with the JSON downloaded from Firebase Console → Project settings → Service accounts → Generate new private key.`,
      );
    }
    try {
      const sa = JSON.parse(raw) as Record<string, unknown>;
      app = initializeApp({ credential: cert(sa as Parameters<typeof cert>[0]) });
      return app;
    } catch {
      throw new Error(
        `Service account file is not valid JSON: ${keyPath}. Re-download the key from Firebase Console (same menu as above) and overwrite this file.`,
      );
    }
  }

  throw new Error(
    "Firebase Admin is not configured. In Firebase Console → Project settings → Service accounts → Generate new private key, then set either FIREBASE_SERVICE_ACCOUNT_JSON (full JSON string) or GOOGLE_APPLICATION_CREDENTIALS (path to the key file). Web client apiKey/appId alone cannot access Firestore from this API.",
  );
}

export function getDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(initApp());
  }
  return firestore;
}
