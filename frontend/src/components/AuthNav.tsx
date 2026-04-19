"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

type AuthNavProps = {
  variant?: "default" | "mobile";
};

export function AuthNav({ variant = "default" }: AuthNavProps) {
  const { user, loading, logout } = useAuth();
  const mobile = variant === "mobile";

  if (loading) {
    return (
      <span className={`text-sm text-slate-500 ${mobile ? "block py-2" : ""}`} aria-live="polite">
        Loading account…
      </span>
    );
  }

  if (!user) {
    return (
      <div className={mobile ? "flex flex-col gap-2" : "flex items-center gap-2"}>
        <Link
          href="/login"
          className={
            mobile
              ? "inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-400/20"
              : "inline-flex min-h-10 items-center justify-center rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-teal-500/20"
          }
        >
          Log in
        </Link>
        <Link
          href="/register"
          className={
            mobile
              ? "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
              : "inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 focus:outline-none focus:ring-4 focus:ring-teal-500/30"
          }
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className={mobile ? "flex flex-col gap-3" : "flex flex-col items-end gap-1 md:flex-row md:items-center md:gap-3"}>
      <div className={`rounded-xl bg-slate-50 px-3 py-2 ${mobile ? "w-full" : ""}`}>
        <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
        <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-teal-700">{user.role}</p>
      </div>
      <div className={mobile ? "flex flex-col gap-2" : "flex flex-wrap items-center justify-end gap-2"}>
        <Link
          href="/profile"
          className={
            mobile
              ? "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              : "text-sm font-semibold text-teal-700 underline-offset-4 hover:underline"
          }
        >
          Profile
        </Link>
        <button
          type="button"
          onClick={logout}
          className={
            mobile
              ? "inline-flex min-h-11 w-full items-center justify-center rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              : "text-sm font-semibold text-slate-600 underline-offset-4 hover:underline"
          }
        >
          Log out
        </button>
      </div>
    </div>
  );
}
