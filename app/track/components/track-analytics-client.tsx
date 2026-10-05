"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { AnalyticsBreakdown } from "@track/components/analytics/analytics-breakdown"
import { AnalyticsCalendar } from "@track/components/analytics/analytics-calendar"
import { AnalyticsChanges } from "@track/components/analytics/analytics-changes"
import { AnalyticsCommitments } from "@track/components/analytics/analytics-commitments"
import { AnalyticsInsights } from "@track/components/analytics/analytics-insights"
import { AnalyticsPace } from "@track/components/analytics/analytics-pace"
import { AnalyticsPulse } from "@track/components/analytics/analytics-pulse"
import { AnalyticsSection } from "@track/components/analytics/analytics-section"
import { ActivityFlowChart } from "@track/components/activity-flow-chart"
import { MonthSwitcher } from "@track/components/month-switcher"
import { useTrackLedger } from "@track/components/track-ledger-provider"
import { useTrackMoney } from "@track/components/track-privacy-provider"
import { Button } from "@/components/ui/button"
import {
  buildAccountActivity,
  buildCategoryChanges,
  buildFinancialPulse,
  buildInsights,
  buildMonthlyTrend,
  buildSpendCalendar,
  buildSpendingPace,
  detectRecurring,
  limitToFirstDays,
  spendByAccount,
  spendByCategoryCounted,
  type AnalyticsIncome,
  type AnalyticsTransfer,
} from "@track/lib/analytics"
import { resolveExpenseSourceId } from "@track/lib/expense-browse"
import { cardLimitUsage } from "@track/lib/money-sources"
import {
  formatMonthLabel,
  formatMonthShortLabel,
  shiftMonthKey,
  toMonthKey,
} from "@track/lib/month"
import type { ExpenseWithCategory, InsightLedgerPoint } from "@track/lib/types"

type TrackAnalyticsClientProps = {
  monthKey: string
  currency: string
  expenseTotal: number
  incomeTotal: number
  expenses: ExpenseWithCategory[]
  /** Categorized expenses from the few months before `monthKey`. */
  historyExpenses: ExpenseWithCategory[]
  incomes: AnalyticsIncome[]
  transfers: AnalyticsTransfer[]
  insightLedger: InsightLedgerPoint[]
}

const SECTION_LINKS = [
  { id: "pulse", label: "Pulse" },
  { id: "flow", label: "Money flow" },
  { id: "pace", label: "Pace" },
  { id: "breakdown", label: "Where it went" },
  { id: "changes", label: "Changes" },
  { id: "calendar", label: "Calendar" },
  { id: "commitments", label: "Recurring" },
  { id: "insights", label: "Insights" },
] as const

