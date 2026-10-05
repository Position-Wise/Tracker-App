import { redirect } from "next/navigation"
import { TrackProfileForm } from "@track/components/track-profile-form"
import { toMonthKey } from "@track/lib/month"
import {
  ensureTrackProfile,
  getFirstExpenseAt,
  getMonthSummary,
  listCategories,
  listIncomesForMonth,
} from "@track/lib/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in?next=/profile")

  const profile = await ensureTrackProfile(supabase, user.id)
  const monthKey = toMonthKey()
  const [summary, incomes, firstExpenseAt, categories] = await Promise.all([
    getMonthSummary(supabase, user.id, monthKey, profile.preferred_currency),
    listIncomesForMonth(supabase, user.id, monthKey),
    getFirstExpenseAt(supabase, user.id),
    listCategories(supabase, user.id),
  ])
  const incomeTotal = incomes.reduce((sum, row) => sum + row.amount, 0)
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Member"
  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture || null
  const trackingSince = firstExpenseAt ?? user.created_at

  return (
    <div className="min-h-dvh bg-white dark:bg-(--brand-charcoal)">
      <div className="mx-auto w-full max-w-lg px-3 pb-28 md:px-6 md:pb-12">
        <TrackProfileForm
          profile={profile}
          displayName={displayName}
          email={user.email ?? ""}
          avatarUrl={avatarUrl}
          monthlyIncome={incomeTotal}
          totalExpense={summary.total}
          currency={profile.preferred_currency}
          trackingSince={trackingSince}
          categories={categories}
        />
      </div>
    </div>
  )
}
