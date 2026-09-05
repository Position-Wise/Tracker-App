"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { MonthSpendCalendarDialog } from "@track/components/month-spend-calendar"
import { Button } from "@/components/ui/button"
import {
  formatMonthLabel,
  formatMonthShortLabel,
  shiftMonthKey,
} from "@track/lib/month"
import type { ExpenseWithCategory } from "@track/lib/types"
import { cn } from "@/lib/utils"

type MonthSwitcherProps = {
  monthKey: string
  basePath: string
  /** Compact "AUG 26" label. Default is full "August 2026". */
  short?: boolean
  className?: string
  expenses?: ExpenseWithCategory[]
  currency?: string
  selectedDayKey?: string
  onSelectDay?: (dateKey: string) => void
}

function hrefForMonth(basePath: string, month: string, search: URLSearchParams) {
  const params = new URLSearchParams(search.toString())
  params.set("month", month)
  params.delete("day")
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

function MonthSwitcherInner({
  monthKey,
  basePath,
  short,
  className,
  expenses,
  currency,
  selectedDayKey,
  onSelectDay,
}: MonthSwitcherProps) {
  const searchParams = useSearchParams()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const prev = shiftMonthKey(monthKey, -1)
  const next = shiftMonthKey(monthKey, 1)
  const label = short
    ? formatMonthShortLabel(monthKey)
    : formatMonthLabel(monthKey)

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1 rounded-full border border-border bg-secondary/80 p-1",
          className
        )}
      >
        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          className="rounded-full hover:bg-background"
        >
          <Link
            href={hrefForMonth(basePath, prev, searchParams)}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </Link>
        </Button>
        <button
          type="button"
          onClick={() => setCalendarOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={calendarOpen}
          aria-label={`${label}, open month spend calendar`}
          className={cn(
            "inline-flex min-w-0 items-center justify-center rounded-full px-1 py-1 text-center text-sm font-medium tabular-nums transition-colors hover:bg-background",
            short ? "min-w-18 tracking-wide" : "min-w-36"
          )}
        >
          {label}
        </button>
        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          className="rounded-full hover:bg-background"
        >
          <Link
            href={hrefForMonth(basePath, next, searchParams)}
            aria-label="Next month"
          >
            <ChevronRight />
          </Link>
        </Button>
      </div>
      <MonthSpendCalendarDialog
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        monthKey={monthKey}
        expenses={expenses}
        currency={currency}
        selectedDayKey={selectedDayKey}
        onSelectDay={onSelectDay}
        monthHref={(month, day) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set("month", month)
          if (day) params.set("day", day)
          else params.delete("day")
          const qs = params.toString()
          return qs ? `${basePath}?${qs}` : basePath
        }}
      />
    </>
  )
}

export function MonthSwitcher(props: MonthSwitcherProps) {
  const label = props.short
    ? formatMonthShortLabel(props.monthKey)
    : formatMonthLabel(props.monthKey)

  return (
    <Suspense
      fallback={
        <div
          className={cn(
            "rounded-full border border-border bg-secondary/80 px-4 py-2 text-center text-sm font-medium",
            props.short ? "min-w-18 tracking-wide" : "min-w-36",
            props.className
          )}
        >
          {label}
        </div>
      }
    >
      <MonthSwitcherInner {...props} />
    </Suspense>
  )
}
