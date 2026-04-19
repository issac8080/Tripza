"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
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
      setError("Enter email or phone.");
      return;
    }
    try {
      await login({
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        password,
      });
      router.replace("/vehicles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <main className="page-wrap flex min-h-[60vh] flex-col justify-center">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Welcome back</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base">
          Sign in with email or phone and your password. New here?{" "}
          <Link href="/register" className="font-semibold text-teal-700 underline-offset-2 hover:underline">
            Create an account
          </Link>
          .
        </p>
        <form onSubmit={(e) => void submit(e)} className="card-elevated mt-8 space-y-5">
          <div>
            <label className="label-field" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="login-phone">
              Phone (if no email)
            </label>
            <input
              id="login-phone"
              type="tel"
              className="input-field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="btn-primary">
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
