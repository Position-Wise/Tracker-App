"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  formatMonthLabel,
  formatMonthShortLabel,
  shiftMonthKey,
} from "@track/lib/month"
import { cn } from "@/lib/utils"

type MonthSwitcherProps = {
  monthKey: string
  basePath: string
  /** Compact "AUG 26" label. Default is full "August 2026". */
  short?: boolean
  className?: string
}

function hrefForMonth(basePath: string, month: string, search: URLSearchParams) {
  const params = new URLSearchParams(search.toString())
  params.set("month", month)
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

function MonthSwitcherInner({
  monthKey,
  basePath,
  short,
  className,
}: MonthSwitcherProps) {
  const searchParams = useSearchParams()
  const prev = shiftMonthKey(monthKey, -1)
  const next = shiftMonthKey(monthKey, 1)
  const label = short
    ? formatMonthShortLabel(monthKey)
    : formatMonthLabel(monthKey)

  return (
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
      <span
        className={cn(
          "px-1 text-center text-sm font-medium tabular-nums",
          short ? "min-w-18 tracking-wide" : "min-w-36"
        )}
      >
        {label}
      </span>
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
