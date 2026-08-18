import { createSupabaseServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getBroadcastAuthorName } from "@advisory/admin/helpers"
import DashboardTabView, {
  type DashboardBroadcast,
  type DashboardSuggestion,
} from "@advisory/components/dashboard/dashboard-tab-view"
import AskAdminDialog from "@advisory/components/inquiries/ask-admin-dialog"
import LiveMarketBoard from "@advisory/components/dashboard/live-market-board"
import { MANDATORY_MARKET_OPTIONS } from "@advisory/lib/market-symbols"
import {
  getCachedCurrentUserAccess,
  getCachedSupabaseServerClient,
} from "@/lib/cached-access"
import { getCurrentUserAccessState } from "@advisory/lib/subscription-access"
import { getAccessStateLabel } from "@advisory/lib/subscription-status"
import {
  isBroadcastExpiredWithFallback,
  normalizeBroadcastType,
  normalizePlanAudienceKey,
  resolveDashboardBroadcastPlacement,
} from "@advisory/lib/broadcast-audience"

type PlanFeatureRow = {
  id?: string
  name?: string | null
  allow_trade?: boolean | null
  allow_investment?: boolean | null
  trade_limit_per_week?: number | null
}

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
    | {
      full_name?: string | null
    }
    | {
      full_name?: string | null
    }[]
    | null
  expires_at?: string | null
  duration?: string | null
  created_at: string | null
}

type BroadcastFeedbackRow = {
  broadcast_id?: string | null
  user_id?: string | null
  outcome?: string | null
}

type TradeUsageRow = {
  broadcast_id?: string | null
}

type MarketSymbolRow = {
  symbol?: string | null
  display_name?: string | null
}

type OrganizationMembershipRow = {
  organizations?:
    | {
        id?: string | null
        name?: string | null
      }
    | {
        id?: string | null
        name?: string | null
      }[]
    | null
}

const FALLBACK_MARKET_OPTIONS = [
  { symbol: "GC=F", label: "Gold Futures" },
  { symbol: "SI=F", label: "Silver Futures" },
  { symbol: "CL=F", label: "Crude Oil" },
  { symbol: "INR=X", label: "USD/INR" },
]

const PLAN_FEATURES_SELECT = "id,name,allow_trade,allow_investment,trade_limit_per_week"

function defaultAllowTrade(planName: string) {
  return planName === "pro" || planName === "premium" || planName === "admin"
}

function defaultAllowInvestment(planName: string) {
  return planName !== "new"
}

function getStartOfWeekIso() {
  const current = new Date()
  const currentDay = current.getUTCDay()
  const daysSinceMonday = (currentDay + 6) % 7
  current.setUTCDate(current.getUTCDate() - daysSinceMonday)
  current.setUTCHours(0, 0, 0, 0)
  return current.toISOString()
}

function defaultTradeLimitPerWeek(planName: string) {
  if (planName === "new" || planName === "basic") return 0
  if (planName === "pro") return 2
  if (planName === "premium" || planName === "admin") return 99
  return 0
}

