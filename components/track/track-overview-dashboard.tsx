"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { AccountsOverviewPanel } from "@/components/track/accounts-overview-panel"
import { ExpenseActivityBoard } from "@/components/track/expense-activity-board"
import { SpendInsightChart } from "@/components/track/spend-insight-chart"
import { TransactionFormDialog } from "@/components/track/transaction-form-dialog"
import { MonthSwitcher } from "@/components/track/month-switcher"
import { useTrackMoney } from "@/components/track/track-privacy-provider"
import { Button } from "@/components/ui/button"
import type {
  CategorySpend,
  ExpenseCategory,
  ExpenseWithCategory,
  InsightLedgerPoint,
} from "@/lib/track/types"
import type { TrackActivityItem } from "@/lib/track/activity-types"
import { cn } from "@/lib/utils"

type TrackOverviewDashboardProps = {
  monthKey: string
  currency: string
  expenseTotal: number
  incomeTotal?: number
  byCategory: CategorySpend[]
  recent: ExpenseWithCategory[]
  insightLedger?: InsightLedgerPoint[]
  income?: TrackActivityItem[]
  transfers?: TrackActivityItem[]
  categories: ExpenseCategory[]
}

type FormKind = "expense" | "income" | "transfer" | null

export function TrackOverviewDashboard({
  monthKey,
  currency,
  expenseTotal,
  incomeTotal = 0,
  byCategory,
  recent,
  insightLedger = [],
  income = [],
  transfers = [],
  categories,
}: TrackOverviewDashboardProps) {
  const [formKind, setFormKind] = useState<FormKind>(null)
  const { formatMoney } = useTrackMoney()

  const net = incomeTotal - expenseTotal
  const topCategories = useMemo(() => byCategory.slice(0, 4), [byCategory])

  const monthIncome = income
  const monthTransfers = transfers

  return (
    <div className="space-y-6 md:space-y-8">
      <header>
        <p className="text-sm text-muted-foreground">Wise Track</p>
        
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="track-panel flex flex-col p-5 sm:p-6">
          <div className="mb-5 flex justify-between">
            <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Track Finance
            </h1>
            <MonthSwitcher monthKey={monthKey} basePath="/app" short />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <Metric
              label="Total expenses"
              value={formatMoney(expenseTotal, currency)}
              hint="This month"
            />
            <Metric
              label="Total income"
              value={formatMoney(incomeTotal, currency)}
              hint="This month"
            />
            <Metric
              label="Net"
              value={formatMoney(net, currency)}
              hint={net < 0 ? "Spending ahead" : "Balance"}
            />
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Spend by category</p>
              <Button
                asChild
                variant="ghost"
                size="xs"
                className="text-muted-foreground"
              >
                <Link href={`/app/expenses?month=${monthKey}`}>View all</Link>
              </Button>
            </div>
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No spending recorded for this month yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {topCategories.map((row) => {
                  const pct =
                    expenseTotal > 0
                      ? Math.round((row.total / expenseTotal) * 100)
                      : 0
                  return (
                    <li key={row.categoryId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>{row.name}</span>
                        <span className="font-medium tabular-nums">
                          {formatMoney(row.total, currency)}
                          <span className="ml-2 text-muted-foreground">
                            {pct}%
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary transition-[width]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <SpendInsightChart
            className="mt-8"
            monthKey={monthKey}
            currency={currency}
            ledger={insightLedger}
          />

          <div className="mt-auto hidden gap-2 pt-8 md:grid md:grid-cols-3">
            <ActionTile
              icon={TrendingDown}
              label="Expense"
              description="Log a spend"
              primary
              onClick={() => setFormKind("expense")}
            />
            <ActionTile
              icon={ArrowLeftRight}
              label="Transfer"
              description="Move between accounts"
              onClick={() => setFormKind("transfer")}
            />
            <ActionTile
              icon={TrendingUp}
              label="Income"
              description="Record money in"
              onClick={() => setFormKind("income")}
            />
          </div>
        </section>

        <AccountsOverviewPanel
          monthKey={monthKey}
          insightLedger={insightLedger}
        />
      </div>

      {formKind ? (
        <TransactionFormDialog
          kind={formKind}
          categories={categories}
          open={Boolean(formKind)}
          onOpenChange={(next) => {
            if (!next) setFormKind(null)
          }}
        />
      ) : null}

      <ExpenseActivityBoard
        expenses={recent}
        income={monthIncome}
        transfers={monthTransfers}
        categories={categories}
        currency={currency}
        monthKey={monthKey}
        showSeeAll
        onAddExpense={() => setFormKind("expense")}
        onAddIncome={() => setFormKind("income")}
        onAddTransfer={() => setFormKind("transfer")}
      />
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-[1.65rem]">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function ActionTile({
  icon: Icon,
  label,
  description,
  primary,
  onClick,
}: {
  icon: typeof TrendingDown
  label: string
  description: string
  primary?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 px-3.5 py-3 text-left transition-transform hover:-translate-y-0.5",
        primary && "border-primary/30 bg-secondary/70"
      )}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          primary
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-foreground"
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}
