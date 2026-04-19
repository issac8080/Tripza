"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV, navPathMatches } from "@/lib/site-nav";

function Icon({ label }: { label: string }) {
  const cls = "h-5 w-5 shrink-0";
  switch (label) {
    case "Home":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 10.5L12 3l9 7.5M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "Vehicles":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 11l2-4h14l2 4v6H3v-6z" strokeLinejoin="round" />
          <circle cx="7.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="17" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "Trips":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 19h16M7 16V9l5-5 5 5v7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 16h6" strokeLinecap="round" />
        </svg>
      );
    case "Activity":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 4h16v16H4z" strokeLinejoin="round" />
          <path d="M8 9h8M8 13h5" strokeLinecap="round" />
        </svg>
      );
    case "My trips":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
      );
    case "Add Vehicle":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" strokeLinecap="round" />
        </svg>
      );
    case "Post Trip":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" />
        </svg>
      );
    case "Profile":
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20a7 7 0 0114 0" strokeLinecap="round" />
        </svg>
      );
  }
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-8px_28px_rgba(15,23,42,0.08)] backdrop-blur-md md:hidden"
      aria-label="Mobile primary"
    >
      <ul className="mx-auto flex max-w-full items-stretch justify-start gap-0.5 overflow-x-auto overflow-y-hidden px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MAIN_NAV.map((item) => {
          const active = navPathMatches(pathname, item.href);
          return (
            <li key={item.href} className="min-w-[3.35rem] shrink-0 sm:min-w-[3.75rem]">
              <Link
                href={item.href}
                className={`flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[9px] font-semibold leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25 sm:text-[10px] ${
                  active ? "text-brand-primary-dark" : "text-slate-600"
                }`}
              >
                <span className={active ? "text-brand-primary" : "text-slate-500"}>
                  <Icon label={item.label} />
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
