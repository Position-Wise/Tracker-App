import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "@/lib/supabase/server"
import { getCachedCurrentUserAccess } from "@/lib/cached-access"
import { resolvePaymentProofUrlsForRecords } from "@/lib/payment-proof-storage"
import type {
  BroadcastRow,
  InquiryRow,
  MarketSymbolRow,
  ProfileRow,
  SubscriptionPlanRow,
} from "./types"

function toSubscriptionsArray(
  value: unknown
): NonNullable<ProfileRow["user_subscriptions"]> {
  if (Array.isArray(value)) {
    return value as NonNullable<ProfileRow["user_subscriptions"]>
  }

  if (value && typeof value === "object") {
    return [value as NonNullable<ProfileRow["user_subscriptions"]>[number]]
  }

  return []
}

function toSubscriptionPlansArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
  }

  if (value && typeof value === "object") {
    return [value]
  }

  return []
}

function normalizeProfileRow(profile: ProfileRow): ProfileRow {
  const subscriptions = toSubscriptionsArray(profile.user_subscriptions).map((subscription) => ({
    ...subscription,
    subscription_plans: toSubscriptionPlansArray(subscription.subscription_plans),
  }))

  return {
    ...profile,
    user_subscriptions: subscriptions.slice(0, 1),
  }
}

async function fetchAdminEmailsByUserId(profileIds: string[]) {
  const serviceRoleClient = createSupabaseServiceRoleClient()

  if (!serviceRoleClient || !profileIds.length) {
    return {} as Record<string, string | null>
  }

  const uniqueIds = Array.from(new Set(profileIds.map((id) => id.trim()).filter(Boolean)))
  const emailsByUserId: Record<string, string | null> = {}

  await Promise.all(
    uniqueIds.map(async (userId) => {
      const { data, error } = await serviceRoleClient.auth.admin.getUserById(userId)
      if (error) {
        console.error(`Admin auth user lookup failed for ${userId}:`, error)
        emailsByUserId[userId] = null
        return
      }

      const email = typeof data.user?.email === "string" ? data.user.email.trim() : ""
      emailsByUserId[userId] = email || null
    })
  )

  return emailsByUserId
}

