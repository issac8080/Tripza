import Link from "next/link";

export default function ProviderPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">For drivers & operators</h1>
      <p className="mt-3 text-slate-600">
        List a vehicle so travelers can discover it, and browse trips if you want to offer a ride. Everything is arranged by
        phone or WhatsApp—there is no in-app payment.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/provider/vehicles/new"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-400"
        >
          <h2 className="text-lg font-semibold text-slate-900">Add vehicle</h2>
          <p className="mt-2 text-sm text-slate-600">Name, registration, type, location, and contact number.</p>
        </Link>
        <Link
          href="/trips"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-400"
        >
          <h2 className="text-lg font-semibold text-slate-900">Trips</h2>
          <p className="mt-2 text-sm text-slate-600">See trips people posted and message them if you can help.</p>
        </Link>
      </div>
      <Link href="/" className="mt-10 inline-block text-sm font-semibold text-teal-700 hover:text-slate-900">
        ← Home
      </Link>
    </main>
  );
}
