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
}: {
  monthKey: string
  accountId?: string | null
  groupBy?: ExpenseGroupBy | null
  query?: string | null
  expenseId?: string | null
}) {
  const params = new URLSearchParams()
  params.set("month", monthKey)
  if (accountId) params.set("account", accountId)
  if (groupBy && groupBy !== "date") params.set("group", groupBy)
  const q = query?.trim()
  if (q) params.set("q", q)
  if (expenseId) params.set("expense", expenseId)
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
