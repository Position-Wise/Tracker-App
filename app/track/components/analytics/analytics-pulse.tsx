"use client"

import {
  AnalyticsSection,
  DeltaPill,
  StatTile,
} from "@track/components/analytics/analytics-section"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import type { FinancialPulse, PulseHealth } from "@track/lib/analytics"
import { splitFormattedMoney } from "@track/lib/month"
import { cn } from "@/lib/utils"

const HEALTH_COPY: Record<
  PulseHealth,
  { label: string; detail: string; className: string }
> = {
  healthy: {
    label: "Healthy",
    detail: "You're keeping a solid share of what you earn.",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
  steady: {
    label: "Steady",
    detail: "Income covers spending with a little room to spare.",
    className: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  tight: {
    label: "Tight",
    detail: "Nearly all income is going out — watch the next few days.",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  overspending: {
    label: "Overspending",
    detail: "Spending is ahead of the income logged this month.",
    className: "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  },
  idle: {
    label: "No activity",
    detail: "Log income or expenses to see how the month is going.",
    className: "bg-secondary text-muted-foreground",
  },
}

export function AnalyticsPulse({
  pulse,
  balance,
  currency,
  prevLabel,
  className,
}: {
  pulse: FinancialPulse
  balance: number
  currency: string
  prevLabel: string
  className?: string
}) {
  const { formatMoney, hidden } = useTrackMoney()
  const health = HEALTH_COPY[pulse.health]
  const balanceParts = splitFormattedMoney(formatMoney(balance, currency))
  const usedPct =
    pulse.income > 0 ? Math.round((pulse.expense / pulse.income) * 100) : null
  const vs = `vs ${prevLabel}`

  return (
    <AnalyticsSection
      id="pulse"
      index={1}
      title="Financial Pulse"
      question="How am I doing?"
      className={className}
      action={
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            health.className
          )}
        >
          {health.label}
        </span>
      }
    >
      <div className="grid gap-6 @4xl:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)] @4xl:items-center">
        <div className="min-w-0">
          <p className="text-sm font-medium text-primary dark:text-(--track-chart)">
            Your balance
          </p>
          <p className="mt-1 font-semibold tracking-tight">
            <span className="text-4xl tabular-nums sm:text-5xl">
              {balanceParts.head}
            </span>
            {balanceParts.fraction ? (
              <span className="text-2xl tabular-nums text-muted-foreground sm:text-3xl">
                {balanceParts.fraction}
              </span>
            ) : null}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{health.detail}</p>

          <div className="mt-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Income spent</span>
              <span className="tabular-nums">
                {hidden ? "••" : usedPct != null ? `${usedPct}%` : "—"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  usedPct != null && usedPct > 100
                    ? "bg-destructive"
                    : "bg-(--track-chart)"
                )}
                style={{ width: `${Math.min(100, usedPct ?? 0)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 @lg:grid-cols-3">
          <StatTile
            label="Income"
            value={formatMoney(pulse.income, currency)}
            delta={hidden ? null : <DeltaPill change={pulse.incomeChange} />}
            hint={vs}
          />
          <StatTile
            label="Spent"
            value={formatMoney(pulse.expense, currency)}
            delta={
              hidden ? null : <DeltaPill change={pulse.expenseChange} invert />
            }
            hint={vs}
          />
          <StatTile
            label="Net saved"
            value={formatMoney(pulse.net, currency)}
            delta={hidden ? null : <DeltaPill change={pulse.netChange} />}
            hint={vs}
          />
          <StatTile
            label="Savings rate"
            value={
              hidden
                ? "••"
                : pulse.savingsRate != null
                  ? `${pulse.savingsRate}%`
                  : "—"
            }
            hint={pulse.savingsRate != null ? "of income kept" : "No income yet"}
          />
          <StatTile
            label="Card dues"
            value={formatMoney(pulse.cardDebt, currency)}
            hint="Outstanding on cards"
          />
          <StatTile
            label="Card bills paid"
            value={formatMoney(pulse.cardBillsPaid, currency)}
            hint="Debt paid · not spend"
          />
        </div>
      </div>
    </AnalyticsSection>
  )
}
