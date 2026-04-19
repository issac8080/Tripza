"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TRAVELER" | "PROVIDER">("TRAVELER");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/vehicles");
    }
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() && !phone.trim()) {
      setError("Provide email or phone.");
      return;
    }
    try {
      await register({
        name: name.trim(),
        password,
        role,
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      router.replace("/vehicles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <main className="page-wrap flex min-h-[60vh] flex-col justify-center">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Create your account</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
            Log in
          </Link>
        </p>
        <form onSubmit={(e) => void submit(e)} className="card-elevated mt-8 space-y-5">
          <div>
            <label className="label-field" htmlFor="reg-name">
              Full name
            </label>
            <input
              id="reg-name"
              required
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="reg-role">
              I am a
            </label>
            <select
              id="reg-role"
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value as "TRAVELER" | "PROVIDER")}
            >
              <option value="TRAVELER">Traveler — book vehicles</option>
              <option value="PROVIDER">Provider — list vehicles</option>
            </select>
          </div>
          <div>
            <label className="label-field" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="reg-phone">
              Phone
            </label>
            <input
              id="reg-phone"
              type="tel"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="reg-password">
              Password (min 8 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn-primary">
            Sign up
          </button>
        </form>
      </div>
    </main>
  );
}
