"use client"

import { useId, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  buildInsightSeries,
  INSIGHT_RANGE_OPTIONS,
  rangePeriodLabel,
  type InsightRange,
} from "@track/lib/insight-series"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import type { InsightLedgerPoint, InsightSeriesPoint } from "@track/lib/types"
import { cn } from "@/lib/utils"

type ChartMode = "trend" | "flow"

type SpendInsightChartProps = {
  monthKey: string
  currency: string
  ledger: InsightLedgerPoint[]
  className?: string
}

function periodChangePct(points: InsightSeriesPoint[]): number | null {
  if (points.length < 4) return null
  const mid = Math.floor(points.length / 2)
  const recent = points.slice(mid).reduce((sum, p) => sum + p.expense, 0)
  const prior = points.slice(0, mid).reduce((sum, p) => sum + p.expense, 0)
  if (prior <= 0) return recent > 0 ? 100 : null
  return Math.round(((recent - prior) / prior) * 100)
}

function insightCopy({
  range,
  expenseTotal,
  incomeTotal,
  changePct,
  mode,
}: {
  range: InsightRange
  expenseTotal: number
  incomeTotal: number
  changePct: number | null
  mode: ChartMode
}): string {
  const period = rangePeriodLabel(range)
  if (mode === "flow") {
    if (incomeTotal <= 0 && expenseTotal <= 0) {
      return `No income or spend logged ${period} yet.`
    }
    if (incomeTotal <= 0) {
      return `Spend is moving without recorded income ${period}.`
    }
    const pct = Math.round((expenseTotal / incomeTotal) * 100)
    if (pct >= 100) {
      return `Expenses have used all income ${period} — you're into the red.`
    }
    if (pct >= 70) {
      return `${pct}% of income has already flowed into expenses ${period}.`
    }
    return `${pct}% of income has gone to expenses ${period}; the rest is still free.`
  }

  if (expenseTotal <= 0) {
    return `No spending yet ${period} — your trend will show up here.`
  }
  if (changePct != null && changePct <= -15) {
    return `Spending cooled vs the earlier ${range === "yearly" ? "months" : "days"}. Keep that pace.`
  }
  if (changePct != null && changePct >= 25) {
    return `Spend is running hotter lately — check your top categories.`
  }
  if (incomeTotal > 0 && expenseTotal / incomeTotal >= 0.7) {
    return `You've used most of your income ${period}. A light stretch helps.`
  }
  if (incomeTotal > 0) {
    return `Spend is tracking steadily against income ${period}.`
  }
  return `Cumulative spend ${period} — log more to sharpen the trend.`
}

