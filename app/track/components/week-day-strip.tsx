"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  clampDateKeyToMonth,
  shiftDateKey,
  weekDaysContaining,
} from "@track/lib/month"
import { cn } from "@/lib/utils"

type WeekDayStripProps = {
  monthKey: string
  selectedKey: string
  onSelect: (dateKey: string) => void
  spendByDay?: Map<string, number>
}

export function WeekDayStrip({
  monthKey,
  selectedKey,
  onSelect,
  spendByDay,
}: WeekDayStripProps) {
  const days = weekDaysContaining(selectedKey, monthKey)
  const prevKey = clampDateKeyToMonth(shiftDateKey(selectedKey, -7), monthKey)
  const nextKey = clampDateKeyToMonth(shiftDateKey(selectedKey, 7), monthKey)

  return (
    <div className="relative w-full rounded-2xl bg-secondary/70">
      <div className="absolute w-full flex justify-between top-4 lg:top-5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute -left-1 lg:left-0 top-1 rounded-full text-muted-foreground"
        disabled={prevKey === selectedKey}
        onClick={() => onSelect(prevKey)}
        aria-label="Previous week"
        >
        <ChevronLeft />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute -right-1 lg:right-0 top-1 rounded-full text-muted-foreground"
        disabled={nextKey === selectedKey}
        onClick={() => onSelect(nextKey)}
        aria-label="Next week"
        >
        <ChevronRight />
      </Button>
      </div>

      <div
        role="radiogroup"
        aria-label="Day of week"
        className="grid w-full grid-cols-7 gap-0.5 sm:gap-1 p-1 px-6"
      >
        {days.map((day) => {
          const selected = day.key === selectedKey
          const hasSpend = (spendByDay?.get(day.key) ?? 0) > 0
          return (
            <button
              key={day.key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${day.weekday} ${day.day}`}
              disabled={!day.inMonth}
              onClick={() => onSelect(day.key)}
              className={cn(
                "relative flex flex-col items-center rounded-xl px-0.5 py-2 text-center transition-colors sm:py-2.5",
                day.inMonth
                  ? "hover:bg-background/70"
                  : "cursor-not-allowed opacity-35",
                selected &&
                  "bg-background text-foreground shadow-sm hover:bg-background"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide sm:text-[11px]",
                  selected ? "text-muted-foreground" : "text-muted-foreground/80"
                )}
              >
                {day.weekday.slice(0, 3)}
              </span>
              <span
                className={cn(
                  "mt-0.5 text-sm font-semibold tabular-nums sm:text-base",
                  selected ? "text-foreground" : "text-foreground/80"
                )}
              >
                {day.day}
              </span>
              {hasSpend ? (
                <span
                  className={cn(
                    "mt-1 size-1 rounded-full",
                    selected ? "bg-primary" : "bg-primary/45"
                  )}
                />
              ) : (
                <span className="mt-1 size-1" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
