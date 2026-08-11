"use client"

import Link from "next/link"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMonthLabel, shiftMonthKey } from "@/lib/track/month"

type MonthSwitcherProps = {
  monthKey: string
  basePath: string
}

function hrefForMonth(basePath: string, month: string, search: URLSearchParams) {
  const params = new URLSearchParams(search.toString())
  params.set("month", month)
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

function MonthSwitcherInner({ monthKey, basePath }: MonthSwitcherProps) {
  const searchParams = useSearchParams()
  const prev = shiftMonthKey(monthKey, -1)
  const next = shiftMonthKey(monthKey, 1)

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-secondary/80 p-1">
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
      <span className="min-w-36 px-1 text-center text-sm font-medium">
        {formatMonthLabel(monthKey)}
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
  return (
    <Suspense
      fallback={
        <div className="min-w-36 rounded-full border border-border bg-secondary/80 px-4 py-2 text-center text-sm font-medium">
          {formatMonthLabel(props.monthKey)}
        </div>
      }
    >
      <MonthSwitcherInner {...props} />
    </Suspense>
  )
}
