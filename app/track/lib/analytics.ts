import { spendGrouped, type CountedSpendSlice } from "@track/lib/expense-browse"
import { monthActivityTotals, pctChange } from "@track/lib/insight-series"
import {
  dateKeyMonth,
  formatMonthShortLabel,
  lastDateKeyOfMonth,
  monthCalendarDays,
  shiftMonthKey,
  toDateInputValue,
  toLocalDateKey,
  toMonthKey,
  type MonthCalendarDay,
} from "@track/lib/month"
import type { MoneySource } from "@track/lib/money-sources"
import type {
  ExpenseWithCategory,
  InsightLedgerPoint,
  TransferPurpose,
} from "@track/lib/types"

export type AnalyticsIncome = {
  title: string
  amount: number
  toSourceId: string
  occurredAt: string
}

export type AnalyticsTransfer = {
  amount: number
  fromSourceId: string
  toSourceId: string
  purpose: TransferPurpose
}

export type MoneyFormatter = (amount: number, currency?: string) => string

/* ------------------------------------------------------------------ */
/* Month timing                                                        */
/* ------------------------------------------------------------------ */

export type MonthTiming = {
  daysInMonth: number
  /** Days of the month that have happened (incl. today). */
  elapsedDays: number
  daysLeft: number
  isCurrent: boolean
  isFuture: boolean
}

export function monthTiming(monthKey: string, today = new Date()): MonthTiming {
  const daysInMonth = Number(lastDateKeyOfMonth(monthKey).slice(8, 10))
  const todayKey = toMonthKey(today)
  const isCurrent = todayKey === monthKey
  const isFuture = monthKey > todayKey
  const elapsedDays = isCurrent
    ? Math.min(today.getDate(), daysInMonth)
    : isFuture
      ? 0
      : daysInMonth
  return {
    daysInMonth,
    elapsedDays,
    daysLeft: isCurrent ? daysInMonth - elapsedDays : 0,
    isCurrent,
    isFuture,
  }
}

/* ------------------------------------------------------------------ */
/* 1. Financial pulse                                                  */
/* ------------------------------------------------------------------ */

export type PulseHealth = "healthy" | "steady" | "tight" | "overspending" | "idle"

export type FinancialPulse = {
  income: number
  expense: number
  net: number
  savingsRate: number | null
  prevIncome: number
  prevExpense: number
  prevNet: number
  incomeChange: number | null
  expenseChange: number | null
  netChange: number | null
  cardDebt: number
  cardBillsPaid: number
  health: PulseHealth
}

export function buildFinancialPulse({
  monthKey,
  ledger,
  sources,
  balances,
  transfers,
}: {
  monthKey: string
  ledger: InsightLedgerPoint[]
  sources: MoneySource[]
  balances: Record<string, number>
  transfers: AnalyticsTransfer[]
}): FinancialPulse {
  const curr = monthActivityTotals(monthKey, ledger)
  const prev = monthActivityTotals(shiftMonthKey(monthKey, -1), ledger)
  const savingsRate =
    curr.income > 0 ? Math.round((curr.net / curr.income) * 100) : null

  const cardDebt = sources
    .filter((s) => s.kind === "credit_card")
    .reduce((sum, s) => sum + Math.max(0, balances[s.id] ?? 0), 0)

  const cardBillsPaid = transfers
    .filter((t) => t.purpose === "card_bill")
    .reduce((sum, t) => sum + t.amount, 0)

  let health: PulseHealth = "idle"
  if (curr.income > 0 || curr.expense > 0) {
    if (curr.income <= 0 || curr.net < 0) health = "overspending"
    else if ((savingsRate ?? 0) >= 20) health = "healthy"
    else if ((savingsRate ?? 0) >= 5) health = "steady"
    else health = "tight"
  }

  return {
    income: curr.income,
    expense: curr.expense,
    net: curr.net,
    savingsRate,
    prevIncome: prev.income,
    prevExpense: prev.expense,
    prevNet: prev.net,
    incomeChange: pctChange(curr.income, prev.income),
    expenseChange: pctChange(curr.expense, prev.expense),
    netChange: pctChange(curr.net, prev.net),
    cardDebt,
    cardBillsPaid,
    health,
  }
}

/* ------------------------------------------------------------------ */
/* 3. Spending pace                                                    */
/* ------------------------------------------------------------------ */

