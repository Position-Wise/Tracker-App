"use client"

import Link from "next/link"
import {
  AnalyticsSection,
  formatCompactMoney,
} from "@track/components/analytics/analytics-section"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import type { SpendCalendar } from "@track/lib/analytics"
import { buildExpensesHref } from "@track/lib/expense-browse"
import { formatDayHeading, WEEKDAY_LETTERS_MON } from "@track/lib/month"
import { cn } from "@/lib/utils"

export function AnalyticsCalendar({
  monthKey,
  calendar,
  currency,
  className,
}: {
  monthKey: string
  calendar: SpendCalendar
  currency: string
  className?: string
}) {
  const { formatMoney, hidden } = useTrackMoney()
  const weekdayPeak = Math.max(...calendar.weekdays.map((w) => w.average), 0)

  return (
    <AnalyticsSection
      id="calendar"
      index={6}
      title="Spending Calendar"
      question="When am I spending?"
      className={className}
      action={<HeatLegend />}
    >
      <div className="grid gap-6 @3xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div role="grid" aria-label="Daily spend heatmap" className="grid grid-cols-7 gap-1.5">
          {WEEKDAY_LETTERS_MON.map((letter, i) => (
            <div
              key={`${letter}-${i}`}
              aria-hidden
              className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {letter}
            </div>
          ))}
          {calendar.cells.map((cell) => {
            if (!cell.inMonth) {
              return <div key={cell.key} aria-hidden className="aspect-square" />
            }
            const strong = cell.intensity > 0.55
            const label = `${formatDayHeading(cell.key)}: ${
              cell.count > 0 ? formatMoney(cell.total, currency) : "no spend"
            }`
            return (
              <Link
                key={cell.key}
                role="gridcell"
                href={buildExpensesHref({ monthKey, day: cell.key })}
                aria-label={label}
                title={label}
                className={cn(
                  "group relative flex aspect-square flex-col items-center justify-center rounded-lg text-xs font-medium tabular-nums transition-transform hover:scale-[1.06] hover:ring-2 hover:ring-(--track-chart)/60",
                  cell.count === 0 && "bg-secondary/50",
                  cell.isFuture && "opacity-40",
                  cell.isToday && "ring-2 ring-(--track-chart)",
                  strong ? "text-white dark:text-(--brand-navy-black)" : "text-foreground/85"
                )}
                style={
                  cell.count > 0
                    ? {
                        backgroundColor: `rgb(var(--track-chart-heat) / ${0.14 + cell.intensity * 0.86})`,
                      }
                    : undefined
                }
              >
                <span>{cell.day}</span>
                {cell.count > 0 && !hidden ? (
                  <span
                    className={cn(
                      "hidden text-[9px] font-normal leading-none lg:block",
                      strong
                        ? "text-white/80 dark:text-(--brand-navy-black)/75"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatCompactMoney(cell.total, currency)}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </div>

        <div className="min-w-0 space-y-5">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Average by weekday</p>
            <ul className="space-y-1.5">
              {calendar.weekdays.map((row) => {
                const pct = weekdayPeak > 0 ? (row.average / weekdayPeak) * 100 : 0
                const busiest = row.label === calendar.busiestWeekday && row.average > 0
                return (
                  <li key={row.label} className="flex items-center gap-2.5 text-xs">
                    <span
                      className={cn(
                        "w-8 shrink-0",
                        busiest ? "font-semibold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {row.label}
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <span
                        className="block h-full rounded-full bg-(--track-chart) transition-[width] duration-500"
                        style={{ width: `${pct}%`, opacity: busiest ? 1 : 0.55 }}
                      />
                    </span>
                    <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                      {hidden ? "••" : formatCompactMoney(row.average, currency)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <dl className="grid grid-cols-2 gap-2.5">
            <MiniStat label="No-spend days" value={String(calendar.noSpendDays)} />
            <MiniStat label="Days with spend" value={String(calendar.activeDays)} />
            <MiniStat
              label="Biggest day"
              value={
                calendar.maxDay ? formatMoney(calendar.maxDay.total, currency) : "—"
              }
              hint={calendar.maxDay ? formatDayHeading(calendar.maxDay.key) : undefined}
            />
            <MiniStat
              label="Weekend share"
              value={
                hidden
                  ? "••"
                  : calendar.weekendShare != null
                    ? `${calendar.weekendShare}%`
                    : "—"
              }
              hint="Sat + Sun"
            />
          </dl>
        </div>
      </div>
    </AnalyticsSection>
  )
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="track-panel-elevated min-w-0 px-3 py-2.5">
      <dt className="truncate text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-base font-semibold tabular-nums">{value}</dd>
      {hint ? (
        <dd className="truncate text-[11px] text-muted-foreground">{hint}</dd>
      ) : null}
    </div>
  )
}

function HeatLegend() {
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span>Less</span>
      {[0.14, 0.4, 0.65, 1].map((alpha) => (
        <span
          key={alpha}
          className="size-2.5 rounded-[3px]"
          style={{ backgroundColor: `rgb(var(--track-chart-heat) / ${alpha})` }}
        />
      ))}
      <span>More</span>
    </div>
  )
}
