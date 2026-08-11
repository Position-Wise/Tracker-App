import { getBroadcastAuthorName } from "@/app/admin/helpers"
import type {
  DashboardBroadcast,
  DashboardSuggestion,
} from "@/components/dashboard/dashboard-tab-view"
import {
  isBroadcastExpiredWithFallback,
  normalizeBroadcastType,
  normalizePlanAudienceKey,
  resolveDashboardBroadcastPlacement,
} from "@/lib/broadcast-audience"
import type { CurrentUserAccess, CurrentUserAccessState } from "@/lib/current-user-access"
import type { SupabaseServerClient } from "@/lib/supabase/server"

type BroadcastRow = {
  id: string
  title: string | null
  message: string
  audience: string | null
  audience_type?: string | null
  target_user_ids?: string[] | null
  broadcast_type?: string | null
  created_by?: string | null
  profiles?:
    | { full_name?: string | null }
    | { full_name?: string | null }[]
    | null
  expires_at?: string | null
  duration?: string | null
  created_at: string | null
}

type PlanFeatureRow = {
  allow_trade?: boolean | null
  allow_investment?: boolean | null
  trade_limit_per_week?: number | null
  name?: string | null
}

const PLAN_FEATURES_SELECT = "id,name,allow_trade,allow_investment,trade_limit_per_week"

function defaultAllowTrade(planName: string) {
  return planName === "pro" || planName === "premium" || planName === "admin"
}

function defaultAllowInvestment(planName: string) {
  return planName !== "new"
}

async function resolvePlanFeatures(
  supabase: SupabaseServerClient,
  access: CurrentUserAccessState,
  organizationId: string | null
) {
  const fallbackPlanName = normalizePlanAudienceKey(
    access.planName ?? (access.isAdmin ? "admin" : "basic")
  )
  const userPlanId = access.planId
  let planRow: PlanFeatureRow | null = null

  if (userPlanId) {
    let planByIdQuery = supabase
      .from("subscription_plans")
      .select(PLAN_FEATURES_SELECT)
      .eq("id", userPlanId)
    if (organizationId) {
      planByIdQuery = planByIdQuery.or(
        `organization_id.eq.${organizationId},organization_id.is.null`
      )
    } else {
      planByIdQuery = planByIdQuery.is("organization_id", null)
    }
    const { data } = await planByIdQuery.maybeSingle()
    planRow = (data as PlanFeatureRow | null) ?? null
  }

  if (!planRow) {
    let planByNameQuery = supabase
      .from("subscription_plans")
      .select(PLAN_FEATURES_SELECT)
      .ilike("name", fallbackPlanName)
    if (organizationId) {
      planByNameQuery = planByNameQuery.or(
        `organization_id.eq.${organizationId},organization_id.is.null`
      )
    } else {
      planByNameQuery = planByNameQuery.is("organization_id", null)
    }
    const { data } = await planByNameQuery.maybeSingle()
    planRow = (data as PlanFeatureRow | null) ?? null
  }

  const normalizedPlan = normalizePlanAudienceKey(planRow?.name ?? fallbackPlanName)
  const isApprovedAccess = access.accessState === "approved"
  const allowTrade = isApprovedAccess
    ? typeof planRow?.allow_trade === "boolean"
      ? planRow.allow_trade
      : defaultAllowTrade(normalizedPlan)
    : false
  const allowInvestment = isApprovedAccess
    ? typeof planRow?.allow_investment === "boolean"
      ? planRow.allow_investment
      : defaultAllowInvestment(normalizedPlan)
    : false

  return { normalizedPlan, allowTrade, allowInvestment }
}

