"use client"

import { ExpenseActivityBoard } from "@track/components/expense-activity-board"
import type { TrackActivityItem } from "@track/lib/activity-types"
import type { ExpenseGroupBy } from "@track/lib/expense-browse"
import type { ExpenseCategory, ExpenseWithCategory } from "@track/lib/types"

type ExpensesListProps = {
  expenses: ExpenseWithCategory[]
  categories: ExpenseCategory[]
  currency: string
  monthKey?: string
  income?: TrackActivityItem[]
  transfers?: TrackActivityItem[]
  showBrowseControls?: boolean
  accountFilterId?: string | null
  query?: string
  onQueryChange?: (query: string) => void
  groupBy?: ExpenseGroupBy
  onGroupByChange?: (groupBy: ExpenseGroupBy) => void
  initialExpenseId?: string | null
  onSelectedExpenseIdChange?: (id: string | null) => void
  onClearAccountFilter?: () => void
  onAddExpense?: () => void
  onAddIncome?: () => void
  onAddTransfer?: () => void
}

export function ExpensesList({
  expenses,
  categories,
  currency,
  monthKey,
  income,
  transfers,
  showBrowseControls,
  accountFilterId,
  query,
  onQueryChange,
  groupBy,
  onGroupByChange,
  initialExpenseId,
  onSelectedExpenseIdChange,
  onClearAccountFilter,
  onAddExpense,
  onAddIncome,
  onAddTransfer,
}: ExpensesListProps) {
  return (
    <ExpenseActivityBoard
      expenses={expenses}
      income={income}
      transfers={transfers}
      categories={categories}
      currency={currency}
      monthKey={monthKey}
      showBrowseControls={showBrowseControls}
      accountFilterId={accountFilterId}
      query={query}
      onQueryChange={onQueryChange}
      groupBy={groupBy}
      onGroupByChange={onGroupByChange}
      initialExpenseId={initialExpenseId}
      onSelectedExpenseIdChange={onSelectedExpenseIdChange}
      onClearAccountFilter={onClearAccountFilter}
      onAddExpense={onAddExpense}
      onAddIncome={onAddIncome}
      onAddTransfer={onAddTransfer}
    />
  )
}

