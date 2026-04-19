import Link from "next/link";
import { ReviewsClient } from "./reviews-client";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function ReviewsPage({ searchParams }: Props) {
  const sp = searchParams ? await searchParams : {};
  const raw = sp.vehicleId;
  const vehicleId = typeof raw === "string" ? raw : Array.isArray(raw) ? (raw[0] ?? "") : "";

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-12">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Reviews</h1>
          <p className="mt-2 text-sm text-slate-600">
            Public list by vehicle. Submit reviews only after a booking is marked{" "}
            <code className="rounded bg-teal-50 px-1">COMPLETED</code> (admin can set this for testing).
          </p>
        </div>
        <Link href="/" className="text-sm font-semibold text-teal-700 hover:text-slate-900">
          ← Home
        </Link>
      </div>
      <ReviewsClient initialVehicleId={vehicleId} />
    </main>
  );
}
