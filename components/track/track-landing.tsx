import Link from "next/link"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TrackLanding() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.92_0.03_165)_0%,_transparent_55%),linear-gradient(180deg,_oklch(0.98_0.01_250)_0%,_oklch(0.95_0.02_250)_100%)]"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-start px-6 pb-24 pt-16 md:pt-24">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <Wallet className="h-4 w-4" />
          Wise Track
        </p>
        <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          Know where your money goes.
        </h1>
        <p className="mt-4 max-w-lg text-base text-muted-foreground md:text-lg">
          Personal expense tracking — categories, monthly totals, and a clear
          picture of your spend. No org membership required.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/sign-up">Start tracking</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
