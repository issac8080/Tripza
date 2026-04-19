import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { FirebaseInit } from "@/components/FirebaseInit";
import { AuthProvider } from "@/components/AuthProvider";
import { CookieConsent } from "@/components/CookieConsent";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { TrustNotice } from "@/components/TrustNotice";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tripza — vehicles & shared trips",
    template: "%s · Tripza",
  },
  description:
    "Browse vehicles, list your own, and share trips. Contact drivers and hosts by phone or WhatsApp—no in-app payments.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tripza",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Tripza",
    title: "Tripza — vehicles & shared trips",
    description: "Browse vehicles, list your own, and share trips. Contact by phone or WhatsApp.",
  },
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-dvh bg-slate-50 text-slate-900 antialiased`}>
        <AuthProvider>
          <div className="flex min-h-dvh flex-col">
            <FirebaseInit />
            <OnboardingBanner />
            <SiteHeader />
            <TrustNotice />
            <div className="flex flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
            <MobileBottomNav />
            <CookieConsent />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
