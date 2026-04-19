import { AuthNav } from "@/components/AuthNav";
import { BrandLogo } from "@/components/tripza/BrandLogo";
import { DesktopMainNav } from "@/components/DesktopMainNav";
import { MobileDrawerNav } from "@/components/MobileDrawerNav";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 pt-[env(safe-area-inset-top)] shadow-soft backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        <BrandLogo />

        <DesktopMainNav />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <AuthNav />
          </div>
          <MobileDrawerNav />
        </div>
      </div>
    </header>
  );
}