export async function loadDashboardBroadcastFeed(params: {
  supabase: SupabaseServerClient
  access: CurrentUserAccessState
  routeAccess: CurrentUserAccess
}) {
  const { supabase, access, routeAccess } = params
  const user = access.user
  if (!user) {
    return { broadcasts: [] as DashboardBroadcast[], suggestions: [] as DashboardSuggestion[] }
  }

  const activeOrganizationId = routeAccess.organizationId
  const hasOrgScopedView = Boolean(activeOrganizationId)
  const { normalizedPlan, allowTrade, allowInvestment } = await resolvePlanFeatures(
    supabase,
    access,
    activeOrganizationId
  )

  const broadcastSelect = `
      id,
      title,
      message,
      audience,
      audience_type,
      target_user_ids,
      broadcast_type,
      created_by,
      expires_at,
      duration,
      created_at,
      profiles:created_by (
        full_name
      )
    `

  let broadcastQuery = supabase
    .from("admin_broadcasts")
    .select(broadcastSelect)
    .order("created_at", { ascending: false })
    .limit(60)
  if (hasOrgScopedView) {
    broadcastQuery = broadcastQuery.eq("organization_id", activeOrganizationId as string)
  }
  const { data: broadcastRowsWithMeta, error: broadcastRowsWithMetaError } = await broadcastQuery

  const broadcastRows = broadcastRowsWithMetaError
    ? (
        await (() => {
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
            expires_at,
            duration,
            created_at
          `
            )
            .order("created_at", { ascending: false })
            .limit(60)
          if (hasOrgScopedView) {
            fallbackQuery = fallbackQuery.eq("organization_id", activeOrganizationId as string)
          }
          return fallbackQuery
        })()
      ).data
    : broadcastRowsWithMeta

  const broadcasts: DashboardBroadcast[] = []
  const suggestions: DashboardSuggestion[] = []

  for (const row of (broadcastRows as BroadcastRow[] | null) ?? []) {
    if (!row.message) continue
    if (
      !access.isAdmin &&
      isBroadcastExpiredWithFallback({
        expiresAt: row.expires_at,
        duration: row.duration,
        createdAt: row.created_at,
      })
    ) {
      continue
    }

    const placement = resolveDashboardBroadcastPlacement({
      audience: row.audience,
      audienceType: row.audience_type,
      targetUserIds: row.target_user_ids,
      broadcastType: row.broadcast_type,
      isAdmin: access.isAdmin,
      planName: normalizedPlan,
      allowTrade,
      allowInvestment,
      userId: user.id,
    })

    if (!placement) continue

    const baseBroadcast = {
      id: row.id,
      title: row.title,
      message: row.message,
      posted_by_name: getBroadcastAuthorName(row.profiles),
      created_at: row.created_at,
    }

    if (placement.kind === "suggestion") {
      suggestions.push(baseBroadcast)
      continue
    }

    broadcasts.push({
      ...baseBroadcast,
      audience: row.audience,
      broadcast_type: normalizeBroadcastType(row.broadcast_type),
      dashboard_tab: placement.tab,
      user_feedback: null,
    })
  }

  const broadcastIds = broadcasts.map((broadcast) => broadcast.id)
  const feedbackByBroadcast: Record<string, "profit" | "loss"> = {}

  if (broadcastIds.length && !access.isAdmin) {
    let feedbackQuery = supabase
      .from("broadcast_feedback")
      .select("broadcast_id,outcome")
      .eq("user_id", user.id)
      .in("broadcast_id", broadcastIds)
    if (hasOrgScopedView) {
      feedbackQuery = feedbackQuery.eq("organization_id", activeOrganizationId as string)
    }
    const { data: feedbackRows } = await feedbackQuery

    for (const row of (feedbackRows as { broadcast_id?: string | null; outcome?: string | null }[] | null) ?? []) {
      const broadcastId = (row.broadcast_id ?? "").trim()
      const outcome = (row.outcome ?? "").trim().toLowerCase()
      if (!broadcastId) continue
      if (outcome !== "profit" && outcome !== "loss") continue
      feedbackByBroadcast[broadcastId] = outcome
    }
  }

  const broadcastsWithFeedback = broadcasts.map((broadcast) => ({
    ...broadcast,
    user_feedback: feedbackByBroadcast[broadcast.id] ?? null,
  }))

  return {
    broadcasts: broadcastsWithFeedback,
    suggestions,
  }
}
