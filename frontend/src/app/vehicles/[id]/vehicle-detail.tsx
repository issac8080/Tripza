"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/components/AuthProvider";
import { phoneDigits, telHref, whatsappHref } from "@/lib/contact";
import { authHeaders } from "@/lib/http";
import { ErrorCallout } from "@/components/ui/ErrorCallout";

type Vehicle = {
  id: string;
  type: string;
  brand: string;
  model: string;
  seatingCapacity: number;
  ac: boolean;
  driverIncluded: boolean;
  baseAddress: string;
  serviceAreas: string | null;
  pricePerKm: string | null;
  pricePerDay: string | null;
  minimumCharge: string | null;
  contactPhone: string | null;
  providerPhone: string | null;
  provider: { id: string; name: string; phone: string | null };
  images: { url: string }[];
  status?: string;
};

function formatMoney(label: string, value: string | null) {
  if (!value) {
    return `${label}: ask on call`;
  }
  return `${label}: ₹${value}`;
}

export function VehicleDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tripPostId = searchParams.get("tripPostId")?.trim() ?? "";

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/vehicles/${id}`, { headers: authHeaders() });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setVehicle((await res.json()) as Vehicle);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load, user?.id]);

  if (loadError) {
    return (
      <main className="page-wrap">
        <ErrorCallout message={loadError} onRetry={() => void load()} />
        <Link href="/vehicles" className="mt-6 inline-block text-sm font-semibold text-teal-700 hover:underline">
          ← All vehicles
        </Link>
      </main>
    );
  }
  if (!vehicle) {
    return (
      <main className="page-wrap">
        <p className="text-center text-sm text-slate-500" aria-live="polite">
          Loading vehicle…
        </p>
        <div className="mx-auto mt-8 max-w-xl animate-pulse space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="h-6 w-2/3 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-40 rounded-xl bg-slate-100" />
        </div>
      </main>
    );
  }

  const phone = vehicle.contactPhone ?? vehicle.providerPhone ?? vehicle.provider.phone ?? "";
  const hasPhone = Boolean(phone && phoneDigits(phone));
  const listingPublic = vehicle.status === "ACTIVE" || vehicle.status === undefined;
  const statusLabel = vehicle.status?.replace(/_/g, " ") ?? "Unknown";

  return (
    <main className="page-wrap">
      <Link href="/vehicles" className="text-sm font-semibold text-teal-700 hover:underline">
        ← All vehicles
      </Link>

      <div className="mt-6 space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">{vehicle.type}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {vehicle.brand} {vehicle.model}
          </h1>
          {listingPublic ? (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-900">
              Active listing
            </p>
          ) : (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950">
              Status: {statusLabel}
            </p>
          )}
          <p className="mt-3 text-sm text-slate-600">{vehicle.baseAddress}</p>
          {vehicle.serviceAreas ? <p className="mt-1 text-xs text-slate-500">Also serves: {vehicle.serviceAreas}</p> : null}
          <p className="mt-2 text-sm text-slate-700">Host: {vehicle.provider.name || "Listed driver"}</p>
          <ul className="mt-4 space-y-1 text-sm text-slate-700">
            <li>{vehicle.seatingCapacity} seats</li>
            <li>{vehicle.ac ? "Air conditioned" : "Non-AC"}</li>
            <li>{vehicle.driverIncluded ? "With driver" : "Self-drive where allowed"}</li>
            <li>{formatMoney("Per km", vehicle.pricePerKm)}</li>
            <li>{formatMoney("Per day", vehicle.pricePerDay)}</li>
            <li>{formatMoney("Minimum", vehicle.minimumCharge)}</li>
          </ul>
        </div>

        {tripPostId ? (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/80 p-4 text-sm text-teal-950">
            <p className="font-semibold">Opened from a trip</p>
            <p className="mt-1 text-xs text-teal-900/90">
              Reference trip <span className="font-mono">{tripPostId}</span> when you message the host.
            </p>
            <Link href={`/trips/${tripPostId}`} className="mt-2 inline-block text-xs font-semibold text-teal-800 underline-offset-2 hover:underline">
              View trip →
            </Link>
          </div>
        ) : null}

        <div className="rounded-2xl border-2 border-teal-500/25 bg-white p-6 shadow-md">
          <h2 className="text-xl font-bold text-slate-900">Contact the host</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            There is no payment in this app. Use call or WhatsApp to confirm the route, price, and pickup details.
          </p>
          {hasPhone ? (
            <>
              <p className="mt-4 font-mono text-base text-slate-900">{phone}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={telHref(phone)}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  Call
                </a>
                <a
                  href={whatsappHref(
                    phone,
                    `Hi, I'm interested in your ${vehicle.type} (${vehicle.brand} ${vehicle.model}) on Tripza.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  WhatsApp
                </a>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-amber-800">No phone number is on file for this listing yet.</p>
          )}
          {!user ? (
            <p className="mt-4 text-xs text-slate-500">
              <Link href={`/login?next=${encodeURIComponent(`/vehicles/${id}`)}`} className="font-semibold text-teal-700 hover:underline">
                Log in
              </Link>{" "}
              if you want your name on messages to hosts (optional).
            </p>
          ) : null}
        </div>

        {vehicle.images?.length ? (
          <div>
            <h2 className="text-sm font-bold text-slate-900">Photos</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {vehicle.images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.url} src={img.url} alt="" className="h-28 w-40 rounded-lg border border-slate-200 object-cover" />
              ))}
            </div>
          </div>
        ) : null}

        {!listingPublic && (user?.role === "PROVIDER" || user?.role === "ADMIN") ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p>This draft is only visible to you until it is approved and active.</p>
            <Link
              href="/profile"
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Back to profile
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
