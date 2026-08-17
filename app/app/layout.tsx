import type { Metadata } from "next"
import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { noIndexRobots } from "@/lib/seo"
import { TrackAppClientShell } from "@/components/track/track-app-client-shell"
import { getSubdomain } from "@/lib/get-subdomain"
import { TRACK_PLATFORM_SUBDOMAIN } from "@/lib/reserved-subdomains"
import {
  computeSourceBalances,
  ensureDefaultMoneySource,
  ensureTrackProfile,
  listCategories,
  listCreditLimitPools,
  listMoneySources,
} from "@/lib/track/queries"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  robots: noIndexRobots,
}

interface TrackAppLayoutProps {
  children: ReactNode
}

export default async function TrackAppLayout({ children }: TrackAppLayoutProps) {
  const subdomain = await getSubdomain()
  if (subdomain !== TRACK_PLATFORM_SUBDOMAIN) {
    redirect("/")
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in?next=/app")
  }

  const profile = await ensureTrackProfile(supabase, user.id)
  await ensureDefaultMoneySource(
    supabase,
    user.id,
    profile.preferred_currency
  )
  const [sources, creditLimitPools, categories] = await Promise.all([
    listMoneySources(supabase, user.id),
    listCreditLimitPools(supabase, user.id),
    listCategories(supabase, user.id),
  ])
  const balances = await computeSourceBalances(supabase, user.id, sources)

  return (
    <TrackAppClientShell
      currency={profile.preferred_currency}
      sources={sources}
      creditLimitPools={creditLimitPools}
      balances={balances}
      categories={categories}
    >
      <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-16 sm:px-6 md:pb-12 md:pt-8">
        {children}
      </div>
    </TrackAppClientShell>
  )
}