function getOrganizationNameFromMembershipRow(row: OrganizationMembershipRow | null) {
  if (!row?.organizations) return null
  const organizations = Array.isArray(row.organizations)
    ? row.organizations[0]
    : row.organizations
  const name = (organizations?.name ?? "").trim()
  return name || null
}

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await getCachedSupabaseServerClient()
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const orgRaw = resolvedSearchParams.org
  const requestedOrgId = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw
  const normalizedRequestedOrgId =
    typeof requestedOrgId === "string" && requestedOrgId.trim()
      ? requestedOrgId.trim()
      : null
  const [routeAccess, access] = await Promise.all([
    getCachedCurrentUserAccess(normalizedRequestedOrgId),
    getCurrentUserAccessState(undefined, normalizedRequestedOrgId),
  ])
  const user = access.user

  if (!user) {
    return null
  }
  if (routeAccess.tenantNotFound) {
    redirect("/organization-not-found")
  }
  if (routeAccess.forbidden) {
    redirect("/forbidden")
  }
  if (!routeAccess.organizationId && !routeAccess.isOwner) {
    redirect("/waiting")
  }
  const activeOrganizationId = routeAccess.organizationId
  const hasOrgScopedView = Boolean(activeOrganizationId)

  let organizationName = "All Organizations"
  if (routeAccess.organizationId) {
    const { data: membershipRow } = await supabase
      .from("organization_memberships")
      .select(
        `
          organization_id,
          organizations:organization_id (
            id,
            name
          )
        `
      )
      .eq("user_id", user.id)
      .eq("organization_id", routeAccess.organizationId)
      .maybeSingle()

    organizationName =
      getOrganizationNameFromMembershipRow(
        (membershipRow as OrganizationMembershipRow | null) ?? null
      ) ?? "Organization"
  }

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
    if (activeOrganizationId) {
      planByIdQuery = planByIdQuery.or(
        `organization_id.eq.${activeOrganizationId},organization_id.is.null`
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
    if (activeOrganizationId) {
      planByNameQuery = planByNameQuery.or(
        `organization_id.eq.${activeOrganizationId},organization_id.is.null`
      )
    } else {
      planByNameQuery = planByNameQuery.is("organization_id", null)
    }
    const { data } = await planByNameQuery.maybeSingle()
    planRow = (data as PlanFeatureRow | null) ?? null
  }

  const normalizedPlan = normalizePlanAudienceKey(planRow?.name ?? fallbackPlanName)
  const isApprovedAccess = access.accessState === "approved"
  const baseAllowTrade =
    typeof planRow?.allow_trade === "boolean"
      ? planRow.allow_trade
      : defaultAllowTrade(normalizedPlan)
  const baseAllowInvestment =
    typeof planRow?.allow_investment === "boolean"
      ? planRow.allow_investment
      : defaultAllowInvestment(normalizedPlan)
  const planTradeLimit =
    typeof planRow?.trade_limit_per_week === "number"
      ? Math.max(0, Math.floor(planRow.trade_limit_per_week))
      : defaultTradeLimitPerWeek(normalizedPlan)
  const allowTrade = isApprovedAccess ? baseAllowTrade : false
  const allowInvestment = isApprovedAccess ? baseAllowInvestment : false
  const tradeLimitPerWeek = allowTrade ? planTradeLimit : 0

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
  const marketSymbolsPromise = supabase
    .from("market_symbols")
    .select("symbol,display_name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("display_name", { ascending: true })

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
  const feedbackRowsPromise =
    broadcastIds.length && !access.isAdmin
      ? (() => {
          let feedbackQuery = supabase
            .from("broadcast_feedback")
            .select("broadcast_id,outcome")
            .eq("user_id", user.id)
            .in("broadcast_id", broadcastIds)
          if (hasOrgScopedView) {
            feedbackQuery = feedbackQuery.eq("organization_id", activeOrganizationId as string)
          }
          return feedbackQuery
        })()
      : Promise.resolve({ data: null })
  const usageRowsPromise =
    tradeLimitPerWeek > 0
      ? (() => {
          let usageQuery = supabase
            .from("trade_usage")
            .select("broadcast_id")
            .eq("user_id", user.id)
            .gte("created_at", getStartOfWeekIso())
          if (hasOrgScopedView) {
            usageQuery = usageQuery.eq("organization_id", activeOrganizationId as string)
          }
          return usageQuery
        })()
      : Promise.resolve({ data: null })

  const [{ data: feedbackRows }, { data: usageRows }, { data: marketSymbolRows }] =
    await Promise.all([feedbackRowsPromise, usageRowsPromise, marketSymbolsPromise])

  for (const row of (feedbackRows as BroadcastFeedbackRow[] | null) ?? []) {
    const broadcastId = (row.broadcast_id ?? "").trim()
    const outcome = (row.outcome ?? "").trim().toLowerCase()

    if (!broadcastId) continue
    if (outcome !== "profit" && outcome !== "loss") continue

    feedbackByBroadcast[broadcastId] = outcome
  }

  const broadcastsWithFeedback = broadcasts.map((broadcast) => ({
    ...broadcast,
    user_feedback: feedbackByBroadcast[broadcast.id] ?? null,
  }))

  const consumedSet = new Set<string>()
  for (const row of (usageRows as TradeUsageRow[] | null) ?? []) {
    const broadcastId = (row.broadcast_id ?? "").trim()
    if (!broadcastId) continue
    consumedSet.add(broadcastId)
  }
  const consumedTradeBroadcastIds = [...consumedSet]
  const tradeConsumedThisWeek = consumedSet.size

  const dbConfiguredSymbols = ((marketSymbolRows as MarketSymbolRow[] | null) ?? [])
    .map((row) => ({
      symbol: (row.symbol ?? "").trim().toUpperCase(),
      label: (row.display_name ?? row.symbol ?? "").trim(),
    }))
    .filter((row) => row.symbol.length > 0)

  const availableSymbols = Array.from(
    new Map(
      [...dbConfiguredSymbols, ...MANDATORY_MARKET_OPTIONS, ...FALLBACK_MARKET_OPTIONS].map(
        (option) => [
          option.symbol,
          {
            symbol: option.symbol,
            label: option.label.trim() || option.symbol,
          },
        ]
      )
    ).values()
  )

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-20 px-6">
      <section className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {organizationName}&apos;s - Dashboard
            </p>
            <h1 className="text-3xl sm:text-4xl font-semibold">
              Invest and Trade workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Switch tabs to view focused content, and read the latest admin
              broadcasts for each segment.
            </p>
            <p className="inline-flex rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              Organization: {organizationName}
            </p>
          </div>

          <AskAdminDialog />
        </div>

        <div className="grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2 text-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Membership tier
            </p>
            <p className="mt-1 text-sm font-medium capitalize">
              {normalizedPlan}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Access status
            </p>
            <p className="mt-1 text-sm font-medium">
              {getAccessStateLabel(access.accessState)}
            </p>
          </div>
        </div>

        <LiveMarketBoard availableSymbols={availableSymbols} />

        <div>
          <DashboardTabView
            broadcasts={broadcastsWithFeedback}
            suggestions={suggestions}
            allowTrade={allowTrade}
            allowInvestment={allowInvestment}
            tradeLimitPerWeek={tradeLimitPerWeek}
            tradeConsumedThisWeek={tradeConsumedThisWeek}
            consumedTradeBroadcastIds={consumedTradeBroadcastIds}
            allowFeedback={!access.isAdmin}
          />
        </div>
      </section>
    </main>
  )
}
