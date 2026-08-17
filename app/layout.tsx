import type { Metadata } from "next";
import { headers } from "next/headers";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import NavShell from "@/components/layout/nav-shell";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { CookieBanner } from "@/components/consent/cookie-banner";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { getDefaultMetadata } from "@/lib/seo"
import { resolveTrackPlatformRedirectUrl } from "@/lib/resolve-track-platform-url"

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = getDefaultMetadata();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers()
  const product = headerStore.get("x-product")
  const isTrack = product === "track"
  const [trackHomeUrl, trackSignUpUrl] = isTrack
    ? ["/", "/sign-up"]
    : await Promise.all([
        resolveTrackPlatformRedirectUrl("/"),
        resolveTrackPlatformRedirectUrl("/sign-up"),
      ])

  return (
    <html lang="en-IN" className={workSans.variable} suppressHydrationWarning>
      <body
        className={
          isTrack
            ? "min-h-dvh bg-background font-sans text-foreground"
            : "bg-background font-sans text-foreground pt-16 pb-40 md:py-0"
        }
        suppressHydrationWarning
      >
        <OrganizationJsonLd />
        <NavShell
          product={product}
          trackHomeUrl={trackHomeUrl}
          trackSignUpUrl={trackSignUpUrl}
        />
        {children}
        <Toaster />
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