export type PacePoint = {
  day: number
  label: string
  current: number | null
  previous: number | null
  projected: number | null
}

export type SpendingPace = {
  timing: MonthTiming
  points: PacePoint[]
  spentSoFar: number
  dailyAverage: number
  projectedTotal: number
  previousTotal: number
  previousSameDay: number
  paceChange: number | null
  /** Income left per remaining day; null when not meaningful. */
  safeDailySpend: number | null
}

function dailyExpenseTotals(monthKey: string, ledger: InsightLedgerPoint[]) {
  const days = Number(lastDateKeyOfMonth(monthKey).slice(8, 10))
  const totals = Array.from({ length: days }, () => 0)
  for (const point of ledger) {
    if (point.kind !== "expense") continue
    const d = new Date(point.at)
    if (Number.isNaN(d.getTime())) continue
    if (toMonthKey(d) !== monthKey) continue
    totals[d.getDate() - 1] += point.amount
  }
  return totals
}

function cumulative(values: number[]) {
  let running = 0
  return values.map((v) => (running += v))
}

export function buildSpendingPace({
  monthKey,
  ledger,
  income,
  today = new Date(),
}: {
  monthKey: string
  ledger: InsightLedgerPoint[]
  income: number
  today?: Date
}): SpendingPace {
  const timing = monthTiming(monthKey, today)
  const prevKey = shiftMonthKey(monthKey, -1)
  const currCum = cumulative(dailyExpenseTotals(monthKey, ledger))
  const prevCum = cumulative(dailyExpenseTotals(prevKey, ledger))

  const spentSoFar =
    timing.elapsedDays > 0 ? currCum[timing.elapsedDays - 1] ?? 0 : 0
  const dailyAverage =
    timing.elapsedDays > 0 ? spentSoFar / timing.elapsedDays : 0
  const projectedTotal = timing.isCurrent
    ? spentSoFar + dailyAverage * timing.daysLeft
    : spentSoFar
  const previousTotal = prevCum[prevCum.length - 1] ?? 0
  const sameDayIndex = Math.min(timing.elapsedDays, prevCum.length) - 1
  const previousSameDay = sameDayIndex >= 0 ? prevCum[sameDayIndex] ?? 0 : 0

  const points: PacePoint[] = Array.from(
    { length: timing.daysInMonth },
    (_, i) => {
      const day = i + 1
      const showProjection = timing.isCurrent && day >= timing.elapsedDays
      return {
        day,
        label: String(day),
        current: day <= timing.elapsedDays ? currCum[i] ?? 0 : null,
        previous: prevCum[Math.min(i, prevCum.length - 1)] ?? null,
        projected: showProjection
          ? spentSoFar + dailyAverage * (day - timing.elapsedDays)
          : null,
      }
    }
  )

  const remainingIncome = income - spentSoFar
  const safeDailySpend =
    timing.isCurrent && income > 0 && timing.daysLeft > 0
      ? Math.max(0, remainingIncome) / timing.daysLeft
      : null

  return {
    timing,
    points,
    spentSoFar,
    dailyAverage,
    projectedTotal,
    previousTotal,
    previousSameDay,
    paceChange:
      timing.elapsedDays > 0 ? pctChange(spentSoFar, previousSameDay) : null,
    safeDailySpend,
  }
}

/* ------------------------------------------------------------------ */
/* 4. Where did it go                                                  */
/* ------------------------------------------------------------------ */

export function spendByCategoryCounted(expenses: ExpenseWithCategory[]) {
  return spendGrouped(expenses, (expense) => ({
    id: expense.category_id || "none",
    name: expense.category?.name ?? "Uncategorized",
  }))
}

export function spendByAccount(
  expenses: ExpenseWithCategory[],
  resolveSourceId: (expense: ExpenseWithCategory) => string | null,
  sourceName: (id: string | null | undefined) => string | undefined
): CountedSpendSlice[] {
  return spendGrouped(expenses, (expense) => {
    const id = resolveSourceId(expense)
    return {
      id: id ?? "unassigned",
      name: (id && sourceName(id)) || expense.sourceName || "No account",
    }
  })
}

/* ------------------------------------------------------------------ */
/* 5. Spending changes                                                 */
/* ------------------------------------------------------------------ */

export type CategoryChange = {
  id: string
  name: string
  current: number
  previous: number
  delta: number
  pct: number | null
}