function TrendChart({
  points,
  currency,
  gradientId,
}: {
  points: InsightSeriesPoint[]
  currency: string
  gradientId: string
}) {
  const { formatMoney } = useTrackMoney()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={points}
        margin={{ top: 8, right: 4, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-navy)" stopOpacity={0.35} />
            <stop
              offset="100%"
              stopColor="var(--brand-navy)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          interval="preserveStartEnd"
          minTickGap={28}
        />
        <YAxis hide domain={[0, "auto"]} />
        <Tooltip
          cursor={{
            stroke: "var(--brand-navy)",
            strokeDasharray: "4 4",
            strokeOpacity: 0.45,
          }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const point = payload[0]?.payload as InsightSeriesPoint | undefined
            if (!point) return null
            return (
              <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-sm">
                <p className="text-muted-foreground">{point.label}</p>
                <p className="mt-1 font-medium tabular-nums">
                  {formatMoney(point.cumulativeExpense, currency)}
                  <span className="ml-1 font-normal text-muted-foreground">
                    cumulative
                  </span>
                </p>
                {point.expense > 0 ? (
                  <p className="mt-0.5 tabular-nums text-muted-foreground">
                    +{formatMoney(point.expense, currency)} here
                  </p>
                ) : null}
              </div>
            )
          }}
        />
        <Area
          type="monotone"
          dataKey="cumulativeExpense"
          stroke="var(--brand-navy)"
          strokeWidth={2.25}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{
            r: 4,
            fill: "var(--brand-navy)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function IncomeFlowChart({
  expenseTotal,
  incomeTotal,
  currency,
}: {
  expenseTotal: number
  incomeTotal: number
  currency: string
}) {
  const { formatMoney } = useTrackMoney()
  const base = Math.max(incomeTotal, expenseTotal, 1)
  const expensePct = Math.min(100, (expenseTotal / base) * 100)
  const incomePct = Math.min(100, (incomeTotal / base) * 100)
  const remaining = Math.max(incomeTotal - expenseTotal, 0)
  const overspend = Math.max(expenseTotal - incomeTotal, 0)

  return (
    <div className="flex h-full flex-col justify-center gap-5 px-0.5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Income</span>
          <span className="font-medium tabular-nums">
            {formatMoney(incomeTotal, currency)}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary/35 transition-[width] duration-500"
            style={{ width: `${incomePct}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Expenses from income</span>
          <span className="font-medium tabular-nums">
            {formatMoney(expenseTotal, currency)}
          </span>
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-secondary">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
            style={{ width: `${incomePct}%` }}
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500",
              overspend > 0 ? "bg-destructive" : "bg-primary"
            )}
            style={{ width: `${expensePct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {overspend > 0
            ? `Over by ${formatMoney(overspend, currency)}`
            : `Left ${formatMoney(remaining, currency)}`}
        </span>
        <span className="tabular-nums">
          {incomeTotal > 0
            ? `${Math.round((expenseTotal / incomeTotal) * 100)}% used`
            : expenseTotal > 0
              ? "No income base"
              : "—"}
        </span>
      </div>
    </div>
  )
}

export function SpendInsightChart({
  monthKey,
  currency,
  ledger,
  className,
}: SpendInsightChartProps) {
  const gradientId = useId().replace(/:/g, "")
  const { formatMoney } = useTrackMoney()
  const [range, setRange] = useState<InsightRange>("monthly")
  const [mode, setMode] = useState<ChartMode>("trend")

  const { points, expenseTotal, incomeTotal } = buildInsightSeries(
    range,
    monthKey,
    ledger
  )
  const changePct = periodChangePct(points)
  const rangeLabel =
    INSIGHT_RANGE_OPTIONS.find((o) => o.value === range)?.label ?? "Monthly"

  const metricLabel =
    mode === "flow"
      ? "of income spent"
      : changePct != null
        ? "period change"
        : incomeTotal > 0
          ? "of income spent"
          : rangePeriodLabel(range)

  const metricValue =
    mode === "flow" || changePct == null
      ? incomeTotal > 0
        ? `${Math.round((expenseTotal / incomeTotal) * 100)}%`
        : formatMoney(expenseTotal, currency)
      : `${changePct > 0 ? "+" : ""}${changePct}%`

  const rising =
    mode === "flow"
      ? expenseTotal > incomeTotal * 0.7
      : changePct == null
        ? expenseTotal > 0
        : changePct > 0

  const hasTrend = points.some((p) => p.cumulativeExpense > 0)
  const hasFlow = expenseTotal > 0 || incomeTotal > 0
  const copy = insightCopy({
    range,
    expenseTotal,
    incomeTotal,
    changePct,
    mode,
  })

  function cycleMode() {
    setMode((prev) => (prev === "trend" ? "flow" : "trend"))
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Insights</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "trend" ? "Spend trend" : "Income → expenses"}
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5">
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {metricValue}
            </p>
            {(mode === "trend" ? hasTrend : hasFlow) ? (
              rising ? (
                <TrendingUp className="size-4 text-primary" aria-hidden />
              ) : (
                <TrendingDown
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
              )
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{metricLabel}</p>
        </div>
      </div>

      <div className="relative mt-4 h-36 w-full sm:h-40">
        {mode === "trend" ? (
          hasTrend ? (
            <TrendChart
              points={points}
              currency={currency}
              gradientId={gradientId}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl bg-secondary/40">
              <p className="text-sm text-muted-foreground">
                Add expenses to see your spend curve.
              </p>
            </div>
          )
        ) : hasFlow ? (
          <IncomeFlowChart
            expenseTotal={expenseTotal}
            incomeTotal={incomeTotal}
            currency={currency}
          />
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl bg-secondary/40">
            <p className="text-sm text-muted-foreground">
              Add income or expenses to compare the flow.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted-foreground">
          {copy}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="rounded-full border-border bg-card font-normal text-muted-foreground"
              >
                {rangeLabel}
                <ChevronDown className="size-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuRadioGroup
                value={range}
                onValueChange={(value) => setRange(value as InsightRange)}
              >
                {INSIGHT_RANGE_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className="rounded-md focus:bg-primary focus:text-primary-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                  >
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-1.5">
            {(["trend", "flow"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-label={
                  item === "trend" ? "Spend trend chart" : "Income flow chart"
                }
                aria-current={mode === item}
                onClick={() => setMode(item)}
                className={cn(
                  "size-1.5 rounded-full transition-colors",
                  mode === item ? "bg-primary" : "bg-border"
                )}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon-xs"
            className="rounded-full border-border bg-card"
            onClick={cycleMode}
            aria-label={
              mode === "trend"
                ? "Show income to expense flow"
                : "Show spend trend"
            }
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
