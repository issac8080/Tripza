"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/components/AuthProvider";
import { authHeaders } from "@/lib/http";

export default function NewVehiclePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [type, setType] = useState("TRAVELLER");
  const [vehicleName, setVehicleName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!loading && user && user.role !== "PROVIDER" && user.role !== "ADMIN") {
      router.replace("/profile");
    }
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    if (!user) {
      router.push("/login?next=/provider/vehicles/new");
      return;
    }
    const brand = vehicleName.trim();
    const model = registrationNumber.trim() || "—";
    if (brand.length < 1) {
      setError("Enter a vehicle name.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/v1/vehicles`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          type,
          brand,
          model,
          seatingCapacity: 7,
          baseAddress: baseAddress.trim(),
          contactPhone: contactPhone.trim() || undefined,
          pricePerKm: 0,
          pricePerDay: 0,
          minimumCharge: 0,
          ac: true,
          driverIncluded: true,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const v = (await res.json()) as { id: string };
      setMsg(`Vehicle saved. You can open it below.`);
      router.push(`/vehicles/${v.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  if (loading || !user) {
    return <p className="px-4 py-16 text-center text-sm text-slate-500">Loading…</p>;
  }
  if (user.role !== "PROVIDER" && user.role !== "ADMIN") {
    return (
      <main className="page-wrap">
        <h1 className="text-2xl font-bold text-slate-900">Add vehicle</h1>
        <p className="mt-3 text-sm text-slate-600">Provider accounts can list vehicles. You are signed in as {user.role}.</p>
        <Link href="/profile" className="mt-6 inline-block text-sm font-semibold text-brand-primary hover:underline">
          Go to profile →
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-24 pt-8 sm:px-6 sm:pt-10 md:pb-12">
      <Link href="/provider" className="text-sm font-semibold text-brand-primary hover:underline">
        ← Driver hub
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Add a vehicle</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Keep it simple: travelers see this on the vehicles list and contact you on the phone number you add.
      </p>
      <form
        onSubmit={(e) => void submit(e)}
        className="mt-8 space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-8"
      >
        <div>
          <label className="label-field" htmlFor="nv-name">
            Vehicle name
          </label>
          <input
            id="nv-name"
            required
            className="input-field mt-1.5"
            value={vehicleName}
            onChange={(e) => setVehicleName(e.target.value)}
            placeholder="e.g. White Force Traveller"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="nv-reg">
            Registration number
          </label>
          <input
            id="nv-reg"
            className="input-field mt-1.5"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            placeholder="Optional but recommended"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="nv-type">
            Type
          </label>
          <select
            id="nv-type"
            className="select-field mt-1.5 !w-full"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="BIKE">Bike</option>
            <option value="CAR">Car</option>
            <option value="JEEP">Jeep</option>
            <option value="TRAVELLER">Traveller</option>
            <option value="BUS">Bus</option>
          </select>
        </div>
        <div>
          <label className="label-field" htmlFor="nv-base">
            Base location
          </label>
          <input
            id="nv-base"
            required
            minLength={3}
            className="input-field mt-1.5"
            value={baseAddress}
            onChange={(e) => setBaseAddress(e.target.value)}
            placeholder="Town or area you usually start from"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="nv-phone">
            Phone / WhatsApp
          </label>
          <input
            id="nv-phone"
            required
            minLength={8}
            maxLength={20}
            className="input-field mt-1.5"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="Number travelers should call"
          />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {msg ? <p className="text-sm font-medium text-brand-primary">{msg}</p> : null}
        <button type="submit" className="btn-primary">
          Save vehicle
        </button>
      </form>
    </main>
  );
}
