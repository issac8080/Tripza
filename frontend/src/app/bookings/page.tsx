import { Suspense } from "react";
import { BookingsClient } from "./bookings-client";

export default function BookingsPage() {
  return (
    <Suspense
      fallback={
        <main className="page-wrap">
          <p className="text-center text-sm text-slate-500" aria-live="polite">
            Loading bookings…
          </p>
        </main>
      }
    >
      <BookingsClient />
    </Suspense>
  );
}
