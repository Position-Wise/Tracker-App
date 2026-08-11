/** Month helpers for Track expense filtering (local calendar months). */

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
