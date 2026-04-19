"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/components/AuthProvider";
import { phoneDigits, telHref, whatsappHref } from "@/lib/contact";
import { authHeaders } from "@/lib/http";

type TripDetail = {
  id: string;
  title: string;
  description: string | null;
  destinationLabel: string;
  pickupAddress: string;
  startDate: string;
  endDate: string;
  numPeople: number;
  budgetMin: string | null;
  budgetMax: string | null;
  preferredTypes: string[];
  status: string;
  traveler: { id: string; name: string; phone: string | null };
};

type JoinRequest = {
  id: string;
  seatsRequested: number;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  requester: { id: string; name: string; phone: string | null };
};

export function TripDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [joinFetched, setJoinFetched] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinBusy, setJoinBusy] = useState(false);
  const [seats, setSeats] = useState(1);
  const [reqMessage, setReqMessage] = useState("");
  const [reqFeedback, setReqFeedback] = useState("");

  const loadTrip = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/trip-posts/${id}`);
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as TripDetail;
      setTrip(data);
      setSeats(Math.min(4, Math.max(1, data.numPeople)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [id]);

  const loadJoinRequests = useCallback(async () => {
    if (!user) {
      setJoinRequests([]);
      setJoinFetched(true);
      return;
    }
    setJoinFetched(false);
    setJoinError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/trip-posts/${id}/join-requests`, { headers: authHeaders() });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = (await res.json()) as { items: JoinRequest[] };
      setJoinRequests(data.items);
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Failed to load requests");
      setJoinRequests([]);
    } finally {
      setJoinFetched(true);
    }
  }, [id, user]);

  useEffect(() => {
    void loadTrip();
  }, [loadTrip]);

  useEffect(() => {
    void loadJoinRequests();
  }, [loadJoinRequests]);

  const patchTripStatus = async (status: "OPEN" | "CONTACTED" | "BOOKED" | "CANCELLED") => {
    setStatusMsg("");
    if (!user) {
      router.push(`/login?next=/trips/${id}`);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/trip-posts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setStatusMsg(`Trip status updated.`);
      void loadTrip();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Update failed");
    }
  };

  const submitJoinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqFeedback("");
    if (!user) {
      router.push(`/login?next=/trips/${id}`);
      return;
    }
    setJoinBusy(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/trip-posts/${id}/join-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          seatsRequested: seats,
          message: reqMessage.trim() || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setReqFeedback("Request sent. The host will review it.");
      setReqMessage("");
      void loadJoinRequests();
    } catch (err) {
      setReqFeedback(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setJoinBusy(false);
    }
  };

  const setJoinStatus = async (joinRequestId: string, status: "ACCEPTED" | "REJECTED") => {
    setJoinBusy(true);
    setJoinError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/trip-posts/${id}/join-requests/${joinRequestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      void loadJoinRequests();
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setJoinBusy(false);
    }
  };

  const withdrawRequest = async (joinRequestId: string) => {
    setJoinBusy(true);
    setJoinError("");
    try {
      const res = await fetch(`${API_URL}/api/v1/trip-posts/${id}/join-requests/${joinRequestId}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: "{}",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      void loadJoinRequests();
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Withdraw failed");
    } finally {
      setJoinBusy(false);
    }
  };

  if (error) {
    return <p className="px-4 py-16 text-center text-red-700">{error}</p>;
  }
  if (!trip) {
    return <p className="px-4 py-16 text-center text-sm text-emerald-800/70">Loading…</p>;
  }

  const isOwner = Boolean(user && (user.id === trip.traveler.id || user.role === "ADMIN"));
  const travelerPhone = trip.traveler.phone;
  const showTravelerContact = travelerPhone && phoneDigits(travelerPhone);
  const acceptingRequests = trip.status === "OPEN" || trip.status === "CONTACTED";

  const priceLine =
    trip.budgetMin || trip.budgetMax
      ? trip.budgetMin === trip.budgetMax
        ? `₹${trip.budgetMin ?? trip.budgetMax}`
        : `₹${trip.budgetMin ?? "?"} – ₹${trip.budgetMax ?? "?"}`
      : "Discuss on call";

  const myPending = joinRequests.find((r) => r.requester.id === user?.id && r.status === "PENDING");
  const joinReady = Boolean(user) && joinFetched;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/trips" className="text-sm font-semibold text-emerald-800 hover:underline">
          ← Trips
        </Link>
        {isOwner ? (
          <>
            <Link href="/activity#posted" className="text-sm font-semibold text-emerald-800 hover:underline">
              Activity →
            </Link>
            <Link href="/my-trips" className="text-sm font-semibold text-emerald-800 hover:underline">
              My trips →
            </Link>
          </>
        ) : user ? (
          <Link href="/activity#requests" className="text-sm font-semibold text-emerald-800 hover:underline">
            My activity →
          </Link>
        ) : null}
      </div>
      <h1 className="mt-4 text-3xl font-semibold text-emerald-950">{trip.title}</h1>
      <p className="mt-2 text-sm text-emerald-900/80">To: {trip.destinationLabel}</p>
      <p className="mt-1 text-sm text-emerald-900/80">From: {trip.pickupAddress}</p>
      {trip.description ? <p className="mt-4 whitespace-pre-wrap text-sm text-emerald-900">{trip.description}</p> : null}
      <p className="mt-4 text-sm text-emerald-900">
        {trip.numPeople} seat{trip.numPeople === 1 ? "" : "s"} · {priceLine}
      </p>
      <p className="text-xs text-emerald-800/70">
        Posted by {trip.traveler.name} · Status: {trip.status}
      </p>
      <p className="mt-1 text-xs text-emerald-800/60">
        {new Date(trip.startDate).toLocaleString()} – {new Date(trip.endDate).toLocaleString()}
      </p>

      {!isOwner && acceptingRequests ? (
        <section className="mt-8 rounded-2xl border-2 border-teal-500/30 bg-white p-6 shadow-md">
          <h2 className="text-lg font-bold text-slate-900">Request a seat</h2>
          <p className="mt-1 text-sm text-slate-600">
            Send a booking request to the host. They can accept or reject it. No payment happens in the app—agree details
            after they respond.
          </p>
          {!user ? (
            <div className="mt-4">
              <Link
                href={`/login?next=${encodeURIComponent(`/trips/${id}`)}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Log in to request
              </Link>
            </div>
          ) : (
            <form onSubmit={(e) => void submitJoinRequest(e)} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="seats-req">
                  Seats needed
                </label>
                <input
                  id="seats-req"
                  type="number"
                  min={1}
                  max={trip.numPeople}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500" htmlFor="req-msg">
                  Message (optional)
                </label>
                <textarea
                  id="req-msg"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={reqMessage}
                  onChange={(e) => setReqMessage(e.target.value)}
                  placeholder="Introduce yourself or ask a question"
                />
              </div>
              <button
                type="submit"
                disabled={joinBusy || Boolean(myPending) || !joinReady}
                className="w-full rounded-full bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {!joinReady ? "Loading…" : myPending ? "Request pending" : joinBusy ? "Sending…" : "Send request"}
              </button>
              {myPending ? (
                <button
                  type="button"
                  disabled={joinBusy}
                  onClick={() => void withdrawRequest(myPending.id)}
                  className="w-full text-sm font-semibold text-slate-600 hover:underline"
                >
                  Withdraw my request
                </button>
              ) : null}
              {reqFeedback ? <p className="text-sm text-teal-800">{reqFeedback}</p> : null}
            </form>
          )}
        </section>
      ) : null}

      {!isOwner && user && joinFetched && joinRequests.some((r) => r.requester.id === user.id) ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Your requests on this trip</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {joinRequests
              .filter((r) => r.requester.id === user.id)
              .map((r) => (
                <li key={r.id} className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                  <span className="font-medium">{r.seatsRequested} seat(s)</span> · {r.status}
                  {r.message ? <p className="mt-1 text-xs text-slate-600">{r.message}</p> : null}
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      {isOwner && !joinFetched ? (
        <p className="mt-8 text-sm text-slate-500">Loading booking requests…</p>
      ) : null}

      {isOwner && joinFetched ? (
        <section className="mt-8 rounded-2xl border border-emerald-900/15 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-emerald-950">Booking requests</h2>
          <p className="mt-1 text-xs text-emerald-800/80">
            Accept when you are happy to hold seats, or reject if it does not work. Accepted total cannot exceed seats
            offered ({trip.numPeople}).
          </p>
          {joinError ? <p className="mt-2 text-sm text-red-700">{joinError}</p> : null}
          {joinRequests.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No requests yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {joinRequests.map((r) => {
                const ph = r.requester.phone;
                const showPh = ph && phoneDigits(ph);
                return (
                  <li key={r.id} className="rounded-xl border border-slate-200 bg-slate-50/90 p-4">
                    <p className="font-semibold text-slate-900">{r.requester.name || "Guest"}</p>
                    <p className="text-xs text-slate-600">
                      {r.seatsRequested} seat(s) · <span className="font-medium">{r.status}</span>
                    </p>
                    {r.message ? <p className="mt-2 text-sm text-slate-700">{r.message}</p> : null}
                    {showPh && r.status === "ACCEPTED" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={telHref(ph!)}
                          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800"
                        >
                          Call
                        </a>
                        <a
                          href={whatsappHref(ph!, `Hi, about your accepted request on “${trip.title}”.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white"
                        >
                          WhatsApp
                        </a>
                      </div>
                    ) : null}
                    {r.status === "PENDING" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={joinBusy}
                          onClick={() => void setJoinStatus(r.id, "ACCEPTED")}
                          className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={joinBusy}
                          onClick={() => void setJoinStatus(r.id, "REJECTED")}
                          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {showTravelerContact ? (
        <div className="mt-8 rounded-2xl border border-emerald-900/15 bg-emerald-50/60 p-4">
          <h2 className="text-sm font-semibold text-emerald-950">Contact host</h2>
          <p className="mt-1 text-xs text-emerald-900/80">You can still reach out directly while a request is pending.</p>
          <p className="mt-3 font-mono text-sm text-emerald-950">{travelerPhone}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={telHref(travelerPhone!)}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-emerald-800/30 bg-white px-4 text-sm font-semibold text-emerald-950 hover:bg-emerald-50"
            >
              Call
            </a>
            <a
              href={whatsappHref(travelerPhone!, `Hi, regarding your trip: “${trip.title}”.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              WhatsApp
            </a>
          </div>
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This host has not added a phone number to their profile yet.
        </p>
      )}

      {isOwner ? (
        <div className="mt-8 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-950">Trip status</h2>
          <p className="mt-1 text-xs text-emerald-800/70">Use these when the trip is fully arranged or you want to close the listing.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void patchTripStatus("CONTACTED")}
              className="rounded-full border border-emerald-800/30 px-4 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-50"
            >
              Mark contacted
            </button>
            <button
              type="button"
              onClick={() => void patchTripStatus("BOOKED")}
              className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
            >
              Mark filled / closed
            </button>
            <button
              type="button"
              onClick={() => void patchTripStatus("CANCELLED")}
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel post
            </button>
          </div>
          {statusMsg ? <p className="mt-2 text-xs text-emerald-900">{statusMsg}</p> : null}
        </div>
      ) : null}
    </main>
  );
}
