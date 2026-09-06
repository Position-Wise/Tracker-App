import { TrackAnalyticsClient } from "@track/components/track-analytics-client"
import { parseMonthKey } from "@track/lib/month"
import {
  ensureTrackProfile,
  getMonthSummary,
  listIncomesForMonth,
  listInsightLedger,
} from "@track/lib/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

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

  const profile = await ensureTrackProfile(supabase, user.id)
  const [summary, incomes, insightLedger] = await Promise.all([
    getMonthSummary(supabase, user.id, monthKey, profile.preferred_currency),
    listIncomesForMonth(supabase, user.id, monthKey),
    listInsightLedger(supabase, user.id, monthKey),
  ])
  const incomeTotal = incomes.reduce((sum, row) => sum + row.amount, 0)

  return (
    <TrackAnalyticsClient
      monthKey={monthKey}
      currency={summary.currency}
      expenseTotal={summary.total}
      incomeTotal={incomeTotal}
      expenses={summary.expenses}
      incomes={incomes.map((row) => ({ title: row.title, amount: row.amount }))}
      insightLedger={insightLedger}
    />
  )
}
