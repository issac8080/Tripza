"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { phoneDigits, telHref, whatsappHref } from "@/lib/contact";
import { ErrorCallout } from "@/components/ui/ErrorCallout";
import { VehicleCardGridSkeleton } from "@/components/ui/ListSkeleton";
import { useDebounced } from "@/hooks/useDebounced";

type VehicleRow = {
  id: string;
  type: string;
  brand: string;
  model: string;
  seatingCapacity: number;
  ac: boolean;
  baseAddress: string;
  serviceAreas: string | null;
  pricePerDay: string | null;
  minimumCharge: string | null;
  providerPhone: string | null;
};

export default function VehiclesPage() {
  const [type, setType] = useState("");
  const [ac, setAc] = useState("");
  const [minSeats, setMinSeats] = useState("");
  const [place, setPlace] = useState("");
  const debouncedPlace = useDebounced(place, 400);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const initial = sp.get("q");
    if (initial) {
      setPlace(initial);
    }
  }, []);
  const [items, setItems] = useState<VehicleRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    const q = new URLSearchParams();
    if (type) {
      q.set("type", type);
    }
    if (ac === "true" || ac === "false") {
      q.set("ac", ac);
    }
    if (minSeats) {
      q.set("minSeats", minSeats);
    }
    if (debouncedPlace.trim()) {
      q.set("q", debouncedPlace.trim());
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/vehicles?${q.toString()}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { items: VehicleRow[] };
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [type, ac, minSeats, debouncedPlace]);

  useEffect(() => {
    void load();
  }, [load]);

  const showEmpty = !loading && !error && items.length === 0;
  const showGrid = !loading && !error && items.length > 0;

  return (
    <main className="page-wrap">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Browse vehicles</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
            Open a listing for full details, then call or WhatsApp the host. There is no checkout or payment in this app.
          </p>
        </div>
        <Link
          href="/post-trip"
          className="inline-flex min-h-11 items-center justify-center self-start rounded-xl bg-brand-accent px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-accent-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/30 lg:self-auto"
        >
          Post a trip →
        </Link>
      </div>

      <div className="mt-8 grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="veh-place">
            Place or route
          </label>
          <input
            id="veh-place"
            type="search"
            placeholder="e.g. Munnar, Thrissur, Kochi"
            className="input-field mt-1 w-full"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            autoComplete="off"
          />
          <p className="mt-1 text-xs text-slate-500">Results update shortly after you stop typing.</p>
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="veh-type">
            Type
          </label>
          <select
            id="veh-type"
            className="select-field mt-1 w-full"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All types</option>
            <option value="BIKE">Bike</option>
            <option value="CAR">Car</option>
            <option value="JEEP">Jeep</option>
            <option value="TRAVELLER">Traveller</option>
            <option value="BUS">Bus</option>
          </select>
        </div>
        <div className="sm:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="veh-ac">
            Air conditioning
          </label>
          <select id="veh-ac" className="select-field mt-1 w-full" value={ac} onChange={(e) => setAc(e.target.value)}>
            <option value="">Any</option>
            <option value="true">AC</option>
            <option value="false">Non-AC</option>
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="veh-seats">
            Minimum seats
          </label>
          <input
            id="veh-seats"
            type="number"
            min={1}
            placeholder="e.g. 20"
            className="input-field mt-1 w-full"
            value={minSeats}
            onChange={(e) => setMinSeats(e.target.value)}
          />
        </div>
      </div>

      {error ? <ErrorCallout message={error} onRetry={() => void load()} /> : null}
      {loading ? <VehicleCardGridSkeleton /> : null}

      {showGrid ? (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((v) => (
            <li
              key={v.id}
              className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white shadow-soft transition hover:border-brand-primary/35 hover:shadow-soft"
            >
              <Link
                href={`/vehicles/${v.id}`}
                className="group flex flex-1 flex-col p-5 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/25"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">{v.type}</p>
                <p className="mt-2 text-lg font-bold text-slate-900 group-hover:text-brand-primary-dark">
                  {v.brand} {v.model}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{v.baseAddress}</p>
                {v.serviceAreas ? (
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">Also: {v.serviceAreas}</p>
                ) : null}
                <p className="mt-3 text-sm text-slate-700">
                  {v.seatingCapacity} seats · {v.ac ? "AC" : "Non-AC"}
                </p>
                <p className="mt-auto pt-4 text-base font-semibold text-slate-900">
                  {v.pricePerDay
                    ? `From ₹${v.pricePerDay}/day`
                    : v.minimumCharge
                      ? `From ₹${v.minimumCharge} minimum`
                      : "Ask for price"}
                </p>
              </Link>
              <div className="flex flex-col gap-2 border-t border-slate-100 px-5 pb-5 pt-3">
                <Link
                  href={`/vehicles/${v.id}`}
                  className="btn-primary inline-flex min-h-10 w-full px-3 text-sm"
                >
                  View details
                </Link>
                {v.providerPhone && phoneDigits(v.providerPhone) ? (
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={telHref(v.providerPhone)}
                      className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    >
                      Call
                    </a>
                    <a
                      href={whatsappHref(
                        v.providerPhone,
                        `Hi, I'm interested in your ${v.type} (${v.brand} ${v.model}) listing on Tripza.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 min-w-0 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      WhatsApp
                    </a>
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-500">Phone on listing page</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {showEmpty ? (
        <div className="mt-16 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
          <p className="text-sm font-medium text-slate-800">No active vehicles match yet</p>
          <p className="mt-2 text-sm text-slate-600">Try another place or widen your filters.</p>
          <Link
            href="/provider/vehicles/new"
            className="mt-4 inline-flex min-h-11 items-center justify-center text-sm font-semibold text-brand-primary underline-offset-2 hover:underline"
          >
            Add a vehicle
          </Link>
        </div>
      ) : null}
    </main>
  );
}
