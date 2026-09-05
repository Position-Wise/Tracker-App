"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getExpensesForMonth } from "@track/app/actions"
import { DaySpendRing } from "@track/components/day-spend-ring"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  buildExpensesHref,
  spendByCategory,
  spendByDayWithCategories,
} from "@track/lib/expense-browse"
import {
  defaultDayKeyForMonth,
  formatDayHeading,
  formatMonthLabel,
  monthCalendarDays,
  shiftMonthKey,
  WEEKDAY_LETTERS_MON,
} from "@track/lib/month"
import {
  colorMapForCategories,
  colorSpendSlices,
} from "@track/lib/spend-slices"
import type { ExpenseWithCategory } from "@track/lib/types"
import { cn } from "@/lib/utils"

type MonthSpendCalendarDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  monthKey: string
  expenses?: ExpenseWithCategory[]
  currency?: string
  selectedDayKey?: string
  onSelectDay?: (dateKey: string) => void
  /** Keep account/search filters when the page month is committed. */
  monthHref?: (monthKey: string, day?: string) => string
}

export function MonthSpendCalendarDialog({
  open,
  onOpenChange,
  monthKey,
  expenses = [],
  currency = "INR",
  selectedDayKey,
  onSelectDay,
  monthHref,
}: MonthSpendCalendarDialogProps) {
  const router = useRouter()
  const { formatMoney } = useTrackMoney()
  const cacheRef = useRef(new Map<string, ExpenseWithCategory[]>())
  const fetchIdRef = useRef(0)
  const skipCommitRef = useRef(false)
  const expensesRef = useRef(expenses)
  const selectedDayRef = useRef(selectedDayKey)
  expensesRef.current = expenses
  selectedDayRef.current = selectedDayKey
  const [viewMonthKey, setViewMonthKey] = useState(monthKey)
  const [viewExpenses, setViewExpenses] = useState(expenses)
  const [loading, setLoading] = useState(false)
  const [pickedKey, setPickedKey] = useState(
    () => selectedDayKey ?? defaultDayKeyForMonth(monthKey)
  )

  useEffect(() => {
    cacheRef.current.set(monthKey, expenses)
    if (open && viewMonthKey === monthKey) setViewExpenses(expenses)
  }, [expenses, monthKey, open, viewMonthKey])

  useEffect(() => {
    if (!open) return
    setViewMonthKey(monthKey)
    setViewExpenses(expensesRef.current)
    setPickedKey(selectedDayRef.current ?? defaultDayKeyForMonth(monthKey))
    setLoading(false)
  }, [open, monthKey])

  const days = useMemo(
    () => monthCalendarDays(viewMonthKey),
    [viewMonthKey]
  )
  const byDay = useMemo(
    () => spendByDayWithCategories(viewExpenses),
    [viewExpenses]
  )
  const monthSlices = useMemo(
    () => spendByCategory(viewExpenses),
    [viewExpenses]
  )
  const colorByCategory = useMemo(
    () => colorMapForCategories(monthSlices),
    [monthSlices]
  )
  const monthTotal = useMemo(
    () => viewExpenses.reduce((sum, row) => sum + row.amount, 0),
    [viewExpenses]
  )

  const activeKey = pickedKey
  const active = byDay.get(activeKey)
  const activeSlices = useMemo(
    () =>
      colorSpendSlices(
        active?.slices ?? [],
        active?.total ?? 0,
        colorByCategory
      ),
    [active, colorByCategory]
  )

  function pickDefaultDay(nextMonth: string) {
    if (nextMonth === monthKey && selectedDayKey) return selectedDayKey
    return defaultDayKeyForMonth(nextMonth)
  }

  async function goMonth(delta: number) {
    const next = shiftMonthKey(viewMonthKey, delta)
    setViewMonthKey(next)
    setPickedKey(pickDefaultDay(next))

    const cached = cacheRef.current.get(next)
    if (cached) {
      setViewExpenses(cached)
      setLoading(false)
      return
    }

    const fetchId = ++fetchIdRef.current
    setViewExpenses([])
    setLoading(true)
    const result = await getExpensesForMonth(next)
    if (fetchId !== fetchIdRef.current) return
    setLoading(false)
    if (!result.ok || !result.expenses) return
    cacheRef.current.set(next, result.expenses)
    setViewExpenses(result.expenses)
  }

  function handlePick(dateKey: string) {
    setPickedKey(dateKey)
    if (viewMonthKey === monthKey) onSelectDay?.(dateKey)
  }

  function handleOpenChange(next: boolean) {
    if (!next && !skipCommitRef.current && viewMonthKey !== monthKey && monthHref) {
      router.push(monthHref(viewMonthKey), { scroll: false })
    }
    skipCommitRef.current = false
    onOpenChange(next)
  }

  function closeAfterNavigate() {
    skipCommitRef.current = true
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-1.5rem)] gap-4 overflow-y-auto rounded-3xl border-border bg-card p-4 sm:max-w-md sm:p-5">
        <DialogHeader className="gap-1 text-left">
          <div className="flex items-center gap-1 pr-8">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => void goMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft />
            </Button>
            <DialogTitle className="flex-1 text-center text-lg">
              {formatMonthLabel(viewMonthKey)}
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => void goMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight />
            </Button>
          </div>
          <DialogDescription className="text-center">
            {loading
              ? "Loading this month…"
              : monthTotal > 0
                ? `${formatMoney(monthTotal, currency)} this month · rings show each day's mix`
                : "No spend this month yet. Rings fill as you add expenses."}
          </DialogDescription>
        </DialogHeader>

        {monthSlices.length > 0 ? (
          <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {colorSpendSlices(monthSlices, monthTotal, colorByCategory).map(
              (slice) => (
                <li
                  key={slice.categoryId}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  {slice.name}
                </li>
              )
            )}
          </ul>
        ) : null}

        <div
          className={cn(
            "grid grid-cols-7 gap-y-1.5 transition-opacity",
            loading && "pointer-events-none opacity-50"
          )}
          role="grid"
          aria-busy={loading}
          aria-label={`${formatMonthLabel(viewMonthKey)} spend calendar`}
        >
          {WEEKDAY_LETTERS_MON.map((letter, index) => (
            <div
              key={`${letter}-${index}`}
              className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              aria-hidden
            >
              {letter}
            </div>
          ))}
          {days.map((day) => {
            const spend = byDay.get(day.key)
            const total = spend?.total ?? 0
            const slices = colorSpendSlices(
              spend?.slices ?? [],
              total,
              colorByCategory
            )
            const selected = day.key === activeKey
            const label = spend
              ? `${formatDayHeading(day.key)}, ${formatMoney(total, currency)}`
              : formatDayHeading(day.key)

            return (
              <button
                key={day.key}
                type="button"
                role="gridcell"
                aria-label={label}
                aria-pressed={selected}
                disabled={!day.inMonth || loading}
                onClick={() => handlePick(day.key)}
                className={cn(
                  "flex items-center justify-center rounded-full p-0.5 transition-colors",
                  day.inMonth
                    ? "hover:bg-secondary/80"
                    : "cursor-not-allowed opacity-30",
                  selected && day.inMonth && "bg-secondary"
                )}
              >
                <DaySpendRing
                  slices={day.inMonth ? slices : []}
                  total={day.inMonth ? total : 0}
                  className="size-9 sm:size-10"
                  strokeWidth={10}
                >
                  <span
                    className={cn(
                      "flex size-[1.55rem] items-center justify-center rounded-full text-[11px] font-semibold tabular-nums sm:size-7 sm:text-xs",
                      selected
                        ? "bg-foreground text-background"
                        : day.isToday
                          ? "bg-primary/20 text-foreground"
                          : "text-foreground/85"
                    )}
                  >
                    {day.day}
                  </span>
                </DaySpendRing>
              </button>
            )
          })}
        </div>

        <div className="rounded-2xl bg-secondary/60 px-3.5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {formatDayHeading(activeKey)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {active && active.count > 0
                  ? `${active.count} ${active.count === 1 ? "expense" : "expenses"}`
                  : "No expenses"}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums">
              {formatMoney(active?.total ?? 0, currency)}
            </p>
          </div>
          {activeSlices.length > 0 ? (
            <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
              {activeSlices.map((slice) => (
                <li
                  key={slice.categoryId}
                  className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground"
                >
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="truncate">{slice.name}</span>
                  <span className="tabular-nums text-foreground/80">
                    {slice.pct}%
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {onSelectDay ? (
          <Button
            type="button"
            className="w-full rounded-full"
            disabled={loading}
            onClick={() => {
              if (viewMonthKey === monthKey) {
                onSelectDay(activeKey)
                handleOpenChange(false)
                return
              }
              if (monthHref) {
                router.push(monthHref(viewMonthKey, activeKey), { scroll: false })
              }
              closeAfterNavigate()
            }}
          >
            Show this day
          </Button>
        ) : (
          <Button asChild className="w-full rounded-full">
            <Link
              href={buildExpensesHref({
                monthKey: viewMonthKey,
                day: activeKey,
              })}
              onClick={() => {
                closeAfterNavigate()
              }}
            >
              Open in expenses
            </Link>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
