"use client";

import { useEffect } from "react";
import { getCookieConsent } from "@/components/CookieConsent";
import { getFirebaseWebConfig } from "@/lib/firebase/config";
import { initFirebaseAnalytics } from "@/lib/firebase/client";

function tryInit() {
  const config = getFirebaseWebConfig();
  if (!config) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(
        "[Firebase] Missing NEXT_PUBLIC_FIREBASE_* env vars — add them to frontend/.env.local",
      );
    }
    return;
  }
  if (getCookieConsent() !== "accepted") {
    return;
  }
  void initFirebaseAnalytics();
}

/**
 * Initializes Firebase App + Analytics once on the client (App Router safe).
 * Analytics runs only after explicit cookie consent.
 */
export function FirebaseInit() {
  useEffect(() => {
    tryInit();
    const onConsent = () => tryInit();
    window.addEventListener("travels-consent-changed", onConsent);
    return () => window.removeEventListener("travels-consent-changed", onConsent);
  }, []);

  return null;
}
