"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <main className="page-wrap">
        <p className="text-center text-sm text-slate-500">Loading profile…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page-wrap">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile</h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
          Log in to see your account. You can still browse vehicles and trips without an account.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/login?next=/profile" className="btn-primary">
            Log in
          </Link>
          <Link href="/register" className="btn-secondary">
            Create account
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-wrap">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Profile</h1>
      <p className="mt-2 text-sm text-slate-600">Your account on Tripza.</p>

      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-1 font-semibold text-slate-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</dt>
            <dd className="mt-1 font-medium text-teal-800">{user.role}</dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-6">
          <Link href="/vehicles" className="text-sm font-semibold text-teal-700 hover:underline">
            Browse vehicles →
          </Link>
          <Link href="/trips" className="text-sm font-semibold text-teal-700 hover:underline">
            View trips →
          </Link>
          <Link href="/activity" className="text-sm font-semibold text-teal-700 hover:underline">
            Activity (requests and posted trips) →
          </Link>
          <Link href="/my-trips" className="text-sm font-semibold text-teal-700 hover:underline">
            My posted trips →
          </Link>
          {(user.role === "PROVIDER" || user.role === "ADMIN") && (
            <Link href="/provider/vehicles/new" className="text-sm font-semibold text-teal-700 hover:underline">
              Add a vehicle →
            </Link>
          )}
          <button type="button" onClick={() => void logout()} className="mt-2 text-left text-sm font-semibold text-slate-600 hover:underline">
            Log out
          </button>
        </div>
      </div>
    </main>
  );
}
