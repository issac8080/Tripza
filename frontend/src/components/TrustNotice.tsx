/**
 * Short, consistent trust & transparency copy for a contact-first marketplace.
 */
export function TrustNotice() {
  return (
    <aside
      className="mx-auto max-w-6xl px-4 py-3 sm:px-6"
      aria-label="Safety and how this app works"
    >
      <div className="rounded-xl border border-slate-200/90 bg-slate-50/95 px-4 py-3 text-xs leading-relaxed text-slate-600 shadow-sm sm:text-[13px]">
        <p className="font-semibold text-slate-800">Before you travel</p>
        <ul className="mt-2 list-inside list-disc space-y-1 marker:text-brand-primary">
          <li>There is no payment inside this app—agree price, route, and pickup only with the other person.</li>
          <li>Verify the vehicle, driver, and ID in a way you are comfortable with before you pay anyone.</li>
          <li>Seat requests on trips are for coordination; accepting a request does not replace your own checks.</li>
        </ul>
      </div>
    </aside>
  );
}
