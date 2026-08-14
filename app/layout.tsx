import type { Metadata } from "next";
import { headers } from "next/headers";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import NavShell from "@/components/layout/nav-shell";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { resolveTrackPlatformRedirectUrl } from "@/lib/resolve-track-platform-url"

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Position Wise Advisory",
  description:
    "Personalized investment advice and a free expense tracker. See where your money goes, then grow it with guidance built around you.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers()
  const product = headerStore.get("x-product")
  const isTrack = product === "track"
  const trackHomeUrl = isTrack
    ? "/"
    : await resolveTrackPlatformRedirectUrl("/")

  return (
    <html lang="en" className={workSans.variable} suppressHydrationWarning>
      <body
        className={
          isTrack
            ? "min-h-dvh bg-background font-sans text-foreground"
            : "bg-background font-sans text-foreground pt-16 pb-28 md:py-0"
        }
        suppressHydrationWarning
      >
        <NavShell product={product} trackHomeUrl={trackHomeUrl} />
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
