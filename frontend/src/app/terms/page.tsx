import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of use",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-sm leading-relaxed text-slate-700">
      <Link href="/" className="font-semibold text-brand-primary hover:underline">
        ← Home
      </Link>
      <h1 className="mt-6 text-2xl font-semibold text-slate-900">Terms of use</h1>
      <p className="mt-4">
        Tripza is provided as a marketplace platform connecting travelers and vehicle providers. By using this
        service you agree that listings, pricing, and trip execution are between you and the other party; the platform
        does not guarantee availability, roadworthiness, or regulatory compliance unless explicitly stated in a future
        agreement.
      </p>
      <p className="mt-4">
        Replace this page with counsel-reviewed terms before scaling revenue. Until then, treat this as a placeholder
        for early testers only.
      </p>
    </main>
  );
}
