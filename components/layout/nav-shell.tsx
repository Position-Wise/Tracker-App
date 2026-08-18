"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/Nav"
import TrackShell from "@track/components/track-shell"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"

const NAV_EXCLUDED_PREFIXES = ["/sign-in", "/sign-up"] as const

function shouldShowAuthenticatedNav(pathname: string) {
  return !NAV_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

type NavShellProps = {
  /** From proxy `x-product` — must come from the server so SSR matches client. */
  product?: string | null
  /** Absolute Wise Track URL for marketing nav (server-resolved). */
  trackHomeUrl?: string
  trackSignUpUrl?: string
}

export default function NavShell({
  product = null,
  trackHomeUrl,
  trackSignUpUrl,
}: NavShellProps) {
  const pathname = usePathname()

  if (product === "track") {
    return (
      <ThemeProvider enabled>
        <TrackShell />
      </ThemeProvider>
    )
  }

  if (!shouldShowAuthenticatedNav(pathname)) {
    return null
  }

  return (
    <ThemeProvider enabled={false}>
      <AuthProvider>
        <Navbar trackHomeUrl={trackHomeUrl} trackSignUpUrl={trackSignUpUrl} />
      </AuthProvider>
    </ThemeProvider>
  )
}