export function TrackAnalyticsClient({
  monthKey,
  currency,
  expenseTotal,
  incomeTotal,
  expenses,
  historyExpenses,
  incomes,
  transfers,
  insightLedger,
}: TrackAnalyticsClientProps) {
  const { formatMoney } = useTrackMoney()
  const {
    sources,
    balances,
    sourceBalance,
    sourceName,
    getExpenseSourceId,
    cardCreditLimit,
    totalLiquidBalance,
    ready,
  } = useTrackLedger()

  const monthLabel = formatMonthLabel(monthKey)
  const prevKey = shiftMonthKey(monthKey, -1)
  const prevLabel = formatMonthShortLabel(prevKey).split(" ")[0]

  const data = useMemo(() => {
    const today = new Date()
    const resolveSource = (expense: ExpenseWithCategory) =>
      resolveExpenseSourceId(expense, getExpenseSourceId)

    const pulse = buildFinancialPulse({
      monthKey,
      ledger: insightLedger,
      sources,
      balances,
      transfers,
    })
    const pace = buildSpendingPace({
      monthKey,
      ledger: insightLedger,
      income: pulse.income,
      today,
    })

    const byCategory = spendByCategoryCounted(expenses)
    const byAccount = spendByAccount(expenses, resolveSource, sourceName)

    const prevExpenses = historyExpenses.filter(
      (e) => toMonthKey(new Date(e.spent_at)) === prevKey
    )
    const comparePrev = pace.timing.isCurrent
      ? limitToFirstDays(prevExpenses, pace.timing.elapsedDays)
      : prevExpenses
    const changes = buildCategoryChanges(expenses, comparePrev)
    const trend = buildMonthlyTrend(monthKey, insightLedger)

    const calendar = buildSpendCalendar(monthKey, expenses, today)
    const recurring = detectRecurring(
      [...historyExpenses, ...expenses],
      monthKey,
      today
    )
    const accounts = buildAccountActivity({
      sources,
      balanceFor: sourceBalance,
      usageFor: (source) =>
        cardLimitUsage(source, sources, sourceBalance, cardCreditLimit),
      expenses,
      incomes,
      transfers,
      resolveSourceId: resolveSource,
    })

    const largestExpense = expenses.reduce<ExpenseWithCategory | null>(
      (max, e) => (!max || e.amount > max.amount ? e : max),
      null
    )

    const insights = buildInsights({
      pulse,
      pace,
      categories: byCategory,
      changes,
      calendar,
      recurring,
      accounts,
      largestExpense,
      currency,
      formatMoney,
    })

    return {
      pulse,
      pace,
      byCategory,
      byAccount,
      changes,
      trend,
      calendar,
      recurring,
      accounts,
      insights,
      compareLabel: pace.timing.isCurrent
        ? `vs first ${pace.timing.elapsedDays} days of ${prevLabel}`
        : `vs ${prevLabel}`,
    }
  }, [
    balances,
    cardCreditLimit,
    currency,
    expenses,
    formatMoney,
    getExpenseSourceId,
    historyExpenses,
    incomes,
    insightLedger,
    monthKey,
    prevKey,
    prevLabel,
    sourceBalance,
    sourceName,
    sources,
    transfers,
  ])

  return (
    <div className="space-y-4 lg:space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            asChild
            variant="secondary"
            size="icon"
            className="shrink-0 rounded-full md:hidden"
          >
            <Link href="/app" aria-label="Back to overview">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Analytics
            </h1>
            <p className="text-sm text-muted-foreground">{monthLabel}</p>
          </div>
        </div>
        <MonthSwitcher
          monthKey={monthKey}
          basePath="/app/analytics"
          short
          expenses={expenses}
          currency={currency}
        />
      </header>

      <nav
        aria-label="Analytics sections"
        className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0"
      >
        {SECTION_LINKS.map((link, index) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className="shrink-0 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <span className="mr-1 tabular-nums opacity-60">{index + 1}</span>
            {link.label}
          </a>
        ))}
      </nav>

      <div className="grid gap-4 lg:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.45fr)] xl:items-start">
        <div className="@container min-w-0 space-y-4 lg:space-y-5">
          <AnalyticsPulse
            pulse={data.pulse}
            balance={ready ? totalLiquidBalance : 0}
            currency={currency}
            prevLabel={prevLabel}
          />

          <div className="grid gap-4 lg:gap-5 @4xl:grid-cols-12">
            <AnalyticsSection
              id="flow"
              index={2}
              title="Money Flow"
              question="Where did money come from and where did it go?"
              className="@4xl:col-span-5 @4xl:row-span-2"
            >
              <ActivityFlowChart
                expenses={expenses}
                expenseTotal={expenseTotal}
                incomes={incomes}
                incomeTotal={incomeTotal}
                currency={currency}
                monthKey={monthKey}
                insightLedger={insightLedger}
              />
            </AnalyticsSection>

            <AnalyticsPace
              pace={data.pace}
              currency={currency}
              prevLabel={prevLabel}
              className="@4xl:col-span-7"
            />

            <AnalyticsBreakdown
              monthKey={monthKey}
              currency={currency}
              total={expenseTotal}
              byCategory={data.byCategory}
              byAccount={data.byAccount}
              className="@4xl:col-span-7"
            />
          </div>

          <div className="grid gap-4 lg:gap-5 @4xl:grid-cols-2">
            <AnalyticsChanges
              trend={data.trend}
              changes={data.changes}
              currency={currency}
              compareLabel={data.compareLabel}
            />
            <AnalyticsCalendar
              monthKey={monthKey}
              calendar={data.calendar}
              currency={currency}
            />
          </div>
        </div>

        <aside className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start lg:gap-5 xl:grid-cols-1">
          <AnalyticsCommitments
            monthKey={monthKey}
            recurring={data.recurring}
            accounts={data.accounts}
            expenseTotal={expenseTotal}
            currency={currency}
          />
          <AnalyticsInsights insights={data.insights} />
        </aside>
      </div>
    </div>
  )
}
