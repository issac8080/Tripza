"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { phoneDigits, telHref, whatsappHref } from "@/lib/contact";
import { ErrorCallout } from "@/components/ui/ErrorCallout";
import { ListSkeleton } from "@/components/ui/ListSkeleton";
import { useDebounced } from "@/hooks/useDebounced";

type Trip = {
  id: string;
  title: string;
  destinationLabel: string;
  pickupAddress: string;
  startDate: string;
  endDate: string;
  numPeople: number;
  status: string;
  offersCount: number;
  traveler: { id: string; name: string; phone: string | null };
};

export default function TripsBoardPage() {
  const [q, setQ] = useState("");
  const debouncedQ = useDebounced(q, 400);
  const [items, setItems] = useState<Trip[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    const params = new URLSearchParams();
    if (debouncedQ.trim()) {
      params.set("q", debouncedQ.trim());
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/trip-posts?${params.toString()}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { items: Trip[] };
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  const showEmpty = !loading && !error && items.length === 0;
  const showList = !loading && !error && items.length > 0;

  return (
    <main className="page-wrap">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Trips</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            Shared rides and seat offers. Open a card for details, then call or WhatsApp the poster—there is no in-app
            booking or payment.
          </p>
        </div>
        <Link
          href="/post-trip"
          className="inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-brand-accent px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-accent-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/30 sm:self-auto"
        >
          Post a trip
        </Link>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="trip-q">
          Search by place
        </label>
        <input
          id="trip-q"
          type="search"
          className="input-field mt-1 w-full"
          placeholder="e.g. Munnar, Kochi airport"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-slate-500">Results update shortly after you stop typing.</p>
      </div>

      {error ? <ErrorCallout message={error} onRetry={() => void load()} /> : null}
      {loading ? <ListSkeleton rows={5} /> : null}

      {showList ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((t) => {
            const ph = t.traveler.phone;
            const showContact = ph && phoneDigits(ph);
            return (
              <li
                key={t.id}
                className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white shadow-soft transition hover:border-brand-primary/35 hover:shadow-soft"
              >
                <Link
                  href={`/trips/${t.id}`}
                  className="block flex-1 p-5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/25 sm:p-6"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{t.title}</p>
                      <p className="mt-1 text-sm text-slate-600">To: {t.destinationLabel}</p>
                      <p className="mt-1 text-xs text-slate-500">From: {t.pickupAddress}</p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-semibold text-brand-primary-dark">
                      {t.numPeople} seat{t.numPeople === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500 sm:text-sm">
                    {new Date(t.startDate).toLocaleDateString()} · {t.status}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">Posted by {t.traveler.name}</p>
                </Link>
                {showContact ? (
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 pb-5 pt-3 sm:px-6">
                    <a
                      href={telHref(ph!)}
                      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Call
                    </a>
                    <a
                      href={whatsappHref(ph!, `Hi, I saw your trip: “${t.title}”.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      WhatsApp
                    </a>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {showEmpty ? (
        <div className="mt-16 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-800">No trips match</p>
          <p className="mt-2 text-sm text-slate-600">Try another search or post your own.</p>
          <Link
            href="/post-trip"
            className="mt-4 inline-flex min-h-11 items-center justify-center text-sm font-semibold text-brand-primary underline-offset-2 hover:underline"
          >
            Post a trip
          </Link>
        </div>
      ) : null}
    </main>
  );
}
