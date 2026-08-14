import Link from "next/link"
import { ArrowRight, Check, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"

const points = [
  "Log expense, income, transfer, or card bill in seconds",
  "See the month: totals, categories, and real surplus",
  "Card bills stay as debt payoff — not fake spend",
  "Private to you. No organisation membership required.",
] as const

export function TrackLanding() {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.92_0.03_165)_0%,transparent_55%),linear-gradient(180deg,oklch(0.98_0.01_250)_0%,oklch(0.95_0.02_250)_100%)]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-16 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:pt-24">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Wallet className="h-4 w-4" />
            Wise Track
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-semibold text-accent">
              Free
            </span>
          </p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Know where your money goes.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
            A smart, easy expense tracker for everyday money — categories,
            accounts, and a clear month view. Built by Position Wise Advisory.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-muted-foreground">
            {points.map((point) => (
              <li key={point} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Start tracking free
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-xl sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">This month</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">August 2026</p>
            </div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
              Live preview
            </span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">₹42,180</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">₹96,000</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              { name: "Household", pct: 38 },
              { name: "Travel", pct: 22 },
              { name: "Dining", pct: 16 },
            ].map((row) => (
              <div key={row.name} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span>{row.name}</span>
                  <span className="tabular-nums text-muted-foreground">{row.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Net surplus{" "}
            <span className="font-semibold tabular-nums text-foreground">₹53,820</span>
          </p>
        </div>
      </div>
    </main>
  )
}
