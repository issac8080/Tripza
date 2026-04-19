"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const STORAGE_KEY = "kerala_travels_onboarding_dismissed_v2";

export function OnboardingBanner() {
  const { user, loading } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  if (loading || dismissed || !user || user.role === "ADMIN") {
    return null;
  }

  const traveler = user.role === "TRAVELER";
  const provider = user.role === "PROVIDER";

  return (
    <div className="border-b border-teal-200/80 bg-gradient-to-r from-teal-50 via-white to-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">Welcome — quick start</p>
          {traveler ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Browse <strong className="font-semibold text-slate-800">Vehicles</strong>, open a listing, then call or WhatsApp
              the host. Use <strong className="font-semibold text-slate-800">Trips</strong> to post or join shared rides.
            </p>
          ) : null}
          {provider ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Add your vehicle under <strong className="font-semibold text-slate-800">Add Vehicle</strong>. Travelers reach
              you using the phone number on your listing.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {traveler ? (
            <>
              <Link
                href="/vehicles"
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 sm:text-sm"
              >
                Browse vehicles
              </Link>
              <Link
                href="/post-trip"
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 sm:text-sm"
              >
                Post a trip
              </Link>
            </>
          ) : null}
          {provider ? (
            <Link
              href="/provider/vehicles/new"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 sm:text-sm"
            >
              Add vehicle
            </Link>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 sm:text-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
