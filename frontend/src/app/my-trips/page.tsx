"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/components/AuthProvider";
import { authHeaders } from "@/lib/http";

type MyTrip = {
  id: string;
  title: string;
  destinationLabel: string;
  pickupAddress: string;
  startDate: string;
  endDate: string;
  numPeople: number;
  status: string;
};

export default function MyTripsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<MyTrip[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/trip-posts/mine`, { headers: authHeaders() });
      if (res.status === 401) {
        router.push("/login?next=/my-trips");
        return;
      }
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { items: MyTrip[] };
      setItems(data.items);
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
      router.replace("/login?next=/my-trips");
      return;
    }
    void load();
  }, [authLoading, user, load, router]);

  if (authLoading || !user) {
    return (
      <main className="page-wrap">
        <p className="text-center text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">My trips</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Trips you posted. Open one to see booking requests, then accept or reject each person who asked to join.
      </p>
      <Link href="/post-trip" className="mt-4 inline-flex text-sm font-semibold text-teal-700 hover:underline">
        Post another trip →
      </Link>

      {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-8 text-sm text-slate-500">Loading your trips…</p> : null}

      {!loading && !error && items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
          <p className="text-sm text-slate-700">You have not posted any trips yet.</p>
          <Link href="/post-trip" className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline">
            Post a trip
          </Link>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {items.map((t) => (
            <li key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Link href={`/trips/${t.id}`} className="text-lg font-bold text-slate-900 hover:text-teal-800">
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
                className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-teal-700 hover:underline"
              >
                View trip and requests →
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