export function buildCategoryChanges(
  current: ExpenseWithCategory[],
  previous: ExpenseWithCategory[]
): CategoryChange[] {
  const map = new Map<string, CategoryChange>()
  const touch = (expense: ExpenseWithCategory) => {
    const id = expense.category_id || "none"
    let row = map.get(id)
    if (!row) {
      row = {
        id,
        name: expense.category?.name ?? "Uncategorized",
        current: 0,
        previous: 0,
        delta: 0,
        pct: null,
      }
      map.set(id, row)
    }
    return row
  }
  for (const expense of current) touch(expense).current += expense.amount
  for (const expense of previous) touch(expense).previous += expense.amount

  return [...map.values()]
    .map((row) => ({
      ...row,
      delta: row.current - row.previous,
      pct: pctChange(row.current, row.previous),
    }))
    .filter((row) => row.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

export type MonthTrendPoint = {
  key: string
  label: string
  expense: number
  income: number
  isSelected: boolean
}

export function buildMonthlyTrend(
  monthKey: string,
  ledger: InsightLedgerPoint[],
  count = 6
): MonthTrendPoint[] {
  return Array.from({ length: count }, (_, i) => {
    const key = shiftMonthKey(monthKey, i - (count - 1))
    const totals = monthActivityTotals(key, ledger)
    return {
      key,
      label: formatMonthShortLabel(key).split(" ")[0],
      expense: totals.expense,
      income: totals.income,
      isSelected: key === monthKey,
    }
  })
}

/** Expenses from `previous` that fall within the first `days` of their month. */
export function limitToFirstDays(
  expenses: ExpenseWithCategory[],
  days: number
): ExpenseWithCategory[] {
  return expenses.filter((expense) => {
    const d = new Date(expense.spent_at)
    return !Number.isNaN(d.getTime()) && d.getDate() <= days
  })
}

/* ------------------------------------------------------------------ */
/* 6. Spending calendar                                                */
/* ------------------------------------------------------------------ */

export const WEEKDAY_SHORT_MON = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const

export type CalendarCell = MonthCalendarDay & {
  total: number
  count: number
  /** 0–1 intensity relative to the busiest day. */
  intensity: number
  isFuture: boolean
}

export type SpendCalendar = {
  cells: CalendarCell[]
  maxDay: { key: string; total: number } | null
  weekdays: { label: string; total: number; average: number }[]
  busiestWeekday: string | null
  noSpendDays: number
  activeDays: number
  weekendShare: number | null
}

function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7
}

export function buildSpendCalendar(
  monthKey: string,
  expenses: ExpenseWithCategory[],
  today = new Date()
): SpendCalendar {
  const timing = monthTiming(monthKey, today)
  const todayKey = toLocalDateKey(today)
  const byDay = new Map<string, { total: number; count: number }>()
  for (const expense of expenses) {
    const key = toDateInputValue(expense.spent_at)
    const row = byDay.get(key) ?? { total: 0, count: 0 }
    row.total += expense.amount
    row.count += 1
    byDay.set(key, row)
  }

  let maxDay: SpendCalendar["maxDay"] = null
  for (const [key, row] of byDay) {
    if (dateKeyMonth(key) !== monthKey) continue
    if (!maxDay || row.total > maxDay.total) maxDay = { key, total: row.total }
  }
  const peak = maxDay?.total ?? 0

  const cells: CalendarCell[] = monthCalendarDays(monthKey, today).map((day) => {
    const row = day.inMonth ? byDay.get(day.key) : undefined
    return {
      ...day,
      total: row?.total ?? 0,
      count: row?.count ?? 0,
      intensity: peak > 0 && row ? row.total / peak : 0,
      isFuture: day.key > todayKey,
    }
  })

  const weekdayTotals = Array.from({ length: 7 }, () => 0)
  const weekdayOccurrences = Array.from({ length: 7 }, () => 0)
  let noSpendDays = 0
  let activeDays = 0
  let monthTotal = 0
  for (let d = 1; d <= timing.elapsedDays; d++) {
    const key = `${monthKey}-${String(d).padStart(2, "0")}`
    const date = new Date(Number(monthKey.slice(0, 4)), Number(monthKey.slice(5, 7)) - 1, d)
    const idx = mondayIndex(date)
    const total = byDay.get(key)?.total ?? 0
    weekdayTotals[idx] += total
    weekdayOccurrences[idx] += 1
    monthTotal += total
    if (total > 0) activeDays += 1
    else noSpendDays += 1
  }

  const weekdays = WEEKDAY_SHORT_MON.map((label, i) => ({
    label,
    total: weekdayTotals[i],
    average: weekdayOccurrences[i] > 0 ? weekdayTotals[i] / weekdayOccurrences[i] : 0,
  }))
  const busiest = weekdays.reduce<(typeof weekdays)[number] | null>(
    (best, row) => (row.average > (best?.average ?? 0) ? row : best),
    null
  )

  return {
    cells,
    maxDay,
    weekdays,
    busiestWeekday: busiest?.label ?? null,
    noSpendDays,
    activeDays,
    weekendShare:
      monthTotal > 0
        ? Math.round(((weekdayTotals[5] + weekdayTotals[6]) / monthTotal) * 100)
        : null,
  }
}

/* ------------------------------------------------------------------ */
/* 7. Recurring + account activity                                     */
/* ------------------------------------------------------------------ */

export type RecurringStatus = "paid" | "upcoming" | "pending" | "skipped"

export type RecurringItem = {
  key: string
  name: string
  categoryName: string
  amount: number
  monthsSeen: number
  typicalDay: number
  lastAt: string
  status: RecurringStatus
}

function normalizeNote(note: string | null) {
  return (note ?? "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function median(values: number[]) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Heuristic: the same note (or same category + exact amount when there is no
 * note) seen in 2+ distinct months, at most ~2× per month, with stable amounts.
 */
export function detectRecurring(
  expenses: ExpenseWithCategory[],
  monthKey: string,
  today = new Date()
): RecurringItem[] {
  const timing = monthTiming(monthKey, today)
  const groups = new Map<string, ExpenseWithCategory[]>()
  for (const expense of expenses) {
    const expenseMonth = toMonthKey(new Date(expense.spent_at))
    if (expenseMonth > monthKey) continue
    const note = normalizeNote(expense.note)
    const key =
      note.length >= 3
        ? `n:${expense.category_id}:${note}`
        : `a:${expense.category_id}:${Math.round(expense.amount)}`
    const list = groups.get(key)
    if (list) list.push(expense)
    else groups.set(key, [expense])
  }

  const items: RecurringItem[] = []
  for (const [key, list] of groups) {
    const months = new Set(list.map((e) => toMonthKey(new Date(e.spent_at))))
    if (months.size < 2) continue
    if (list.length / months.size > 2) continue
    const amount = median(list.map((e) => e.amount))
    if (amount <= 0) continue
    const stable = list.filter(
      (e) => Math.abs(e.amount - amount) <= amount * 0.25
    ).length
    if (stable / list.length < 0.75) continue

    const latest = [...list].sort((a, b) =>
      b.spent_at.localeCompare(a.spent_at)
    )[0]
    const typicalDay = Math.round(
      median(list.map((e) => new Date(e.spent_at).getDate()))
    )
    let status: RecurringStatus
    if (months.has(monthKey)) status = "paid"
    else if (timing.isCurrent && typicalDay > timing.elapsedDays)
      status = "upcoming"
    else if (timing.isCurrent) status = "pending"
    else status = "skipped"

    items.push({
      key,
      name: latest.note?.trim() || latest.category?.name || "Recurring",
      categoryName: latest.category?.name ?? "Uncategorized",
      amount,
      monthsSeen: months.size,
      typicalDay,
      lastAt: latest.spent_at,
      status,
    })
  }

  return items.sort((a, b) => b.amount - a.amount)
}

export type AccountActivity = {
  source: MoneySource
  balance: number
  spent: number
  received: number
  transferIn: number
  transferOut: number
  transactions: number
  utilization: { used: number; limit: number; usedPct: number } | null
}

export function buildAccountActivity({
  sources,
  balanceFor,
  usageFor,
  expenses,
  incomes,
  transfers,
  resolveSourceId,
}: {
  sources: MoneySource[]
  balanceFor: (id: string) => number
  usageFor: (source: MoneySource) => AccountActivity["utilization"]
  expenses: ExpenseWithCategory[]
  incomes: AnalyticsIncome[]
  transfers: AnalyticsTransfer[]
  resolveSourceId: (expense: ExpenseWithCategory) => string | null
}): AccountActivity[] {
  const rows = new Map<string, AccountActivity>()
  for (const source of sources) {
    rows.set(source.id, {
      source,
      balance: balanceFor(source.id),
      spent: 0,
      received: 0,
      transferIn: 0,
      transferOut: 0,
      transactions: 0,
      utilization: usageFor(source),
    })
  }
  for (const expense of expenses) {
    const row = rows.get(resolveSourceId(expense) ?? "")
    if (!row) continue
    row.spent += expense.amount
    row.transactions += 1
  }
  for (const income of incomes) {
    const row = rows.get(income.toSourceId)
    if (!row) continue
    row.received += income.amount
    row.transactions += 1
  }
  for (const transfer of transfers) {
    const from = rows.get(transfer.fromSourceId)
    const to = rows.get(transfer.toSourceId)
    if (from) {
      from.transferOut += transfer.amount
      from.transactions += 1
    }
    if (to) {
      to.transferIn += transfer.amount
      to.transactions += 1
    }
  }
  return [...rows.values()].sort(
    (a, b) =>
      b.spent + b.received + b.transferIn + b.transferOut -
      (a.spent + a.received + a.transferIn + a.transferOut)
  )
}

/* ------------------------------------------------------------------ */
/* 8. Insights                                                         */
/* ------------------------------------------------------------------ */

export type InsightTone = "positive" | "warning" | "neutral"

export type Insight = {
  id: string
  tone: InsightTone
  title: string
  body: string
}

export function buildInsights({
  pulse,
  pace,
  categories,
  changes,
  calendar,
  recurring,
  accounts,
  largestExpense,
  currency,
  formatMoney,
}: {
  pulse: FinancialPulse
  pace: SpendingPace
  categories: CountedSpendSlice[]
  changes: CategoryChange[]
  calendar: SpendCalendar
  recurring: RecurringItem[]
  accounts: AccountActivity[]
  largestExpense: ExpenseWithCategory | null
  currency: string
  formatMoney: MoneyFormatter
}): Insight[] {
  const money = (n: number) => formatMoney(Math.round(n), currency)
  const out: Insight[] = []
  const total = pulse.expense

  if (pulse.income <= 0 && total > 0) {
    out.push({
      id: "no-income",
      tone: "warning",
      title: "Spending without logged income",
      body: `${money(total)} spent and no income recorded this month. Log income to see your real savings rate.`,
    })
  } else if (pulse.savingsRate != null) {
    if (pulse.savingsRate >= 20) {
      out.push({
        id: "savings",
        tone: "positive",
        title: `You kept ${pulse.savingsRate}% of your income`,
        body: `${money(pulse.net)} left after spending — comfortably above a 20% savings habit.`,
      })
    } else if (pulse.savingsRate >= 0) {
      out.push({
        id: "savings",
        tone: "neutral",
        title: `Savings rate is ${pulse.savingsRate}%`,
        body: `Only ${money(pulse.net)} of ${money(pulse.income)} is left. Trimming your top category would lift it.`,
      })
    } else {
      out.push({
        id: "savings",
        tone: "warning",
        title: "Spending is ahead of income",
        body: `You've spent ${money(-pulse.net)} more than you earned this month.`,
      })
    }
  }

  if (pace.timing.isCurrent && pace.previousTotal > 0 && pace.spentSoFar > 0) {
    const projectedVsPrev = pctChange(pace.projectedTotal, pace.previousTotal)
    if (projectedVsPrev != null && projectedVsPrev >= 10) {
      out.push({
        id: "pace",
        tone: "warning",
        title: `On track for ${money(pace.projectedTotal)} this month`,
        body: `That's ${projectedVsPrev}% more than last month's ${money(pace.previousTotal)} at today's pace of ${money(pace.dailyAverage)}/day.`,
      })
    } else if (projectedVsPrev != null && projectedVsPrev <= -10) {
      out.push({
        id: "pace",
        tone: "positive",
        title: "Spending pace is slower than last month",
        body: `Projected ${money(pace.projectedTotal)} vs ${money(pace.previousTotal)} last month — ${Math.abs(projectedVsPrev)}% lower.`,
      })
    }
  }

  if (pace.safeDailySpend != null && pulse.net > 0) {
    out.push({
      id: "safe-daily",
      tone: "neutral",
      title: `About ${money(pace.safeDailySpend)}/day keeps you positive`,
      body: `${pace.timing.daysLeft} days left with ${money(pulse.income - pace.spentSoFar)} of this month's income unspent.`,
    })
  }

  const top = categories[0]
  if (top && total > 0) {
    const share = Math.round((top.total / total) * 100)
    if (share >= 35) {
      out.push({
        id: "top-category",
        tone: share >= 50 ? "warning" : "neutral",
        title: `${top.name} takes ${share}% of spending`,
        body: `${money(top.total)} across ${top.count} ${top.count === 1 ? "expense" : "expenses"}.`,
      })
    }
  }

  const riser = changes.find(
    (c) => c.delta > 0 && (c.pct ?? 0) >= 25 && c.delta >= total * 0.05
  )
  if (riser) {
    out.push({
      id: "riser",
      tone: "warning",
      title: `${riser.name} is up ${riser.pct}%`,
      body: `${money(riser.current)} vs ${money(riser.previous)} over the same days last month.`,
    })
  }
  const faller = changes.find(
    (c) => c.delta < 0 && (c.pct ?? 0) <= -25 && Math.abs(c.delta) >= total * 0.05
  )
  if (faller) {
    out.push({
      id: "faller",
      tone: "positive",
      title: `${faller.name} is down ${Math.abs(faller.pct ?? 0)}%`,
      body: `You saved ${money(-faller.delta)} there compared with last month.`,
    })
  }

  if (calendar.weekendShare != null && calendar.weekendShare >= 45) {
    out.push({
      id: "weekend",
      tone: "neutral",
      title: `Weekends drive ${calendar.weekendShare}% of spend`,
      body: "Saturdays and Sundays are only 2 of 7 days — plan weekend budgets ahead.",
    })
  } else if (calendar.busiestWeekday && total > 0) {
    const row = calendar.weekdays.find((w) => w.label === calendar.busiestWeekday)
    if (row && row.average > 0) {
      out.push({
        id: "weekday",
        tone: "neutral",
        title: `${calendar.busiestWeekday}s are your biggest spend day`,
        body: `You average ${money(row.average)} on a ${calendar.busiestWeekday}.`,
      })
    }
  }

  if (calendar.noSpendDays >= 3 && total > 0) {
    out.push({
      id: "no-spend",
      tone: "positive",
      title: `${calendar.noSpendDays} no-spend days`,
      body: `You've had spend on ${calendar.activeDays} of ${calendar.activeDays + calendar.noSpendDays} days so far.`,
    })
  }

  if (largestExpense && total > 0 && largestExpense.amount >= total * 0.2) {
    out.push({
      id: "largest",
      tone: "neutral",
      title: `One expense is ${Math.round((largestExpense.amount / total) * 100)}% of the month`,
      body: `${largestExpense.note?.trim() || largestExpense.category?.name || "An expense"} — ${money(largestExpense.amount)}.`,
    })
  }

  const committed = recurring.reduce((sum, r) => sum + r.amount, 0)
  const upcoming = recurring.filter(
    (r) => r.status === "upcoming" || r.status === "pending"
  )
  if (upcoming.length > 0) {
    out.push({
      id: "recurring-upcoming",
      tone: "neutral",
      title: `${upcoming.length} recurring ${upcoming.length === 1 ? "payment" : "payments"} not logged yet`,
      body: `Roughly ${money(upcoming.reduce((s, r) => s + r.amount, 0))} more is likely to go out this month.`,
    })
  } else if (committed > 0 && total > 0 && committed / total >= 0.3) {
    out.push({
      id: "recurring-share",
      tone: "neutral",
      title: `Commitments are ${Math.round((committed / total) * 100)}% of spend`,
      body: `About ${money(committed)} a month goes to things that repeat.`,
    })
  }

  for (const account of accounts) {
    if (account.utilization && account.utilization.usedPct >= 30) {
      out.push({
        id: `util-${account.source.id}`,
        tone: account.utilization.usedPct >= 70 ? "warning" : "neutral",
        title: `${account.source.name} is ${Math.round(account.utilization.usedPct)}% utilized`,
        body: `${money(account.utilization.used)} of a ${money(account.utilization.limit)} limit. Under 30% is healthiest.`,
      })
      break
    }
  }

  const order: Record<InsightTone, number> = { warning: 0, neutral: 1, positive: 2 }
  return out.sort((a, b) => order[a.tone] - order[b.tone])
}
