"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "@/lib/config";
import { getStoredToken, setStoredToken } from "@/lib/authToken";

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
  bookingId?: string | null;
  tripPostId?: string | null;
};

export function RealtimeChat() {
  const [token, setToken] = useState("");
  const [withUserId, setWithUserId] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [tripPostId, setTripPostId] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("");
  const socketRef = useRef<Socket | null>(null);

  const scope = useMemo((): { bookingId: string } | { tripPostId: string } | null => {
    if (bookingId.trim()) {
      return { bookingId: bookingId.trim() };
    }
    if (tripPostId.trim()) {
      return { tripPostId: tripPostId.trim() };
    }
    return null;
  }, [bookingId, tripPostId]);

  useEffect(() => {
    setToken(getStoredToken());
  }, []);

  const persistToken = () => {
    setStoredToken(token.trim());
    setStatus("Token saved in this browser.");
  };

  const loadThread = useCallback(async () => {
    if (!token.trim() || !withUserId.trim() || !scope) {
      setStatus("Need token, peer user id, and booking or trip id.");
      return;
    }
    const params = new URLSearchParams();
    params.set("withUserId", withUserId.trim());
    if ("bookingId" in scope && scope.bookingId) {
      params.set("bookingId", scope.bookingId);
    } else if ("tripPostId" in scope && scope.tripPostId) {
      params.set("tripPostId", scope.tripPostId);
    }
    const res = await fetch(`${API_URL}/api/v1/messages/thread?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token.trim()}` },
    });
    if (!res.ok) {
      setStatus(await res.text());
      return;
    }
    const data = (await res.json()) as { items: ChatMessage[] };
    setMessages(data.items);
    setStatus("Thread loaded.");
  }, [token, withUserId, scope]);

  useEffect(() => {
    if (!token.trim() || !scope) {
      return;
    }
    const socket = io(API_URL, {
      auth: { token: token.trim() },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", scope, (err?: Error) => {
        if (err) {
          setStatus(`Join failed: ${err.message}`);
        } else {
          setStatus("Socket joined room.");
        }
      });
    });

    socket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          return prev;
        }
        return [...prev, msg];
      });
    });

    socket.on("connect_error", (err) => {
      setStatus(`Socket error: ${err.message}`);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, scope]);

  const send = async () => {
    if (!token.trim() || !withUserId.trim() || !scope || !draft.trim()) {
      setStatus("Missing fields.");
      return;
    }
    const res = await fetch(`${API_URL}/api/v1/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiverId: withUserId.trim(),
        body: draft.trim(),
        ...scope,
      }),
    });
    if (!res.ok) {
      setStatus(await res.text());
      return;
    }
    setDraft("");
    await loadThread();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Realtime chat</h1>
        <p className="mt-2 text-sm text-slate-600">
          Uses REST to send + history, Socket.IO for live delivery.
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm font-medium text-slate-900">JWT</label>
        <textarea
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          rows={3}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste bearer token (from /auth/login)"
        />
        <button
          type="button"
          onClick={persistToken}
          className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Save token locally
        </button>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">Peer user id</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={withUserId}
            onChange={(e) => setWithUserId(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">Booking id (optional vs trip)</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">Trip post id</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={tripPostId}
            onChange={(e) => setTripPostId(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => void loadThread()}
            className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-teal-50"
          >
            Load thread
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs text-slate-500">{status}</p>
        <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-lg bg-teal-50/70 p-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-md bg-white px-3 py-2 text-sm shadow-sm">
              <p className="text-xs text-slate-500">{m.senderId}</p>
              <p className="text-slate-900">{m.body}</p>
            </div>
          ))}
          {messages.length === 0 ? <p className="text-sm text-slate-500">No messages yet.</p> : null}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message"
          />
          <button
            type="button"
            onClick={() => void send()}
            className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
