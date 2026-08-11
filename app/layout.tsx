import type { Metadata } from "next";
import { headers } from "next/headers";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import NavShell from "@/components/layout/nav-shell";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Position Wise Advisory",
  description:
    "Position Wise Advisory is your place to start investing smartly",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers()
  const product = headerStore.get("x-product")
  const isTrack = product === "track"

  return (
    <html lang="en" className={workSans.variable} suppressHydrationWarning>
      <body
        className={
          isTrack
            ? "min-h-dvh bg-background font-sans text-foreground"
            : "bg-background font-sans text-foreground py-16 md:py-0"
        }
        suppressHydrationWarning
      >
        <NavShell product={product} />
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
