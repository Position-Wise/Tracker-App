import type { Metadata } from "next"
import Link from "next/link"
import { BrandLogo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { buildShareMetadata } from "@/lib/seo"

export const metadata: Metadata = {
  ...buildShareMetadata({
    title: "Page not found",
    description:
      "This page does not exist. Return home, explore advisory, or start tracking for free.",
    path: "/",
  }),
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center px-6 py-24 text-center">
      <BrandLogo className="h-8 w-auto" />
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.22em] text-accent">
        404
      </p>
      <h1 className="mt-3 max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
        This page is not on the map.
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        The link may be outdated, or the page may have moved. Start from home or
        pick the path that fits today.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/advisory">Explore advisory</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/sign-up">Start tracking free</Link>
        </Button>
      </div>
    </main>
  )
}
