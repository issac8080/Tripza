"use client";

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { getStoredToken, setStoredToken } from "@/lib/authToken";

type ReviewItem = {
  id: string;
  vehicleScore: number;
  driverScore: number;
  tags: string[];
  body: string | null;
  photoUrls: string[];
  createdAt: string;
  reviewer: { id: string; name: string; photoUrl: string | null };
};

type Summary = { count: number; avgVehicle: number | null; avgDriver: number | null };

export function ReviewsClient({ initialVehicleId }: { initialVehicleId: string }) {
  const [vehicleId, setVehicleId] = useState(initialVehicleId);

  useEffect(() => {
    setVehicleId(initialVehicleId);
  }, [initialVehicleId]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [token, setToken] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [vehicleScore, setVehicleScore] = useState(5);
  const [driverScore, setDriverScore] = useState(5);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setToken(getStoredToken());
  }, []);

  const load = useCallback(async () => {
    if (!vehicleId.trim()) {
      setMessage("Enter a vehicle id.");
      return;
    }
    const res = await fetch(`${API_URL}/api/v1/reviews?vehicleId=${encodeURIComponent(vehicleId.trim())}`);
    if (!res.ok) {
      setMessage(await res.text());
      return;
    }
    const data = (await res.json()) as { summary: Summary; items: ReviewItem[] };
    setSummary(data.summary);
    setItems(data.items);
    setMessage("Loaded.");
  }, [vehicleId]);

  useEffect(() => {
    if (!vehicleId.trim()) {
      return;
    }
    void load();
  }, [vehicleId, load]);

  const submit = async () => {
    setMessage("");
    if (!token.trim() || !bookingId.trim()) {
      setMessage("Need JWT + booking id.");
      return;
    }
    const res = await fetch(`${API_URL}/api/v1/reviews`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: bookingId.trim(),
        vehicleScore,
        driverScore,
        tags: ["punctuality", "cleanliness"],
        body: body.trim() || undefined,
      }),
    });
    if (!res.ok) {
      setMessage(await res.text());
      return;
    }
    setMessage("Review submitted.");
    await load();
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Browse by vehicle</h2>
        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <input
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Vehicle id"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Load reviews
          </button>
        </div>
        {summary ? (
          <p className="mt-3 text-sm text-slate-600">
            {summary.count} reviews · vehicle avg {summary.avgVehicle?.toFixed(2) ?? "—"} · driver avg{" "}
            {summary.avgDriver?.toFixed(2) ?? "—"}
          </p>
        ) : null}
        <ul className="mt-4 space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-xl border border-slate-200 bg-teal-50/50 p-4 text-sm">
              <p className="font-semibold text-slate-900">
                Vehicle {r.vehicleScore}/5 · Driver {r.driverScore}/5
              </p>
              <p className="text-xs text-slate-500">{r.reviewer.name}</p>
              {r.body ? <p className="mt-2 text-slate-700">{r.body}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Submit review (traveler)</h2>
        <textarea
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          rows={2}
          placeholder="JWT"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-teal-700 hover:underline"
          onClick={() => setStoredToken(token.trim())}
        >
          Save JWT locally
        </button>
        <input
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Booking id"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-900">
            Vehicle score
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={vehicleScore}
              onChange={(e) => setVehicleScore(Number(e.target.value))}
            />
          </label>
          <label className="text-sm text-slate-900">
            Driver score
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={driverScore}
              onChange={(e) => setDriverScore(Number(e.target.value))}
            />
          </label>
        </div>
        <textarea
          className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          rows={3}
          placeholder="Review text (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          type="button"
          onClick={() => void submit()}
          className="mt-4 rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Submit review
        </button>
        {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}
      </section>
    </div>
  );
}
