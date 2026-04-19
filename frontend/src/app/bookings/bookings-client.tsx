"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/components/AuthProvider";
import { phoneDigits, telHref, whatsappHref } from "@/lib/contact";
import { authHeaders } from "@/lib/http";
import { ErrorCallout } from "@/components/ui/ErrorCallout";
import { ListSkeleton } from "@/components/ui/ListSkeleton";

type Row = {
  id: string;
  role: string;
  status: string;
  bookingType: string;
  startAt: string;
  endAt: string;
  totalPrice: string;
  vehicle: { id: string; brand: string; model: string; type: string };
  traveler: { id: string; name: string; phone: string | null };
  provider: { id: string; name: string; phone: string | null };
  contactPhone: string | null;
};

export function BookingsClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const didScrollHighlight = useRef(false);
  const [items, setItems] = useState<Row[]>([]);
  const [error, setError] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!user) {
      return;
    }
    setError("");
    setListLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/bookings/mine`, { headers: authHeaders() });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { items: Row[] };
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setListLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/bookings");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      void load();
    }
  }, [user, load]);

  useEffect(() => {
    if (!highlightId || didScrollHighlight.current || items.length === 0) {
      return;
    }
    const el = document.getElementById(`booking-${highlightId}`);
    if (el) {
      didScrollHighlight.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, items]);

  const patchStatus = async (id: string, status: "CONTACTED" | "BOOKED" | "CANCELLED") => {
    setActionMsg((m) => ({ ...m, [id]: "" }));
    try {
      const res = await fetch(`${API_URL}/api/v1/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setActionMsg((m) => ({ ...m, [id]: `Updated to ${status}` }));
      void load();
    } catch (e) {
      setActionMsg((m) => ({ ...m, [id]: e instanceof Error ? e.message : "Failed" }));
    }
  };

  const peerPhone = (b: Row) => {
    if (b.role === "TRAVELER") {
      return b.contactPhone ?? b.provider.phone;
    }
    return b.contactPhone ?? b.traveler.phone;
  };

  if (!user && loading) {
    return (
      <p className="page-wrap text-center text-sm text-slate-500" aria-live="polite">
        Loading your bookings…
      </p>
    );
  }
  if (!user) {
    return null;
  }

  return (
    <main className="page-wrap">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">My bookings</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
        Bookings you create in the app appear here with an estimated total. You can still confirm timing and inclusions by
        phone or WhatsApp, then update status for your records.
      </p>
      <Link
        href="/vehicles"
        className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-teal-700 underline-offset-2 hover:underline"
      >
        Browse vehicles →
      </Link>
      {error ? <ErrorCallout message={error} onRetry={() => void load()} /> : null}
      {listLoading && items.length === 0 ? <ListSkeleton rows={4} /> : null}
      {listLoading && items.length === 0 ? null : (
        <ul className="mt-8 space-y-4">
          {items.map((b) => {
            const phone = peerPhone(b);
            const digitsOk = phone && phoneDigits(phone);
            const label = b.role === "TRAVELER" ? "provider" : "traveler";
            return (
              <li
                key={b.id}
                id={`booking-${b.id}`}
                className={`rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 ${
                  highlightId === b.id ? "ring-2 ring-teal-500/40" : ""
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {b.vehicle.brand} {b.vehicle.model}{" "}
                      <span className="text-xs font-normal text-slate-500">({b.role})</span>
                    </p>
                    <Link
                      href={`/vehicles/${b.vehicle.id}#book`}
                      className="mt-1 inline-block text-xs font-semibold text-teal-700 underline-offset-2 hover:underline"
                    >
                      View vehicle · book again →
                    </Link>
                  </div>
                  <span className="inline-flex w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900">
                    {b.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-700">
                  {b.bookingType} · estimate ₹{b.totalPrice}
                </p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  {new Date(b.startAt).toLocaleString()} → {new Date(b.endAt).toLocaleString()}
                </p>
                {digitsOk ? (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Contact {label}</p>
                    <p className="mt-1 font-mono text-sm text-slate-900">{phone}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a
                        href={telHref(phone!)}
                        className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        Call
                      </a>
                      <a
                        href={whatsappHref(
                          phone!,
                          `Hi, about the booking for ${b.vehicle.brand} ${b.vehicle.model} (${b.bookingType}).`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-amber-800">No phone on file for the other party yet.</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void patchStatus(b.id, "CONTACTED")}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Mark contacted
                  </button>
                  <button
                    type="button"
                    onClick={() => void patchStatus(b.id, "BOOKED")}
                    className="rounded-full bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    Mark booked
                  </button>
                  <button
                    type="button"
                    onClick={() => void patchStatus(b.id, "CANCELLED")}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
                {actionMsg[b.id] ? <p className="mt-2 text-xs text-slate-700">{actionMsg[b.id]}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
      {!listLoading && items.length === 0 && !error ? (
        <div className="mt-16 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-800">No bookings yet</p>
          <p className="mt-2 text-sm text-slate-600">
            Open any vehicle and use <strong className="font-semibold text-slate-800">Book in the app</strong> to save
            dates and an estimate.
          </p>
          <Link
            href="/vehicles"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
          >
            Browse vehicles
          </Link>
        </div>
      ) : null}
    </main>
  );
}
