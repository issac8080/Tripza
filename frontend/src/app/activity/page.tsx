"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/components/AuthProvider";
import { authHeaders } from "@/lib/http";

type HostedTrip = {
  id: string;
  title: string;
  destinationLabel: string;
  pickupAddress: string;
  startDate: string;
  status: string;
  numPeople: number;
};

type MineJoinItem = {
  id: string;
  tripPostId: string;
  seatsRequested: number;
  message: string | null;
  status: string;
  createdAt: string;
  trip: {
    id: string;
    title: string;
    destinationLabel: string;
    pickupAddress: string;
    startDate: string;
    status: string;
    numPeople: number;
    host: { id: string; name: string; phone: string | null };
  } | null;
};

export default function ActivityPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hosted, setHosted] = useState<HostedTrip[]>([]);
  const [requests, setRequests] = useState<MineJoinItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [rMine, rHosted] = await Promise.all([
        fetch(`${API_URL}/api/v1/join-requests/mine`, { headers: authHeaders() }),
        fetch(`${API_URL}/api/v1/trip-posts/mine`, { headers: authHeaders() }),
      ]);
      if (rMine.status === 401 || rHosted.status === 401) {
        router.push("/login?next=/activity");
        return;
      }
      if (!rMine.ok) {
        throw new Error(await rMine.text());
      }
      if (!rHosted.ok) {
        throw new Error(await rHosted.text());
      }
      const j = (await rMine.json()) as { items: MineJoinItem[] };
      const h = (await rHosted.json()) as { items: HostedTrip[] };
      setRequests(j.items);
      setHosted(h.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.replace("/login?next=/activity");
      return;
    }
    void load();
  }, [authLoading, user, load, router]);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    if (hash === "#requests" || hash === "#posted") {
      requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [loading]);

  if (authLoading || !user) {
    return (
      <main className="page-wrap">
        <p className="text-center text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activity</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        One place for trip seat requests you have sent and trips you have posted. Open a trip to accept or reject requests
        from others.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold text-teal-700">
        <a href="#requests" className="hover:underline">
          Seat requests
        </a>
        <span className="text-slate-300">·</span>
        <a href="#posted" className="hover:underline">
          Trips I posted
        </a>
      </div>

      {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-8 text-sm text-slate-500">Loading your activity…</p> : null}

      {!loading && !error ? (
        <>
          <section id="requests" className="mt-10 scroll-mt-24">
            <h2 className="text-lg font-bold text-slate-900">Seat requests I sent</h2>
            <p className="mt-1 text-sm text-slate-600">Status updates when the trip host accepts or rejects.</p>
            {requests.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
                No requests yet.{" "}
                <Link href="/trips" className="font-semibold text-teal-700 hover:underline">
                  Browse trips
                </Link>
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {requests.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {r.trip?.title ?? "Trip"}
                          <span className="ml-2 text-xs font-normal text-slate-500">({r.status})</span>
                        </p>
                        {r.trip ? (
                          <p className="mt-1 text-sm text-slate-600">
                            {r.trip.pickupAddress} → {r.trip.destinationLabel}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          {r.seatsRequested} seat(s) · {new Date(r.createdAt).toLocaleString()}
                        </p>
                        {r.message ? <p className="mt-2 text-sm text-slate-700">{r.message}</p> : null}
                      </div>
                      {r.trip ? (
                        <Link
                          href={`/trips/${r.trip.id}`}
                          className="shrink-0 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"
                        >
                          Open trip
                        </Link>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="posted" className="mt-12 scroll-mt-24 border-t border-slate-200/80 pt-10">
            <h2 className="text-lg font-bold text-slate-900">Trips I posted</h2>
            <p className="mt-1 text-sm text-slate-600">Manage booking requests on each trip page.</p>
            {hosted.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
                You have not posted a trip yet.{" "}
                <Link href="/post-trip" className="font-semibold text-teal-700 hover:underline">
                  Post a trip
                </Link>
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {hosted.map((t) => (
                  <li key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <Link href={`/trips/${t.id}`} className="text-base font-bold text-slate-900 hover:text-teal-800">
                      {t.title}
                    </Link>
                    <p className="mt-1 text-sm text-slate-600">
                      {t.pickupAddress} → {t.destinationLabel}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(t.startDate).toLocaleString()} · {t.numPeople} seats · {t.status}
                    </p>
                    <Link
                      href={`/trips/${t.id}`}
                      className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline"
                    >
                      Open trip and requests →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
