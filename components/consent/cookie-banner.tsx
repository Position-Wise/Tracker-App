"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  readCookieConsent,
  writeCookieConsent,
  type CookieConsent,
} from "@/lib/cookie-consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(readCookieConsent() === null)
  }, [])

  function choose(value: CookieConsent) {
    writeCookieConsent(value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-body"
      className="fixed inset-x-4 bottom-36 z-100 mx-auto max-w-lg rounded-2xl border border-border bg-card p-4 shadow-lg sm:bottom-6 md:right-6 md:left-auto md:mx-0"
    >
      <p id="cookie-banner-title" className="text-sm font-semibold text-foreground">
        Cookies on this site
      </p>
      <p
        id="cookie-banner-body"
        className="mt-2 text-sm leading-relaxed text-muted-foreground"
      >
        We use essential cookies to keep you signed in, and privacy-friendly
        analytics to understand what is working. See the{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
          privacy policy
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => choose("all")}>
          Got it
        </Button>
      </div>
    </div>
  )
}
