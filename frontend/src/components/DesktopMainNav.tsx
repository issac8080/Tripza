"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV, navPathMatches } from "@/lib/site-nav";

export function DesktopMainNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex lg:gap-1" aria-label="Primary">
      {MAIN_NAV.map((item) => {
        const active = navPathMatches(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-11 min-w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 lg:min-w-[5rem] lg:px-2.5 ${
              active
                ? "bg-brand-primary/10 text-slate-900 ring-1 ring-brand-primary/25"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="whitespace-nowrap text-[12px] font-semibold leading-tight lg:text-[13px]">{item.label}</span>
            {item.hint ? (
              <span className="line-clamp-2 max-w-[6.5rem] text-center text-[9px] leading-tight text-slate-500 lg:max-w-[7.5rem] lg:text-[10px]">
                {item.hint}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
