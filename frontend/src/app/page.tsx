import { apiGet } from "@/lib/api";
import { HomeSearchBar } from "@/components/tripza/HomeSearchBar";
import { TripzaButtonLink } from "@/components/tripza/TripzaButton";
import { TripzaCard } from "@/components/tripza/TripzaCard";

async function loadApiHealth() {
  try {
    return await apiGet<{ ok: boolean }>("/api/v1/health");
  } catch {
    return null;
  }
}

const features = [
  {
    title: "Vehicles",
    body: "Browse listings, open details, and contact the host by phone or WhatsApp. No checkout or card payment in the app.",
  },
  {
    title: "List yours",
    body: "Drivers can add a vehicle in minutes so travelers can discover it and reach out directly.",
  },
  {
    title: "Shared trips",
    body: "Post where you are going and how many seats you have—or browse trips others posted and message them to join.",
  },
];

export default async function Home() {
  const health = await loadApiHealth();

  return (
    <main className="pb-10">
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/90">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(20,184,166,0.18),transparent)]" />
        <div className="pointer-events-none absolute right-0 top-24 h-64 w-64 rounded-full bg-gradient-to-bl from-brand-accent/15 to-transparent blur-3xl sm:top-32" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" aria-hidden />
              Tripza
              <span className="font-normal text-slate-400">·</span>
              <span className="text-brand-primary">Travel, simplified</span>
            </p>
            <h1 className="mt-7 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              Find a ride, list a vehicle, or share a trip.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg">
              A calm, modern marketplace. You always coordinate with a real person—call or WhatsApp—when you are ready.
            </p>

            <div className="mx-auto mt-10 flex w-full max-w-xl flex-col items-stretch gap-3">
              <HomeSearchBar />
              <p className="text-center text-xs text-slate-500">Search by place, route, or landmark</p>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
              <TripzaButtonLink href="/vehicles" variant="primary" className="w-full sm:w-auto sm:min-w-[10.5rem]">
                Browse vehicles
              </TripzaButtonLink>
              <TripzaButtonLink href="/post-trip" variant="accent" className="w-full sm:w-auto sm:min-w-[10.5rem]">
                Post a trip
              </TripzaButtonLink>
              <TripzaButtonLink
                href="/provider/vehicles/new"
                variant="outline"
                className="w-full sm:w-auto sm:min-w-[10.5rem]"
              >
                Add a vehicle
              </TripzaButtonLink>
            </div>

            <p className="mt-8 text-xs text-slate-500">
              Service status:{" "}
              <span className={health?.ok ? "font-semibold text-brand-primary" : "font-semibold text-amber-600"}>
                {health?.ok ? "Connected" : "Check your connection or API URL"}
              </span>
            </p>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
            {features.map((h) => (
              <TripzaCard key={h.title} as="article" padding="sm" className="text-left backdrop-blur-sm transition hover:border-brand-primary/25">
                <h2 className="text-sm font-bold text-slate-900">{h.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{h.body}</p>
              </TripzaCard>
            ))}
          </div>
        </div>
      </section>

      <section className="page-wrap">
        <TripzaCard as="div" padding="md" className="mx-auto max-w-2xl border-dashed border-slate-300/90 bg-slate-50/60 text-center">
          <p className="text-sm font-semibold text-slate-800">Running your own deployment</p>
          <p className="mt-2 text-sm text-slate-600">
            Set{" "}
            <code className="rounded-lg bg-white px-1.5 py-0.5 text-xs text-slate-800 shadow-sm ring-1 ring-slate-200">
              NEXT_PUBLIC_API_URL
            </code>{" "}
            and{" "}
            <code className="rounded-lg bg-white px-1.5 py-0.5 text-xs text-slate-800 shadow-sm ring-1 ring-slate-200">
              NEXT_PUBLIC_SITE_URL
            </code>{" "}
            so the app can reach your API.
          </p>
        </TripzaCard>
      </section>
    </main>
  );
}
