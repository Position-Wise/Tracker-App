/** Month helpers for Track expense filtering (local calendar months). */

import type { DailySpendPoint } from "@track/lib/types"

export function toMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

export function parseMonthKey(raw: string | null | undefined): string {
  const value = (raw ?? "").trim()
  if (/^\d{4}-\d{2}$/.test(value)) return value
  return toMonthKey()
}

/** Inclusive [start, end) UTC ISO bounds for a local YYYY-MM month. */
export function monthRangeBounds(monthKey: string): { startIso: string; endIso: string } {
  const [yRaw, mRaw] = monthKey.split("-")
  const year = Number(yRaw)
  const monthIndex = Number(mRaw) - 1
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0)
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [yRaw, mRaw] = monthKey.split("-")
  const d = new Date(Number(yRaw), Number(mRaw) - 1 + delta, 1)
  return toMonthKey(d)
}

export function formatMonthLabel(monthKey: string): string {
  const [yRaw, mRaw] = monthKey.split("-")
  const d = new Date(Number(yRaw), Number(mRaw) - 1, 1)
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}

/** Compact label like "AUG 26". */
export function formatMonthShortLabel(monthKey: string): string {
  const [yRaw, mRaw] = monthKey.split("-")
  const d = new Date(Number(yRaw), Number(mRaw) - 1, 1)
  const month = d
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase()
  const year = String(d.getFullYear()).slice(-2)
  return `${month} ${year}`
}

export function formatMoney(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function slugifyCategoryName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48) || "category"
}

/** Daily + cumulative spend series for a YYYY-MM month (local calendar). */
export function buildDailySpendSeries(
  monthKey: string,
  expenses: { amount: number; spent_at: string }[]
): DailySpendPoint[] {
  const [yRaw, mRaw] = monthKey.split("-")
  const year = Number(yRaw)
  const month = Number(mRaw)
  if (!year || !month) return []

  const daysInMonth = new Date(year, month, 0).getDate()
  const now = new Date()
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() + 1 === month
  const endDay = isCurrentMonth
    ? Math.min(now.getDate(), daysInMonth)
    : daysInMonth

  const byDay = new Map<number, number>()
  for (const expense of expenses) {
    const d = new Date(expense.spent_at)
    if (Number.isNaN(d.getTime())) continue
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue
    const day = d.getDate()
    byDay.set(day, (byDay.get(day) ?? 0) + expense.amount)
  }

  let cumulative = 0
  const points: DailySpendPoint[] = []
  for (let day = 1; day <= endDay; day++) {
    const total = byDay.get(day) ?? 0
    cumulative += total
    points.push({
      date: `${monthKey}-${String(day).padStart(2, "0")}`,
      day,
      label: String(day),
      total,
      cumulative,
    })
  }
  return points
}

/** Relative label like "Today", "Yesterday", or a local YYYY-MM-DD date. */
export function relativeDayLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return toDateInputValue(iso)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return "Today"
  if (diffDays === -1) return "Yesterday"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)} days ago`
  return toDateInputValue(iso)
}

/** Date input value (YYYY-MM-DD) from an ISO timestamp, in local time. */
export function toDateInputValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return toMonthKey().concat("-01").slice(0, 10)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** Local midnight from YYYY-MM-DD → ISO for spent_at. */
export function dateInputToIso(dateValue: string): string {
  const [y, m, d] = dateValue.split("-").map(Number)
  if (!y || !m || !d) return new Date().toISOString()
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString()
}
