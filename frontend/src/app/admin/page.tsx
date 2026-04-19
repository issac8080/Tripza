"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/config";
import { getStoredToken, setStoredToken } from "@/lib/authToken";

type Stats = {
  users: number;
  vehicles: number;
  bookings: number;
  tripPosts: number;
  offers: number;
  pendingVehicleApprovals: number;
  pendingKycProfiles: number;
};

type VehicleRow = {
  id: string;
  brand: string;
  model: string;
  status: string;
  provider: { id: string; name: string; email: string | null; phone: string | null };
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<VehicleRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setToken(getStoredToken());
  }, []);

  const load = async () => {
    setError("");
    const auth = { Authorization: `Bearer ${token.trim()}` };
    try {
      const [s, v] = await Promise.all([
        fetch(`${API_URL}/api/v1/admin/stats`, { headers: auth }),
        fetch(`${API_URL}/api/v1/admin/vehicles/pending`, { headers: auth }),
      ]);
      if (!s.ok) {
        setError(await s.text());
        return;
      }
      if (!v.ok) {
        setError(await v.text());
        return;
      }
      setStats((await s.json()) as Stats);
      const vehiclesJson = (await v.json()) as { items: VehicleRow[] };
      setPending(vehiclesJson.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  };

  const setVehicleStatus = async (id: string, status: "ACTIVE" | "INACTIVE") => {
    const res = await fetch(`${API_URL}/api/v1/admin/vehicles/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setError(await res.text());
      return;
    }
    await load();
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-12">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Admin console</h1>
          <p className="mt-2 text-sm text-slate-600">
            Requires an <code className="rounded bg-teal-50 px-1">ADMIN</code> JWT. Seed creates{" "}
            <code className="rounded bg-teal-50 px-1">admin@keralatravels.local</code>.
          </p>
        </div>
        <Link href="/" className="text-sm font-semibold text-teal-700 hover:text-slate-900">
          ← Home
        </Link>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="text-sm font-medium text-slate-900">Admin JWT</label>
        <textarea
          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          rows={3}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setStoredToken(token.trim());
              void load();
            }}
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Save &amp; refresh
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50"
          >
            Refresh
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>

      {stats ? (
        <section className="grid gap-4 md:grid-cols-3">
          {(
            [
              ["Users", stats.users],
              ["Vehicles", stats.vehicles],
              ["Bookings", stats.bookings],
              ["Trip posts", stats.tripPosts],
              ["Offers", stats.offers],
              ["Pending vehicle approvals", stats.pendingVehicleApprovals],
              ["Pending KYC", stats.pendingKycProfiles],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Vehicles pending approval</h2>
        <div className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-slate-500">None right now.</p>
          ) : (
            pending.map((row) => (
              <div key={row.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">
                    {row.brand} {row.model}
                  </p>
                  <p className="text-xs text-slate-500">
                    Provider: {row.provider.name} · {row.provider.email ?? row.provider.phone ?? row.provider.id}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void setVehicleStatus(row.id, "ACTIVE")}
                    className="rounded-full bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void setVehicleStatus(row.id, "INACTIVE")}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-teal-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
