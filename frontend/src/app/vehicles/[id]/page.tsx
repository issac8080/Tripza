import { Suspense } from "react";
import { VehicleDetail } from "./vehicle-detail";

type Props = { params: Promise<{ id: string }> };

export default async function VehiclePage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <main className="page-wrap">
          <p className="text-center text-sm text-slate-500">Loading…</p>
        </main>
      }
    >
      <VehicleDetail id={id} />
    </Suspense>
  );
}
