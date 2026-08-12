import type { InsightLedgerPoint, InsightSeriesPoint } from "@/lib/track/types"

export type InsightRange = "weekly" | "monthly" | "yearly"

export const INSIGHT_RANGE_OPTIONS: {
  value: InsightRange
  label: string
}[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
]

/** Bounds covering the selected month's year, plus prior month for comparisons. */
export function insightFetchBounds(monthKey: string): {
  startIso: string
  endIso: string
  year: number
} {
  const [yRaw] = monthKey.split("-")
  const year = Number(yRaw) || new Date().getFullYear()
  const start = new Date(year, 0, 1)
  start.setMonth(start.getMonth() - 1)
  const end = new Date(year + 1, 0, 1)
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    year,
  }
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, n: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function toDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function toMonthKeyFromDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

function weekdayShort(d: Date) {
  return d.toLocaleDateString("en-IN", { weekday: "short" })
}

function monthShort(monthIndex: number) {
  return new Date(2000, monthIndex, 1).toLocaleDateString("en-IN", {
    month: "short",
  })
}

function referenceEndDate(monthKey: string): Date {
  const [yRaw, mRaw] = monthKey.split("-")
  const year = Number(yRaw)
  const month = Number(mRaw)
  const now = new Date()
  const isCurrent =
    now.getFullYear() === year && now.getMonth() + 1 === month
  if (isCurrent) return startOfLocalDay(now)
  return startOfLocalDay(new Date(year, month, 0))
}

function sumInRange(
  points: InsightLedgerPoint[],
  start: Date,
  endExclusive: Date
) {
  let expense = 0
  let income = 0
  const startMs = start.getTime()
  const endMs = endExclusive.getTime()
  for (const p of points) {
    const t = new Date(p.at).getTime()
    if (Number.isNaN(t) || t < startMs || t >= endMs) continue
    if (p.kind === "expense") expense += p.amount
    else income += p.amount
  }
  return { expense, income }
}

function buildSeries(
  buckets: { key: string; label: string; start: Date; end: Date }[],
  ledger: InsightLedgerPoint[]
): InsightSeriesPoint[] {
  let cumulativeExpense = 0
  let cumulativeIncome = 0
  return buckets.map((bucket) => {
    const { expense, income } = sumInRange(ledger, bucket.start, bucket.end)
    cumulativeExpense += expense
    cumulativeIncome += income
    return {
      key: bucket.key,
      label: bucket.label,
      expense,
      income,
      cumulativeExpense,
      cumulativeIncome,
    }
  })
}

export function buildInsightSeries(
  range: InsightRange,
  monthKey: string,
  ledger: InsightLedgerPoint[]
): {
  points: InsightSeriesPoint[]
  expenseTotal: number
  incomeTotal: number
} {
  if (range === "weekly") {
    const end = referenceEndDate(monthKey)
    const start = addDays(end, -6)
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i)
      const next = addDays(day, 1)
      return {
        key: toDateKey(day),
        label: weekdayShort(day),
        start: day,
        end: next,
      }
    })
    const points = buildSeries(buckets, ledger)
    return {
      points,
      expenseTotal: points.reduce((s, p) => s + p.expense, 0),
      incomeTotal: points.reduce((s, p) => s + p.income, 0),
    }
  }

  if (range === "yearly") {
    const year = Number(monthKey.slice(0, 4))
    const now = new Date()
    const endMonth =
      now.getFullYear() === year ? now.getMonth() : 11
    const buckets = Array.from({ length: endMonth + 1 }, (_, monthIndex) => {
      const start = new Date(year, monthIndex, 1)
      const end = new Date(year, monthIndex + 1, 1)
      return {
        key: toMonthKeyFromDate(start),
        label: monthShort(monthIndex),
        start,
        end,
      }
    })
    const points = buildSeries(buckets, ledger)
    return {
      points,
      expenseTotal: points.reduce((s, p) => s + p.expense, 0),
      incomeTotal: points.reduce((s, p) => s + p.income, 0),
    }
  }

  // monthly — day-by-day within selected month
  const [yRaw, mRaw] = monthKey.split("-")
  const year = Number(yRaw)
  const month = Number(mRaw)
  const end = referenceEndDate(monthKey)
  const dayCount = end.getDate()
  const buckets = Array.from({ length: dayCount }, (_, i) => {
    const day = new Date(year, month - 1, i + 1)
    return {
      key: toDateKey(day),
      label: String(i + 1),
      start: day,
      end: addDays(day, 1),
    }
  })

  const points = buildSeries(buckets, ledger)
  return {
    points,
    expenseTotal: points.reduce((s, p) => s + p.expense, 0),
    incomeTotal: points.reduce((s, p) => s + p.income, 0),
  }
}

export function rangePeriodLabel(range: InsightRange): string {
  if (range === "weekly") return "this week"
  if (range === "yearly") return "this year"
  return "this month"
}

export type MonthCompareSnapshot = {
  prevKey: string
  currKey: string
  prevLabel: string
  currLabel: string
  prevTotal: number
  currTotal: number
  changePct: number | null
  prevBars: number[]
  currBars: number[]
}

/** Previous vs current month spend bars for the accounts pulse card. */
export function buildMonthCompare(
  monthKey: string,
  ledger: InsightLedgerPoint[],
  barCount = 7
): MonthCompareSnapshot {
  const [yRaw, mRaw] = monthKey.split("-")
  const year = Number(yRaw)
  const month = Number(mRaw)
  const currStart = new Date(year, month - 1, 1)
  const currEnd = new Date(year, month, 1)
  const prevStart = new Date(year, month - 2, 1)
  const prevEnd = currStart

  const prevKey = toMonthKeyFromDate(prevStart)
  const currKey = toMonthKeyFromDate(currStart)

  function barsFor(start: Date, end: Date) {
    const days = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / 86_400_000)
    )
    const totals = Array.from({ length: barCount }, () => 0)
    for (const point of ledger) {
      if (point.kind !== "expense") continue
      const t = new Date(point.at).getTime()
      if (Number.isNaN(t) || t < start.getTime() || t >= end.getTime()) continue
      const dayIndex = Math.min(
        barCount - 1,
        Math.floor(
          ((t - start.getTime()) / Math.max(end.getTime() - start.getTime(), 1)) *
            barCount
        )
      )
      totals[dayIndex] += point.amount
    }
    const total = totals.reduce((sum, n) => sum + n, 0)
    const peak = Math.max(...totals, 1)
    return {
      total,
      bars: totals.map((n) => n / peak),
      days,
    }
  }

  const prev = barsFor(prevStart, prevEnd)
  const curr = barsFor(currStart, currEnd)
  const changePct =
    prev.total <= 0
      ? curr.total > 0
        ? 100
        : null
      : Math.round(((curr.total - prev.total) / prev.total) * 100)

  return {
    prevKey,
    currKey,
    prevLabel: monthShort(prevStart.getMonth()).toUpperCase(),
    currLabel: monthShort(currStart.getMonth()).toUpperCase(),
    prevTotal: prev.total,
    currTotal: curr.total,
    changePct,
    prevBars: prev.bars,
    currBars: curr.bars,
  }
}

