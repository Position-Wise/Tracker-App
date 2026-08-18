import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SiteFooter } from "@web/components/site-footer"
import { buildShareMetadata } from "@/lib/seo"
import { resolveTrackPlatformRedirectUrl } from "@track/lib/resolve-track-platform-url"

export const metadata: Metadata = buildShareMetadata({
  title: "Structured Market Insights",
  description:
    "How Position Wise Advisory turns noisy markets into testable frameworks — regimes, liquidity, risk, and capital positioning.",
  path: "/insights",
})

export default async function InsightsPage() {
  const trackHomeUrl = await resolveTrackPlatformRedirectUrl("/")

  return (
    <>
      <main className="min-h-screen bg-background px-6 pb-32 pt-24 text-foreground md:pb-16">
        <section className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Structured Market Insights
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Position Wise Advisory focuses on turning noisy markets into
            testable, repeatable frameworks. This space outlines how we think
            about risk, time, and capital positioning.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Request access
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/advisory">Explore advisory</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Market Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  We prioritise structure first: regimes, liquidity, and
                  positioning, before narratives. Every view is mapped to a
                  clear hypothesis and invalidation level.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Risk as a First-Class Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Position sizing, drawdown bands, and capital buckets are
                  defined before entries. Strategy comes with explicit risk
                  budgets, not soft guidelines.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter trackHomeUrl={trackHomeUrl} />
    </>
  )
}