export async function fetchAdminProfiles() {
  const supabase = await createSupabaseServerClient()
  const access = await getCachedCurrentUserAccess()
  if (!access.user) return []
  if (!access.organizationId) {
    return []
  }

  const { data: membershipRowsWithProfiles, error: membershipRowsWithProfilesError } = await supabase
    .from("organization_memberships")
    .select(
      `
        user_id,
        role,
        profiles (
          id,
          full_name,
          avatar_url,
          role
        )
      `
    )
    .eq("organization_id", access.organizationId)
    .order("role", { ascending: true })

  type MembershipWithProfileRow = {
    user_id?: string | null
    role?: string | null
    profiles?:
      | {
          id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
        }
      | {
          id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
        }[]
      | null
  }

  let memberProfileRows: ProfileRow[] = []
  let memberUserIds: string[] = []

  if (!membershipRowsWithProfilesError) {
    for (const row of (membershipRowsWithProfiles as MembershipWithProfileRow[] | null) ?? []) {
      const userId = (row.user_id ?? "").trim()
      if (!userId) continue
      memberUserIds.push(userId)

      const nestedProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
      if (!nestedProfile) continue
      const profileId = (nestedProfile.id ?? "").trim()
      if (!profileId) continue

      memberProfileRows.push({
        id: profileId,
        full_name: nestedProfile.full_name ?? null,
        avatar_url: nestedProfile.avatar_url ?? null,
        role: nestedProfile.role ?? null,
        email: null,
        user_subscriptions: [],
      } as ProfileRow)
    }
  }

  if (membershipRowsWithProfilesError) {
    // Fallback for environments where the FK relation for nested profiles is missing.
    const { data: memberships, error: membershipsError } = await supabase
      .from("organization_memberships")
      .select("user_id")
      .eq("organization_id", access.organizationId)
    if (membershipsError) {
      console.error("Organization memberships query failed:", membershipsError)
      return []
    }

    memberUserIds = ((memberships as { user_id?: string | null }[] | null) ?? [])
      .map((row) => (row.user_id ?? "").trim())
      .filter(Boolean)

    if (!memberUserIds.length) return []

    const { data: directProfiles, error: directProfilesError } = await supabase
      .from("profiles")
      .select("id,full_name,avatar_url,role")
      .in("id", memberUserIds)
      .order("full_name", { ascending: true })
    if (directProfilesError) {
      console.error("Profiles fallback query failed:", directProfilesError)
      return []
    }

    memberProfileRows = (directProfiles as ProfileRow[] | null) ?? []
  }

  memberUserIds = memberUserIds
    .filter(Boolean)
  if (!memberUserIds.length) return []

  const [subscriptionsResult, plansResult] = await Promise.all([
    supabase
      .from("user_subscriptions")
      .select(
        `
          id,
          user_id,
          status,
          subscription_plan_id,
          payment_proof,
          submitted_at,
          started_at,
          ends_at,
          created_at,
          updated_at
        `
      )
      .in("user_id", memberUserIds)
      .eq("organization_id", access.organizationId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("subscription_plans")
      .select("id,name,description")
      .or(`organization_id.eq.${access.organizationId},organization_id.is.null`),
  ])

  if (subscriptionsResult.error) {
    console.error("User subscriptions query failed:", subscriptionsResult.error)
  }

  if (plansResult.error) {
    console.error("Subscription plans query failed:", plansResult.error)
  }

  const uniqueProfilesById = new Map<string, ProfileRow>()
  for (const profile of memberProfileRows) {
    const profileId = (profile.id ?? "").trim()
    if (!profileId || uniqueProfilesById.has(profileId)) continue
    uniqueProfilesById.set(profileId, profile)
  }
  const profiles = Array.from(uniqueProfilesById.values()).sort((a, b) =>
    (a.full_name ?? "").localeCompare(b.full_name ?? "")
  )
  const emailsByUserId = await fetchAdminEmailsByUserId(
    profiles.map((profile) => profile.id)
  )

  const plansById = (((plansResult.data as SubscriptionPlanRow[] | null) ?? [])).reduce<
    Record<string, { id?: string; name?: string | null; description?: string | null }>
  >((acc, plan) => {
    const id = (plan.id ?? "").trim()
    if (!id) return acc

    acc[id] = {
      id,
      name: plan.name ?? null,
      description: plan.description ?? null,
    }
    return acc
  }, {})

  const subscriptionsByUserId = new Map<
    string,
    NonNullable<ProfileRow["user_subscriptions"]>[number]
  >()

  const rawSubscriptions = ((subscriptionsResult.data as {
    id?: string | null
    user_id?: string | null
    status?: string | null
    subscription_plan_id?: string | null
    payment_proof?: string | null
    submitted_at?: string | null
    started_at?: string | null
    ends_at?: string | null
    created_at?: string | null
    updated_at?: string | null
  }[] | null) ?? [])

  const subscriptionsWithSignedProofs = await resolvePaymentProofUrlsForRecords(rawSubscriptions)

  for (const subscription of subscriptionsWithSignedProofs) {
    const userId = (subscription.user_id ?? "").trim()
    if (!userId || subscriptionsByUserId.has(userId)) continue

    const planId = (subscription.subscription_plan_id ?? "").trim()
    const plan = planId ? plansById[planId] ?? null : null

    subscriptionsByUserId.set(userId, {
      id: subscription.id ?? undefined,
      status: subscription.status ?? null,
      subscription_plan_id: subscription.subscription_plan_id ?? null,
      payment_proof: subscription.payment_proof ?? null,
      submitted_at: subscription.submitted_at ?? null,
      started_at: subscription.started_at ?? null,
      ends_at: subscription.ends_at ?? null,
      created_at: subscription.created_at ?? null,
      updated_at: subscription.updated_at ?? null,
      subscription_plans: plan ? [plan] : [],
    })
  }

  return profiles.map((profile) =>
    normalizeProfileRow({
      ...profile,
      email: emailsByUserId[profile.id] ?? null,
      user_subscriptions: subscriptionsByUserId.has(profile.id)
        ? [subscriptionsByUserId.get(profile.id)!]
        : [],
    })
  )
}

export async function fetchAdminSubscriptionPlans() {
  const supabase = await createSupabaseServerClient()
  const access = await getCachedCurrentUserAccess()
  if (!access.user || !access.organizationId) return []

  const { data } = await supabase
    .from("subscription_plans")
    .select("id,name,is_public,plan_type,organization_id")
    .or(`organization_id.eq.${access.organizationId},organization_id.is.null`)
    .order("name", { ascending: true })

  return ((data as SubscriptionPlanRow[] | null) ?? []).filter((plan) => {
    const normalized = (plan.name ?? "").trim().toLowerCase()
    return Boolean(normalized)
  })
}

export async function fetchAdminPlanSettings() {
  const supabase = await createSupabaseServerClient()
  const access = await getCachedCurrentUserAccess()
  if (!access.user) return []
  if (access.forbidden) return []
  if (!access.organizationId) return []

  const { data } = await supabase
    .from("subscription_plans")
    .select(
      "id,name,description,is_public,plan_type,organization_id,allow_trade,allow_investment,trade_limit_per_week,created_at,updated_at"
    )
    .eq("organization_id", access.organizationId)
    .order("name", { ascending: true })

  return ((data as SubscriptionPlanRow[] | null) ?? []).filter((plan) => {
    const normalized = (plan.name ?? "").trim().toLowerCase()
    return Boolean(normalized)
  })
}

export async function fetchAdminBroadcasts(limit = 20) {
  const supabase = await createSupabaseServerClient()
  const access = await getCachedCurrentUserAccess()
  if (!access.user) return []
  if (access.forbidden) return []
  if (!access.organizationId) return []
  const organizationId = access.organizationId
  const broadcastSelect = `
      id,
      title,
      message,
      audience,
      audience_type,
      target_user_ids,
      broadcast_type,
      created_by,
      duration,
      expires_at,
      created_at,
      profiles:created_by (
        full_name
      )
    `

  let broadcastQuery = supabase
    .from("admin_broadcasts")
    .select(broadcastSelect)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (organizationId) {
    broadcastQuery = broadcastQuery.eq("organization_id", organizationId as string)
  }
  const { data, error } = await broadcastQuery

  if (error) {
    let fallbackQuery = supabase
      .from("admin_broadcasts")
      .select(
        `
          id,
          title,
          message,
          audience,
          audience_type,
          target_user_ids,
          broadcast_type,
          created_by,
          duration,
          expires_at,
          created_at
        `
      )
      .order("created_at", { ascending: false })
      .limit(limit)
    if (organizationId) {
      fallbackQuery = fallbackQuery.eq("organization_id", organizationId as string)
    }
    const { data: fallbackRows } = await fallbackQuery

    return (fallbackRows as BroadcastRow[] | null) ?? []
  }

  return (data as BroadcastRow[] | null) ?? []
}

export async function fetchAdminInquiries() {
  const supabase = await createSupabaseServerClient()
  const access = await getCachedCurrentUserAccess()
  if (!access.user) return []
  if (!access.organizationId) return []

  const { data, error } = await supabase
    .from("inquiries")
    .select(
      `
        id,
        user_id,
        type,
        message,
        metadata,
        status,
        created_at,
        profiles (
          full_name,
          avatar_url
        )
      `
    )
    .eq("organization_id", access.organizationId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Inquiries query failed:", error)
    return []
  }

  return (data as InquiryRow[] | null) ?? []
}

export async function fetchAdminMarketSymbols() {
  const supabase = await createSupabaseServerClient()
  const access = await getCachedCurrentUserAccess()
  if (!access.user) return []
  if (!access.organizationId) return []

  const { data } = await supabase
    .from("market_symbols")
    .select("id,symbol,display_name,is_active,sort_order,created_at,updated_at")
    .eq("organization_id", access.organizationId)
    .order("sort_order", { ascending: true })
    .order("display_name", { ascending: true })

  return ((data as MarketSymbolRow[] | null) ?? []).filter((row) => {
    const symbol = (row.symbol ?? "").trim()
    return Boolean(symbol)
  })
}

export async function fetchBroadcastFeedbackSummary(broadcastIds?: string[]) {
  const supabase = await createSupabaseServerClient()
  const access = await getCachedCurrentUserAccess()
  if (!access.user) return {}
  if (access.forbidden) return {}
  if (!access.organizationId) return {}
  const organizationId = access.organizationId
  const normalizedIds = (broadcastIds ?? []).map((id) => id.trim()).filter(Boolean)

  let query = supabase.from("broadcast_feedback").select("broadcast_id,outcome")
  if (organizationId) {
    query = query.eq("organization_id", organizationId as string)
  }

  if (normalizedIds.length) {
    query = query.in("broadcast_id", normalizedIds)
  }

  const { data, error } = await query
  if (error) {
    console.error("Broadcast feedback summary query failed:", error)
    return {}
  }

  const summary: Record<
    string,
    {
      profit: number
      loss: number
      total: number
      efficiency: number
    }
  > = {}

  for (const row of (data as { broadcast_id?: string | null; outcome?: string | null }[] | null) ?? []) {
    const broadcastId = (row.broadcast_id ?? "").trim()
    if (!broadcastId) continue

    if (!summary[broadcastId]) {
      summary[broadcastId] = {
        profit: 0,
        loss: 0,
        total: 0,
        efficiency: 0,
      }
    }

    const outcome = (row.outcome ?? "").trim().toLowerCase()
    if (outcome === "profit") {
      summary[broadcastId].profit += 1
      summary[broadcastId].total += 1
      continue
    }

    if (outcome === "loss") {
      summary[broadcastId].loss += 1
      summary[broadcastId].total += 1
    }
  }

  Object.keys(summary).forEach((broadcastId) => {
    const total = summary[broadcastId].total
    summary[broadcastId].efficiency =
      total > 0 ? Math.round((summary[broadcastId].profit / total) * 100) : 0
  })

  return summary
}
