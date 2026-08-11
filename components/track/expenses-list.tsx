"use client"

import { ExpenseActivityBoard } from "@/components/track/expense-activity-board"
import type { TrackActivityItem } from "@/lib/track/activity-types"
import type { ExpenseCategory, ExpenseWithCategory } from "@/lib/track/types"

type ExpensesListProps = {
  expenses: ExpenseWithCategory[]
  categories: ExpenseCategory[]
  currency: string
  monthKey?: string
  income?: TrackActivityItem[]
  transfers?: TrackActivityItem[]
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
      onAddExpense={onAddExpense}
      onAddIncome={onAddIncome}
      onAddTransfer={onAddTransfer}
    />
  )
}
