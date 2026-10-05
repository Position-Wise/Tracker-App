"use client"

import {
  Bar,
  ComposedChart,
  Cell,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import {
  AnalyticsSection,
  DeltaPill,
  EmptyNote,
} from "@track/components/analytics/analytics-section"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import type { CategoryChange, MonthTrendPoint } from "@track/lib/analytics"
import { cn } from "@/lib/utils"

export function AnalyticsChanges({
  trend,
  changes,
  currency,
  compareLabel,
  className,
}: {
  trend: MonthTrendPoint[]
  changes: CategoryChange[]
  currency: string
  compareLabel: string
  className?: string
}) {
  const { formatMoney, hidden } = useTrackMoney()
  const hasTrend = trend.some((p) => p.expense > 0 || p.income > 0)
  const risers = changes.filter((c) => c.delta > 0).slice(0, 4)
  const fallers = changes.filter((c) => c.delta < 0).slice(0, 4)
  const average =
    trend.length > 1
      ? trend.slice(0, -1).reduce((s, p) => s + p.expense, 0) / (trend.length - 1)
      : 0

  return (
    <AnalyticsSection
      id="changes"
      index={5}
      title="Spending Changes"
      question="What's changing?"
      className={className}
      action={
        average > 0 ? (
          <p className="text-xs text-muted-foreground">
            {trend.length - 1}-mo avg{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatMoney(Math.round(average), currency)}
            </span>
          </p>
        ) : null
      }
    >
      <div className="h-44 w-full">
        {hasTrend ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trend} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip
                cursor={{ fill: "var(--secondary)", opacity: 0.5 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const point = payload[0]?.payload as MonthTrendPoint | undefined
                  if (!point) return null
                  return (
                    <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-sm">
                      <p className="text-muted-foreground">{point.label}</p>
                      <p className="mt-1 font-medium tabular-nums">
                        {formatMoney(point.expense, currency)}
                        <span className="ml-1 font-normal text-muted-foreground">spent</span>
                      </p>
                      <p className="mt-0.5 tabular-nums text-muted-foreground">
                        {formatMoney(point.income, currency)} income
                      </p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="expense" radius={[8, 8, 4, 4]} maxBarSize={44}>
                {trend.map((point) => (
                  <Cell
                    key={point.key}
                    fill="var(--track-chart)"
                    fillOpacity={point.isSelected ? 1 : 0.3}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="income"
                stroke="#14b8a6"
                strokeWidth={1.75}
                dot={{ r: 2.5, fill: "#14b8a6", strokeWidth: 0 }}
                activeDot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <EmptyNote>Your month-by-month trend will appear here.</EmptyNote>
        )}
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-(--track-chart)" /> Spend
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-teal-500" /> Income
        </span>
      </div>

      <div className="mt-5 border-t border-border/60 pt-4">
        <p className="text-xs text-muted-foreground">
          By category · {compareLabel}
        </p>
        {changes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No category movement to compare yet.
          </p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <ChangeList
              title="Going up"
              rows={risers}
              currency={currency}
              hidden={hidden}
              tone="up"
            />
            <ChangeList
              title="Going down"
              rows={fallers}
              currency={currency}
              hidden={hidden}
              tone="down"
            />
          </div>
        )}
      </div>
    </AnalyticsSection>
  )
}

function ChangeList({
  title,
  rows,
  currency,
  hidden,
  tone,
}: {
  title: string
  rows: CategoryChange[]
  currency: string
  hidden: boolean
  tone: "up" | "down"
}) {
  const { formatMoney } = useTrackMoney()
  const Icon = tone === "up" ? ArrowUpRight : ArrowDownRight
  return (
    <div className="min-w-0">
      <p
        className={cn(
          "mb-2 flex items-center gap-1 text-xs font-medium",
          tone === "up"
            ? "text-rose-700 dark:text-rose-400"
            : "text-emerald-700 dark:text-emerald-400"
        )}
      >
        <Icon className="size-3.5" />
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate">{row.name}</p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {formatMoney(row.previous, currency)} →{" "}
                  {formatMoney(row.current, currency)}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-medium tabular-nums">
                  {row.delta > 0 ? "+" : "−"}
                  {formatMoney(Math.abs(row.delta), currency)}
                </p>
                {hidden ? null : <DeltaPill change={row.pct} invert />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
