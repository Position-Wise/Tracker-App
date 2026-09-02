import { AccountsCarouselView } from "@track/components/accounts-carousel-view"
import { listRecentExpenses } from "@track/lib/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function resolveHolderName(
  user: {
    email?: string | null
    user_metadata?: Record<string, unknown>
  },
  profileName?: string | null
) {
  const meta = user.user_metadata ?? {}
  const given =
    typeof meta.given_name === "string" ? meta.given_name.trim() : ""
  const family =
    typeof meta.family_name === "string" ? meta.family_name.trim() : ""
  const combined = [given, family].filter(Boolean).join(" ")
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    combined
  if (fromMeta) return fromMeta
  if (profileName?.trim()) return profileName.trim()
  return user.email?.split("@")[0]?.replaceAll(/[._]/g, " ").trim() || ""
}

export default async function TrackAccountsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: profile }, recentAcross] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    listRecentExpenses(supabase, user.id),
  ])

  return (
    <AccountsCarouselView
      recentAcross={recentAcross}
      holderName={resolveHolderName(user, profile?.full_name)}
    />
  )
}
