import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import NavShell from "@/components/layout/nav-shell";
import { TrackRootProviders } from "@track/components/track-theme";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { getDefaultMetadata } from "@/lib/seo"

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = getDefaultMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={workSans.variable} suppressHydrationWarning>
      <body
        className="track-app min-h-dvh bg-background font-sans text-foreground"
        suppressHydrationWarning
      >
        <OrganizationJsonLd />
        <TrackRootProviders>
          <NavShell />
          {children}
        </TrackRootProviders>
        <Toaster />
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
