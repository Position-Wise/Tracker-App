import { TrackAnalyticsClient } from "@track/components/track-analytics-client"
import { insightFetchBounds } from "@track/lib/insight-series"
import { monthRangeBounds, parseMonthKey, shiftMonthKey } from "@track/lib/month"
import {
  ensureTrackProfile,
  getMonthSummary,
  listExpensesBetween,
  listIncomesForMonth,
  listLedgerBetween,
  listTransfersForMonth,
} from "@track/lib/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const TREND_MONTHS = 6
const HISTORY_MONTHS = 3

type PageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function TrackAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const monthKey = parseMonthKey(params.month)
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const yearBounds = insightFetchBounds(monthKey)
  const trendStart = monthRangeBounds(
    shiftMonthKey(monthKey, -(TREND_MONTHS - 1))
  ).startIso
  const ledgerStart =
    trendStart < yearBounds.startIso ? trendStart : yearBounds.startIso
  const historyStart = monthRangeBounds(
    shiftMonthKey(monthKey, -HISTORY_MONTHS)
  ).startIso
  const { startIso: monthStart } = monthRangeBounds(monthKey)

  const profile = await ensureTrackProfile(supabase, user.id)
  const [summary, incomes, transfers, ledger, history] = await Promise.all([
    getMonthSummary(supabase, user.id, monthKey, profile.preferred_currency),
    listIncomesForMonth(supabase, user.id, monthKey),
    listTransfersForMonth(supabase, user.id, monthKey),
    listLedgerBetween(supabase, user.id, ledgerStart, yearBounds.endIso),
    listExpensesBetween(supabase, user.id, historyStart, monthStart),
  ])
  const incomeTotal = incomes.reduce((sum, row) => sum + row.amount, 0)

  return (
    <TrackAnalyticsClient
      monthKey={monthKey}
      currency={summary.currency}
      expenseTotal={summary.total}
      incomeTotal={incomeTotal}
      expenses={summary.expenses}
      historyExpenses={history}
      incomes={incomes.map((row) => ({
        title: row.title,
        amount: row.amount,
        toSourceId: row.to_source_id,
        occurredAt: row.occurred_at,
      }))}
      transfers={transfers.map((row) => ({
        amount: row.amount,
        fromSourceId: row.from_source_id,
        toSourceId: row.to_source_id,
        purpose: row.purpose,
      }))}
      insightLedger={ledger}
    />
  )
}
