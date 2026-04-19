type Props = {
  rows?: number;
  className?: string;
};

export function ListSkeleton({ rows = 6, className = "" }: Props) {
  return (
    <ul className={`mt-8 space-y-3 ${className}`} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="h-5 w-2/3 max-w-md rounded bg-slate-200" />
          <div className="mt-3 h-4 w-1/2 max-w-sm rounded bg-slate-100" />
          <div className="mt-2 h-3 w-1/3 rounded bg-slate-100" />
        </li>
      ))}
    </ul>
  );
}

export function VehicleCardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: cards }).map((_, i) => (
        <li
          key={i}
          className="flex h-full animate-pulse flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm"
        >
          <div className="h-3 w-16 rounded bg-slate-200" />
          <div className="mt-3 h-6 w-3/4 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full rounded bg-slate-100" />
          <div className="mt-6 h-4 w-24 rounded bg-slate-100" />
          <div className="mt-auto flex gap-2 border-t border-slate-100 pt-4">
            <div className="h-10 flex-1 rounded-xl bg-slate-100" />
            <div className="h-10 flex-1 rounded-xl bg-slate-100" />
            <div className="h-10 flex-1 rounded-xl bg-slate-200" />
          </div>
        </li>
      ))}
    </ul>
  );
}
