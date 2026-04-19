"use client";

import { useEffect, useState } from "react";

const KEY = "travels_cookie_consent";

export type ConsentValue = "accepted" | "rejected" | "";

export function getCookieConsent(): ConsentValue {
  if (typeof window === "undefined") {
    return "";
  }
  const v = window.localStorage.getItem(KEY);
  if (v === "accepted" || v === "rejected") {
    return v;
  }
  return "";
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing) {
      setVisible(true);
    }
  }, []);

  if (!visible) {
    return null;
  }

  const choose = (value: "accepted" | "rejected") => {
    window.localStorage.setItem(KEY, value);
    setVisible(false);
    window.dispatchEvent(new Event("travels-consent-changed"));
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur-md sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <p className="text-sm leading-relaxed text-slate-700">
          We use essential cookies and, if you accept, Firebase Analytics to understand traffic. Read our{" "}
          <a href="/privacy" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
            Privacy
          </a>{" "}
          page for details.
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => choose("rejected")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-400/20"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}
