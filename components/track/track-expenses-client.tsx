"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ExpenseFormDialog } from "@/components/track/expense-form-dialog"
import { ExpensesList } from "@/components/track/expenses-list"
import { MonthSwitcher } from "@/components/track/month-switcher"
import { useTrackLedger } from "@/components/track/track-ledger-provider"
import { useTrackMoney } from "@/components/track/track-privacy-provider"
import { Button } from "@/components/ui/button"
import type { TrackActivityItem } from "@/lib/track/activity-types"
import {
  buildExpensesHref,
  expenseMatchesQuery,
  type ExpenseGroupBy,
  resolveExpenseSourceId,
} from "@/lib/track/expense-browse"
import type { ExpenseCategory, ExpenseWithCategory } from "@/lib/track/types"

type TrackExpensesClientProps = {
  monthKey: string
  currency: string
  total: number
  expenses: ExpenseWithCategory[]
  categories: ExpenseCategory[]
  income?: TrackActivityItem[]
  transfers?: TrackActivityItem[]
  accountFilterId?: string | null
  initialQuery?: string
  initialGroupBy?: ExpenseGroupBy
  initialExpenseId?: string | null
}

export function TrackExpensesClient({
  monthKey,
  currency,
  total,
  expenses,
  categories,
  income = [],
  transfers = [],
  accountFilterId = null,
  initialQuery = "",
  initialGroupBy = "date",
  initialExpenseId = null,
}: TrackExpensesClientProps) {
  const router = useRouter()
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [query, setQuery] = useState(initialQuery)
  const [groupBy, setGroupBy] = useState<ExpenseGroupBy>(initialGroupBy)
  const [expenseId, setExpenseId] = useState<string | null>(initialExpenseId)
  const { formatMoney } = useTrackMoney()
  const { getExpenseSourceId, sourceName } = useTrackLedger()

  const visibleExpenses = useMemo(() => {
    const scoped = accountFilterId
      ? expenses.filter(
          (expense) =>
            resolveExpenseSourceId(expense, getExpenseSourceId) ===
            accountFilterId
        )
      : expenses
    if (!query.trim()) return scoped
    return scoped.filter((expense) =>
      expenseMatchesQuery(
        expense,
        query,
        sourceName(resolveExpenseSourceId(expense, getExpenseSourceId)),
        formatMoney
      )
    )
  }, [
    accountFilterId,
    expenses,
    formatMoney,
    getExpenseSourceId,
    query,
    sourceName,
  ])

  const visibleTotal = visibleExpenses.reduce((sum, row) => sum + row.amount, 0)
  const isFiltered = Boolean(accountFilterId || query.trim())
  const accountName = accountFilterId ? sourceName(accountFilterId) : null

  useEffect(() => {
    const next = buildExpensesHref({
      monthKey,
      accountId: accountFilterId,
      groupBy,
      query,
      expenseId,
    })
    const timer = window.setTimeout(() => {
      const current = `${window.location.pathname}${window.location.search}`
      if (current === next) return
      router.replace(next, { scroll: false })
    }, 180)
    return () => window.clearTimeout(timer)
  }, [accountFilterId, expenseId, groupBy, monthKey, query, router])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFiltered ? (
              <>
                {formatMoney(visibleTotal, currency)}
                {accountName ? ` on ${accountName}` : " matching"}
                <span className="text-muted-foreground/80">
                  {" "}
                  · {formatMoney(total, currency)} this month
                </span>
              </>
            ) : (
              <>{formatMoney(total, currency)} this month</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthSwitcher monthKey={monthKey} basePath="/app/expenses" />
          <Button
            type="button"
            size="sm"
            className="rounded-full"
            onClick={() => setExpenseOpen(true)}
          >
            Add expense
          </Button>
        </div>
      </div>

      <ExpenseFormDialog
        categories={categories}
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
      />

      <ExpensesList
        expenses={expenses}
        categories={categories}
        currency={currency}
        monthKey={monthKey}
        income={income}
        transfers={transfers}
        showBrowseControls
        accountFilterId={accountFilterId}
        query={query}
        onQueryChange={setQuery}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        initialExpenseId={expenseId}
        onSelectedExpenseIdChange={setExpenseId}
        onClearAccountFilter={() => {
          router.replace(
            buildExpensesHref({
              monthKey,
              groupBy,
              query,
              expenseId,
            })
          )
        }}
        onAddExpense={() => setExpenseOpen(true)}
      />
    </div>
  )
}
