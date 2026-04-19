import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/trips", label: "Trips" },
  { href: "/activity", label: "Activity" },
  { href: "/my-trips", label: "My trips" },
  { href: "/provider/vehicles/new", label: "Add vehicle" },
  { href: "/post-trip", label: "Post trip" },
  { href: "/profile", label: "Profile" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-lg font-bold tracking-tight text-white">
              <span className="text-brand-primary">Trip</span>
              <span className="text-brand-accent">za</span>
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Find a vehicle, list yours, or post a shared trip. Everything runs on simple phone and WhatsApp contact—there
              are no payments inside this app.
            </p>
            <p className="mt-4 text-xs text-slate-400">Always confirm details and safety directly with the other person.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick links</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-flex min-h-10 items-center text-slate-200 underline-offset-4 hover:text-brand-primary hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-800 pt-8 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Tripza. Built for travelers and local drivers.</p>
        </div>
      </div>
    </footer>
  );
}
