"use client"

import { useId } from "react"
import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  AnalyticsSection,
  DeltaPill,
  EmptyNote,
  StatTile,
} from "@track/components/analytics/analytics-section"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import type { PacePoint, SpendingPace } from "@track/lib/analytics"

export function AnalyticsPace({
  pace,
  currency,
  prevLabel,
  className,
}: {
  pace: SpendingPace
  currency: string
  prevLabel: string
  className?: string
}) {
  const gradientId = useId().replace(/:/g, "")
  const { formatMoney, hidden } = useTrackMoney()
  const { timing } = pace
  const hasData = pace.spentSoFar > 0 || pace.previousTotal > 0

  return (
    <AnalyticsSection
      id="pace"
      index={3}
      title="Spending Pace"
      question="How quickly am I spending?"
      className={className}
      action={
        <p className="text-xs text-muted-foreground">
          {timing.isFuture
            ? "Month hasn't started"
            : timing.isCurrent
              ? `Day ${timing.elapsedDays} of ${timing.daysInMonth}`
              : `${timing.daysInMonth} days`}
        </p>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 @2xl:grid-cols-4">
        <StatTile
          label="Spent so far"
          value={formatMoney(pace.spentSoFar, currency)}
          delta={
            hidden ? null : (
              <DeltaPill change={pace.paceChange} invert />
            )
          }
          hint={`vs ${prevLabel} same day`}
        />
        <StatTile
          label="Daily average"
          value={formatMoney(Math.round(pace.dailyAverage), currency)}
          hint="per day this month"
        />
        <StatTile
          label={timing.isCurrent ? "Projected month-end" : "Month total"}
          value={formatMoney(Math.round(pace.projectedTotal), currency)}
          hint={`${prevLabel}: ${formatMoney(pace.previousTotal, currency)}`}
        />
        <StatTile
          label="Safe to spend"
          value={
            pace.safeDailySpend != null
              ? formatMoney(Math.round(pace.safeDailySpend), currency)
              : "—"
          }
          hint={
            pace.safeDailySpend != null
              ? `per day · ${timing.daysLeft} days left`
              : timing.isCurrent
                ? "Log income to unlock"
                : "Month closed"
          }
        />
      </div>

      <div className="mt-5 h-56 w-full lg:h-64">
        {hasData ? (
          <PaceChart
            points={pace.points}
            currency={currency}
            gradientId={gradientId}
            prevLabel={prevLabel}
          />
        ) : (
          <EmptyNote>Add expenses to see how fast the month is moving.</EmptyNote>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <LegendSwatch className="bg-(--track-chart)" label="This month" />
        <LegendSwatch
          className="border-t-2 border-dashed border-(--track-chart-muted) bg-transparent"
          label={prevLabel}
        />
        {timing.isCurrent ? (
          <LegendSwatch
            className="border-t-2 border-dotted border-(--track-chart) bg-transparent"
            label="Projected"
          />
        ) : null}
      </div>
    </AnalyticsSection>
  )
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-0.5 w-4 rounded-full ${className}`} />
      {label}
    </span>
  )
}

function PaceChart({
  points,
  currency,
  gradientId,
  prevLabel,
}: {
  points: PacePoint[]
  currency: string
  gradientId: string
  prevLabel: string
}) {
  const { formatMoney } = useTrackMoney()
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--track-chart)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--track-chart)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis hide domain={[0, "auto"]} />
        <Tooltip
          cursor={{
            stroke: "var(--track-chart)",
            strokeDasharray: "4 4",
            strokeOpacity: 0.45,
          }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const point = payload[0]?.payload as PacePoint | undefined
            if (!point) return null
            return (
              <div className="rounded-xl border border-border bg-card px-3 py-2 text-xs shadow-sm">
                <p className="text-muted-foreground">Day {point.day}</p>
                {point.current != null ? (
                  <p className="mt-1 font-medium tabular-nums">
                    {formatMoney(point.current, currency)}
                    <span className="ml-1 font-normal text-muted-foreground">
                      this month
                    </span>
                  </p>
                ) : point.projected != null ? (
                  <p className="mt-1 font-medium tabular-nums">
                    {formatMoney(Math.round(point.projected), currency)}
                    <span className="ml-1 font-normal text-muted-foreground">
                      projected
                    </span>
                  </p>
                ) : null}
                {point.previous != null ? (
                  <p className="mt-0.5 tabular-nums text-muted-foreground">
                    {formatMoney(point.previous, currency)} in {prevLabel}
                  </p>
                ) : null}
              </div>
            )
          }}
        />
        <Line
          type="monotone"
          dataKey="previous"
          stroke="var(--track-chart-muted)"
          strokeWidth={1.75}
          strokeDasharray="5 5"
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="current"
          stroke="var(--track-chart)"
          strokeWidth={2.25}
          fill={`url(#${gradientId})`}
          dot={false}
          connectNulls={false}
          activeDot={{
            r: 4,
            fill: "var(--track-chart)",
            stroke: "var(--card)",
            strokeWidth: 2,
          }}
        />
        <Line
          type="linear"
          dataKey="projected"
          stroke="var(--track-chart)"
          strokeWidth={1.75}
          strokeDasharray="2 4"
          strokeOpacity={0.8}
          dot={false}
          activeDot={false}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
