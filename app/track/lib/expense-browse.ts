import { dateKeyMonth, toDateInputValue } from "@track/lib/month"
import type { ExpenseWithCategory } from "@track/lib/types"

export type ExpenseGroupBy = "date" | "category" | "account"

export function parseExpenseGroupBy(raw?: string | null): ExpenseGroupBy {
  if (raw === "category" || raw === "account") return raw
  return "date"
}

export function buildExpensesHref({
  monthKey,
  accountId,
  groupBy,
  query,
  expenseId,
  day,
}: {
  monthKey: string
  accountId?: string | null
  groupBy?: ExpenseGroupBy | null
  query?: string | null
  expenseId?: string | null
  day?: string | null
}) {
  const params = new URLSearchParams()
  params.set("month", monthKey)
  if (accountId) params.set("account", accountId)
  if (groupBy && groupBy !== "date") params.set("group", groupBy)
  const q = query?.trim()
  if (q) params.set("q", q)
  if (expenseId) params.set("expense", expenseId)
  if (day && dateKeyMonth(day) === monthKey) params.set("day", day)
  return `/app/expenses?${params.toString()}`
}

export function resolveExpenseSourceId(
  expense: ExpenseWithCategory,
  getExpenseSourceId: (id: string) => string | null
) {
  return expense.source_id ?? getExpenseSourceId(expense.id)
}

function digitsOnly(value: string) {
  return value.replace(/[^\d.]/g, "")
}

export function expenseMatchesQuery(
  expense: ExpenseWithCategory,
  query: string,
  accountName: string | undefined,
  formatAmount: (amount: number, currency: string) => string
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const category = (expense.category?.name ?? "").toLowerCase()
  const note = (expense.note ?? "").toLowerCase()
  const account = (accountName ?? "").toLowerCase()
  const formatted = formatAmount(expense.amount, expense.currency).toLowerCase()
  const qDigits = digitsOnly(q)
  return (
    category.includes(q) ||
    note.includes(q) ||
    account.includes(q) ||
    String(expense.amount).includes(q) ||
    formatted.includes(q) ||
    (qDigits.length > 0 && digitsOnly(formatted).includes(qDigits))
  )
}

export function expenseDateKey(expense: ExpenseWithCategory): string {
  return toDateInputValue(expense.spent_at)
}

export function expensesOnDate(
  expenses: ExpenseWithCategory[],
  dateKey: string
): ExpenseWithCategory[] {
  return expenses.filter((expense) => expenseDateKey(expense) === dateKey)
}

export type CategorySpendSlice = {
  categoryId: string
  name: string
  total: number
}

export function spendByCategory(
  expenses: ExpenseWithCategory[]
): CategorySpendSlice[] {
  const map = new Map<string, CategorySpendSlice>()
  for (const expense of expenses) {
    const categoryId = expense.category_id || "none"
    const name = expense.category?.name ?? "Uncategorized"
    const existing = map.get(categoryId)
    if (existing) existing.total += expense.amount
    else map.set(categoryId, { categoryId, name, total: expense.amount })
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

export type DayCategorySpend = {
  dateKey: string
  total: number
  count: number
  slices: CategorySpendSlice[]
}

export function spendByDayWithCategories(
  expenses: ExpenseWithCategory[]
): Map<string, DayCategorySpend> {
  const byDay = new Map<string, ExpenseWithCategory[]>()
  for (const expense of expenses) {
    const key = expenseDateKey(expense)
    const list = byDay.get(key)
    if (list) list.push(expense)
    else byDay.set(key, [expense])
  }

  const result = new Map<string, DayCategorySpend>()
  for (const [dateKey, list] of byDay) {
    result.set(dateKey, {
      dateKey,
      total: list.reduce((sum, row) => sum + row.amount, 0),
      count: list.length,
      slices: spendByCategory(list),
    })
  }
  return result
}
