"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MAIN_NAV, navPathMatches } from "@/lib/site-nav";
import { AuthNav } from "@/components/AuthNav";

export function MobileDrawerNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const panelId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <div className="flex md:hidden">
      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-soft transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/25"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={close}
          />
          <div
            id={panelId}
            className="relative ml-auto flex h-full w-[min(100%,20rem)] flex-col border-l border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">Tripza</span>
              <button
                ref={closeBtnRef}
                type="button"
                className="rounded-lg px-2 py-1 text-sm font-medium text-brand-primary hover:bg-brand-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35"
                onClick={close}
              >
                Close
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-3">
              <ul className="space-y-1">
                {MAIN_NAV.map((item) => {
                  const active = navPathMatches(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex min-h-12 flex-col justify-center rounded-xl px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary/25 ${
                          active ? "bg-brand-primary/10 text-slate-950 ring-1 ring-brand-primary/20" : "text-slate-900 hover:bg-slate-50"
                        }`}
                        onClick={close}
                      >
                        <span className="text-[15px] font-medium">{item.label}</span>
                        {item.hint ? <span className="text-xs text-slate-500">{item.hint}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="border-t border-slate-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <AuthNav variant="mobile" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
