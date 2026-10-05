"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import {
  AnalyticsSection,
  EmptyNote,
  SegmentedToggle,
} from "@track/components/analytics/analytics-section"
import { DaySpendRing } from "@track/components/day-spend-ring"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import { buildExpensesHref, type CountedSpendSlice } from "@track/lib/expense-browse"
import {
  colorMapForCategories,
  colorSpendSlices,
  SLICE_TONES,
} from "@track/lib/spend-slices"

type BreakdownView = "category" | "account"

export function AnalyticsBreakdown({
  monthKey,
  currency,
  total,
  byCategory,
  byAccount,
  className,
}: {
  monthKey: string
  currency: string
  total: number
  byCategory: CountedSpendSlice[]
  byAccount: CountedSpendSlice[]
  className?: string
}) {
  const { formatMoney } = useTrackMoney()
  const [view, setView] = useState<BreakdownView>("category")
  const rows = view === "category" ? byCategory : byAccount

  const asSlices = useMemo(
    () => rows.map((r) => ({ categoryId: r.id, name: r.name, total: r.total })),
    [rows]
  )
  const colorById = useMemo(() => colorMapForCategories(asSlices), [asSlices])
  const ringSlices = useMemo(
    () => colorSpendSlices(asSlices, total, colorById),
    [asSlices, colorById, total]
  )
  const top = rows[0]

  function hrefFor(row: CountedSpendSlice) {
    if (view === "account") {
      return buildExpensesHref({
        monthKey,
        accountId: row.id === "unassigned" ? null : row.id,
      })
    }
    return buildExpensesHref({ monthKey, groupBy: "category", query: row.name })
  }

  return (
    <AnalyticsSection
      id="breakdown"
      index={4}
      title="Where did it go?"
      question="Which categories and accounts consumed it?"
      className={className}
      action={
        <SegmentedToggle
          label="Group spend by"
          value={view}
          onChange={setView}
          options={[
            { value: "category", label: "Categories" },
            { value: "account", label: "Accounts" },
          ]}
        />
      }
    >
      {rows.length === 0 ? (
        <EmptyNote>No spending recorded for this month yet.</EmptyNote>
      ) : (
        <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <DaySpendRing
            slices={ringSlices}
            total={total}
            className="mx-auto size-44 lg:size-48"
            strokeWidth={10}
            strokeLinecap="round"
          >
            <div className="px-4 text-center">
              <p className="text-[11px] text-muted-foreground">
                Top {view === "category" ? "category" : "account"}
              </p>
              <p className="mt-0.5 max-w-28 truncate text-sm font-semibold">
                {top?.name}
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                {top && total > 0 ? Math.round((top.total / total) * 100) : 0}%
              </p>
            </div>
          </DaySpendRing>

          <ul className="min-w-0 space-y-1">
            {rows.slice(0, 8).map((row, index) => {
              const pct = total > 0 ? Math.round((row.total / total) * 100) : 0
              const color =
                colorById.get(row.id) ??
                SLICE_TONES[Math.min(index, SLICE_TONES.length - 1)]
              return (
                <li key={row.id}>
                  <Link
                    href={hrefFor(row)}
                    className="group block rounded-xl px-2 py-1.5 transition-colors hover:bg-secondary/60"
                  >
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full ring-1 ring-border"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{row.name}</span>
                        <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                          {row.count} · avg {formatMoney(Math.round(row.total / row.count), currency)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 tabular-nums">
                        <span className="font-medium">
                          {formatMoney(row.total, currency)}
                        </span>
                        <span className="w-9 text-right text-xs text-muted-foreground">
                          {pct}%
                        </span>
                        <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-(--track-chart) transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                </li>
              )
            })}
            {rows.length > 8 ? (
              <li className="px-2 pt-1 text-xs text-muted-foreground">
                +{rows.length - 8} more
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </AnalyticsSection>
  )
}
