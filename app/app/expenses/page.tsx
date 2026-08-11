import { TrackExpensesClient } from "@/components/track/track-expenses-client"
import { parseMonthKey } from "@/lib/track/month"
import {
  ensureTrackProfile,
  incomeToActivity,
  listCategories,
  listExpensesForMonth,
  listIncomesForMonth,
  listTransfersForMonth,
  transferToActivity,
} from "@/lib/track/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

type PageProps = {
  searchParams: Promise<{ month?: string }>
}

export default async function TrackExpensesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const monthKey = parseMonthKey(params.month)
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const profile = await ensureTrackProfile(supabase, user.id)
  const [expenses, categories, incomes, transfers] = await Promise.all([
    listExpensesForMonth(supabase, user.id, monthKey),
    listCategories(supabase, user.id),
    listIncomesForMonth(supabase, user.id, monthKey),
    listTransfersForMonth(supabase, user.id, monthKey),
  ])

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <TrackExpensesClient
      monthKey={monthKey}
      currency={profile.preferred_currency}
      total={total}
      expenses={expenses}
      categories={categories}
      income={incomes.map(incomeToActivity)}
      transfers={transfers.map(transferToActivity)}
    />
  )
}
