"use client"

import { useState } from "react"
import { ExpenseFormDialog } from "@/components/track/expense-form-dialog"
import { ExpensesList } from "@/components/track/expenses-list"
import { MonthSwitcher } from "@/components/track/month-switcher"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/track/month"
import type { TrackActivityItem } from "@/lib/track/activity-types"
import type { ExpenseCategory, ExpenseWithCategory } from "@/lib/track/types"

type TrackExpensesClientProps = {
  monthKey: string
  currency: string
  total: number
  expenses: ExpenseWithCategory[]
  categories: ExpenseCategory[]
  income?: TrackActivityItem[]
  transfers?: TrackActivityItem[]
}

export function TrackExpensesClient({
  monthKey,
  currency,
  total,
  expenses,
  categories,
  income = [],
  transfers = [],
}: TrackExpensesClientProps) {
  const [expenseOpen, setExpenseOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatMoney(total, currency)} this month
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
        onAddExpense={() => setExpenseOpen(true)}
      />
    </div>
  )
}
