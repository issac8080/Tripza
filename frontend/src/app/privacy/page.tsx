import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-slate-700">
      <Link href="/" className="font-semibold text-teal-700 hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-slate-900">Privacy</h1>
      <p className="mt-4">
        We process account data (name, email or phone) to operate authentication and bookings. If you accept analytics
        cookies, Firebase Analytics may collect usage events as described in Google&apos;s documentation.
      </p>
      <p className="mt-4">
        Publish a GDPR / DPDP-aligned policy and data retention schedule before marketing to a wide audience. This page
        is a temporary notice for beta launch.
      </p>
    </main>
  );
}
