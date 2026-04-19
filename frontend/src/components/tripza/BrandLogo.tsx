import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  /** Compact: icon only. Default shows wordmark beside icon. */
  variant?: "full" | "compact";
  className?: string;
};

export function BrandLogo({ variant = "full", className = "" }: BrandLogoProps) {
  return (
    <Link
      href="/"
      aria-label="Tripza — home"
      className={`group flex min-w-0 shrink-0 items-center gap-2.5 leading-tight ${className}`}
    >
      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl shadow-soft ring-1 ring-slate-200/60 sm:h-11 sm:w-11">
        <Image
          src="/tripza-logo.png"
          alt=""
          fill
          className="object-cover"
          sizes="44px"
          priority
        />
      </span>
      {variant === "full" ? (
        <span className="min-w-0 flex flex-col gap-0.5">
          <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            <span className="text-[#14B8A6]">Trip</span>
            <span className="bg-gradient-to-r from-[#F97316] to-amber-500 bg-clip-text text-transparent">za</span>
          </span>
          <span className="hidden text-[11px] font-medium text-slate-500 sm:block">Vehicles · Trips · Direct contact</span>
        </span>
      ) : null}
    </Link>
  );
}
