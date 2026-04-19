"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function HomeSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams();
    if (q) {
      params.set("q", q);
    }
    router.push(`/vehicles${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <form onSubmit={onSubmit} className="relative w-full max-w-xl">
      <label htmlFor="tripza-home-search" className="sr-only">
        Search vehicles by place or route
      </label>
      <div className="flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-soft sm:flex-row sm:items-center sm:gap-0 sm:p-1.5 sm:pr-1.5">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3-3" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="tripza-home-search"
            type="search"
            autoComplete="off"
            placeholder="Where do you need a ride?"
            className="input-field mt-0 min-h-11 border-0 bg-transparent pl-10 shadow-none ring-0 focus:border-0 focus:ring-0 sm:min-h-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn-primary shrink-0 rounded-xl sm:w-auto sm:min-w-[7.5rem] sm:rounded-xl"
        >
          Search
        </button>
      </div>
    </form>
  );
}
