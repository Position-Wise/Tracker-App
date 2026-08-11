import { TrackOverviewDashboard } from "@/components/track/track-overview-dashboard"
import { parseMonthKey } from "@/lib/track/month"
import {
  ensureTrackProfile,
  getMonthSummary,
  incomeToActivity,
  listCategories,
  listIncomesForMonth,
  listTransfersForMonth,
  transferToActivity,
} from "@/lib/track/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function TrackOverviewPage({ searchParams }: PageProps) {
  const params = await searchParams
  const monthKey = parseMonthKey(params.month)
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const profile = await ensureTrackProfile(supabase, user.id)
  const [summary, categories, incomes, transfers] = await Promise.all([
    getMonthSummary(supabase, user.id, monthKey, profile.preferred_currency),
    listCategories(supabase, user.id),
    listIncomesForMonth(supabase, user.id, monthKey),
    listTransfersForMonth(supabase, user.id, monthKey),
  ])

  const incomeTotal = incomes.reduce((sum, row) => sum + row.amount, 0)

  return (
    <TrackOverviewDashboard
      monthKey={monthKey}
      currency={summary.currency}
      expenseTotal={summary.total}
      incomeTotal={incomeTotal}
      byCategory={summary.byCategory}
      recent={summary.recent}
      income={incomes.map(incomeToActivity)}
      transfers={transfers.map(transferToActivity)}
      categories={categories}
    />
  )
}
