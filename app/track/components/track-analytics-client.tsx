"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { ActivityFlowChart } from "@track/components/activity-flow-chart"
import { MonthSwitcher } from "@track/components/month-switcher"
import { SpendInsightChart } from "@track/components/spend-insight-chart"
import { useTrackLedger } from "@track/components/track-ledger-provider"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import { Button } from "@/components/ui/button"
import { monthNetChangePct } from "@track/lib/insight-series"
import { formatMonthLabel, splitFormattedMoney } from "@track/lib/month"
import type {
  ExpenseWithCategory,
  InsightLedgerPoint,
} from "@track/lib/types"

type TrackAnalyticsClientProps = {
  monthKey: string
  currency: string
  expenseTotal: number
  incomeTotal: number
  expenses: ExpenseWithCategory[]
  incomes: { title: string; amount: number }[]
  insightLedger: InsightLedgerPoint[]
}

export function TrackAnalyticsClient({
  monthKey,
  currency,
  expenseTotal,
  incomeTotal,
  expenses,
  incomes,
  insightLedger,
}: TrackAnalyticsClientProps) {
  const { formatMoney, hidden } = useTrackMoney()
  const { totalLiquidBalance, ready } = useTrackLedger()
  const monthLabel = formatMonthLabel(monthKey)
  const changePct = useMemo(
    () => monthNetChangePct(monthKey, insightLedger),
    [insightLedger, monthKey]
  )

  const balanceParts = splitFormattedMoney(
    formatMoney(ready ? totalLiquidBalance : 0, currency)
  )

  return (
    <div className="mx-auto w-full max-w-lg space-y-8">
      <header className="relative flex min-h-10 items-center justify-between">
        <Button
          asChild
          variant="secondary"
          size="icon"
          className="absolute left-0 rounded-full"
        >
          <Link href="/app" aria-label="Back to overview">
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="text-lg font-semibold tracking-tight ml-24">Analytics</h1>
        <div className="absolute right-0">
          <MonthSwitcher
            monthKey={monthKey}
            basePath="/app/analytics"
            short
            expenses={expenses}
            currency={currency}
          />
        </div>
      </header>

      <section className="">
        <p className="text-sm font-medium text-primary">Your balance</p>
        <div className="mt-1 flex flex-wrap items-end gap-3">
          <p className="font-semibold tracking-tight">
            <span className="text-4xl tabular-nums sm:text-5xl">
              {balanceParts.head}
            </span>
            {balanceParts.fraction ? (
              <span className="text-2xl tabular-nums text-muted-foreground sm:text-3xl">
                {balanceParts.fraction}
              </span>
            ) : null}
          </p>
          {!hidden && changePct != null ? (
            <span className="mb-1.5 inline-flex rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              {changePct > 0 ? "+" : ""}
              {changePct}%
            </span>
          ) : null}
        </div>
      </section>

      <section className="track-panel">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 pb-0">
          <h2 className="text-base font-semibold">Activity</h2>
          <p className="text-sm text-muted-foreground">{monthLabel}</p>
        </div>
        <ActivityFlowChart
          className="p-4 sm:p-5"
          expenses={expenses}
          expenseTotal={expenseTotal}
          incomes={incomes}
          incomeTotal={incomeTotal}
          currency={currency}
          monthKey={monthKey}
          insightLedger={insightLedger}
        />
      </section>

      <section className="track-panel p-5 sm:p-6">
        <SpendInsightChart
          monthKey={monthKey}
          currency={currency}
          ledger={insightLedger}
        />
      </section>
    </div>
  )
}
