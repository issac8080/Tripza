"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/components/AuthProvider";
import { authHeaders } from "@/lib/http";

function dayRangeUtc(dateStr: string) {
  const start = new Date(`${dateStr}T06:00:00`);
  const end = new Date(`${dateStr}T22:00:00`);
  return { start, end };
}

export function PostTripForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [seats, setSeats] = useState(4);
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDone("");
    if (!user) {
      router.push("/login?next=/post-trip");
      return;
    }
    if (user.role !== "TRAVELER" && user.role !== "PROVIDER" && user.role !== "ADMIN") {
      setError("Please use a traveler or provider account to post a trip.");
      return;
    }
    const { start, end } = dayRangeUtc(date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Pick a valid date.");
      return;
    }
    const title = `${from.trim()} → ${to.trim()}`.slice(0, 120);
    if (title.length < 3) {
      setError("From and To must be long enough to build a short title.");
      return;
    }
    const priceNum = price.trim() === "" ? undefined : Number(price);
    const budgetMin = priceNum !== undefined && Number.isFinite(priceNum) ? priceNum : undefined;
    const budgetMax = budgetMin;
    const descParts: string[] = [];
    if (phone.trim()) {
      descParts.push(`Contact phone (posted): ${phone.trim()}`);
    }
    const description = descParts.length ? descParts.join("\n") : undefined;
    try {
      const res = await fetch(`${API_URL}/api/v1/trip-posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          title,
          destinationLabel: to.trim(),
          pickupAddress: from.trim(),
          description,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          numPeople: seats,
          budgetMin,
          budgetMax,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { id: string };
      setDone(`Posted! Trip id ${data.id}.`);
      router.push(`/trips/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-8"
    >
      <div>
        <label className="label-field" htmlFor="post-from">
          From
        </label>
        <input
          id="post-from"
          required
          className="input-field mt-1.5"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="Pickup town or landmark"
        />
      </div>
      <div>
        <label className="label-field" htmlFor="post-to">
          To
        </label>
        <input
          id="post-to"
          required
          className="input-field mt-1.5"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Destination"
        />
      </div>
      <div>
        <label className="label-field" htmlFor="post-date">
          Date
        </label>
        <input
          id="post-date"
          type="date"
          required
          className="input-field mt-1.5"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-slate-500">We store a daytime window on that date for the listing.</p>
      </div>
      <div>
        <label className="label-field" htmlFor="post-seats">
          Seats
        </label>
        <input
          id="post-seats"
          type="number"
          min={1}
          max={200}
          required
          className="input-field mt-1.5"
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
        />
      </div>
      <div>
        <label className="label-field" htmlFor="post-price">
          Price (₹, optional)
        </label>
        <input
          id="post-price"
          type="number"
          min={0}
          step="1"
          className="input-field mt-1.5"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Per seat or whole vehicle—explain when you chat"
        />
      </div>
      <div>
        <label className="label-field" htmlFor="post-phone">
          Phone (optional)
        </label>
        <input
          id="post-phone"
          className="input-field mt-1.5"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Shown in the trip description if your account phone is empty"
        />
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {done ? <p className="text-sm font-medium text-brand-primary">{done}</p> : null}
      <button type="submit" className="btn-primary">
        Publish trip
      </button>
    </form>
  );
}
