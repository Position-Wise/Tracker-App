import { ArrowRight, LineChart, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function DualProductPreview({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid overflow-hidden rounded-3xl border border-border bg-card shadow-xl md:grid-cols-2",
        className
      )}
    >
      <AdvisoryPreview framed={false} className="h-full" />
      <TrackPreview
        framed={false}
        className="h-full border-t border-border md:border-l md:border-t-0"
      />
    </div>
  )
}

export function AdvisoryPreview({
  className,
  framed = true,
}: {
  className?: string
  framed?: boolean
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex flex-col bg-primary p-6 text-primary-foreground",
        framed && "rounded-3xl border border-white/10 shadow-xl",
        className
      )}
    >
      <div className="flex h-7 items-center justify-between text-xs">
        <span className="uppercase tracking-wide text-primary-foreground/70">
          Advisory
        </span>
        <span className="rounded-full bg-emerald-400/15 px-2 py-1 font-medium text-emerald-300">
          Personalized
        </span>
      </div>
      <p className="mt-5 text-xs uppercase tracking-wide text-primary-foreground/60">
        Plan posture
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">Balanced growth</p>
      <p className="mt-1 text-sm text-emerald-300">Aligned to a 7-year horizon</p>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/10 p-3">
          <p className="text-[10px] uppercase text-primary-foreground/60">Risk band</p>
          <p className="mt-1 font-semibold">Moderate</p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3">
          <p className="text-[10px] uppercase text-primary-foreground/60">
            Next review
          </p>
          <p className="mt-1 font-semibold">This quarter</p>
        </div>
      </div>
      <p className="mt-auto flex items-start gap-2 pt-5 text-sm leading-relaxed text-primary-foreground/80">
        <LineChart className="mt-0.5 size-4 shrink-0 text-emerald-300" />
        Guidance sized to your surplus — not a generic model portfolio.
      </p>
    </div>
  )
}

export function TrackPreview({
  className,
  framed = true,
}: {
  className?: string
  framed?: boolean
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex flex-col bg-card p-6",
        framed && "rounded-3xl border border-border shadow-xl",
        className
      )}
    >
      <div className="flex h-7 items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">Wise Track</p>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground">
          August 2026
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
      <p className="mt-auto pt-5 text-xs leading-relaxed text-muted-foreground">
        Net surplus{" "}
        <span className="font-semibold tabular-nums text-foreground">₹53,820</span>
        <span className="mx-1.5 text-border">·</span>
        Card bills counted as debt payoff, not spend
      </p>
    </div>
  )
}

export function HeroBento({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid grid-cols-2 gap-3 sm:gap-4 lg:h-135 lg:grid-cols-6 lg:grid-rows-6",
        className
      )}
    >
      <div className="flex flex-col justify-between rounded-3xl bg-secondary p-5 sm:p-6 lg:col-span-2 lg:row-span-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-secondary-foreground/70">
          Two products
        </p>
        <div>
          <p className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            2
          </p>
          <p className="mt-1 text-sm leading-snug text-secondary-foreground">
            One home for spend and advice.
          </p>
        </div>
      </div>

      <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-primary p-5 text-primary-foreground sm:p-6 lg:col-span-4 lg:row-span-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-primary-foreground/60">
              Current surplus
            </p>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
              ₹53,820
            </p>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
            Personalized
          </span>
        </div>
        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-primary-foreground/60">
              Plan posture
            </p>
            <p className="mt-1 font-medium">Balanced growth · Moderate risk</p>
          </div>
          <p className="text-xs text-primary-foreground/70">Position Wise</p>
        </div>
      </div>

      <div className="relative col-span-2 flex flex-col overflow-hidden rounded-3xl bg-(--brand-navy-deep) p-5 text-primary-foreground sm:p-6 lg:col-span-2 lg:col-start-1 lg:row-span-4 lg:row-start-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-300">
          Wise Track
        </p>
        <p className="mt-3 text-xl font-semibold tracking-tight">
          Know where every rupee goes.
        </p>
        <div className="mt-6 space-y-4">
          {[
            { name: "Household", pct: 38 },
            { name: "Travel", pct: 22 },
            { name: "Dining", pct: 16 },
            { name: "Other", pct: 12 },
          ].map((row) => (
            <div key={row.name} className="space-y-1.5">
              <div className="flex justify-between text-xs text-primary-foreground/80">
                <span>{row.name}</span>
                <span className="tabular-nums">{row.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-300"
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-auto pt-8 text-sm leading-relaxed text-primary-foreground/70">
          Categories, accounts, and honest surplus — without the spreadsheet.
        </p>
      </div>

      <div className="col-span-2 flex flex-col justify-between rounded-3xl bg-(--brand-navy-muted) p-5 text-primary-foreground sm:p-6 lg:col-span-4 lg:col-start-3 lg:row-span-2 lg:row-start-3">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary-foreground/70">
            Advisory
          </p>
          <LineChart className="size-4 text-emerald-300" />
        </div>
        <div>
          <p className="text-xl font-semibold tracking-tight sm:text-2xl">
            Guidance built around you.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
            Risk first · Your timeline · You stay in control — not a generic model portfolio.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-5 sm:p-6 lg:col-span-2 lg:col-start-3 lg:row-span-2 lg:row-start-5">
        <div className="flex items-start justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            This month
          </p>
          <TrendingUp className="size-4 text-accent" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            ₹42,180
          </p>
          <p className="mt-2 text-xs text-accent">Income ₹96,000 · net positive</p>
        </div>
      </div>

      <div className="flex flex-col justify-between rounded-3xl bg-accent p-5 text-accent-foreground sm:p-6 lg:col-span-2 lg:col-start-5 lg:row-span-2 lg:row-start-5">
        <ArrowRight className="size-5 opacity-80" />
        <div>
          <p className="text-3xl font-semibold tracking-tight sm:text-4xl">Free</p>
          <p className="mt-1 text-sm leading-snug text-accent-foreground/85">
            Expense tracker. Smart UI. No wait.
          </p>
        </div>
      </div>
    </div>
  )
}
