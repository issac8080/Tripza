"use client";

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirebaseWebConfig } from "./config";

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") {
    return null;
  }
  const config = getFirebaseWebConfig();
  if (!config) {
    return null;
  }
  if (!app) {
    app = getApps().length > 0 ? getApps()[0]! : initializeApp(config);
  }
  return app;
}

let analytics: Analytics | null = null;

export async function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (analytics) {
    return analytics;
  }
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }
  const ok = await isSupported();
  if (!ok) {
    return null;
  }
  analytics = getAnalytics(firebaseApp);
  return analytics;
}
