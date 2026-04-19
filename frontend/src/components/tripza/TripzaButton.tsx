import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "outline";

const base =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 active:scale-[0.99] sm:min-h-10";

const variants: Record<Variant, string> = {
  primary:
    "bg-[#14B8A6] text-white shadow-sm hover:bg-[#0d9f90] focus-visible:ring-[#14B8A6]/35",
  accent:
    "bg-[#F97316] text-white shadow-sm hover:bg-[#ea580c] focus-visible:ring-[#F97316]/35",
  outline:
    "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400/25",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function TripzaButton({ variant = "primary", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  href: string;
};

export function TripzaButtonLink({ variant = "primary", className = "", href, ...rest }: ButtonLinkProps) {
  return <Link href={href} className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
