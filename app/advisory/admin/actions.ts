"use server"

import { revalidatePath } from "next/cache"
import { PAYMENT_PROOFS_BUCKET } from "@advisory/lib/payment-proof-storage"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import {
  calculateBroadcastExpiration,
  normalizeBroadcastAudienceType,
  normalizeBroadcastExpiryOption,
  normalizeTargetUserIds,
  resolveLegacyBroadcastFieldsFromAudienceType,
  resolveLegacyDurationFromExpiryOption,
} from "@advisory/lib/broadcast-audience"
import { isAdminRole } from "@/lib/roles"
import {
  BROADCAST_AUDIENCES,
  BROADCAST_DURATIONS,
  BROADCAST_TYPES,
  ROLES,
  STATUSES,
} from "./helpers"
import {
  resolveCurrentUserIsAdmin,
  type MinimalDbClient,
} from "./access"

const ADMIN_ROUTES_TO_REVALIDATE = [
  "/admin",
  "/admin/broadcast",
  "/admin/market-data",
  "/admin/subscriptions",
  "/admin/plans",
  "/admin/users",
  "/subscribe",
  "/waiting",
  "/dashboard",
  "/tips",
  "/profile",
]

function normalizeAudience(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase()
  if (BROADCAST_AUDIENCES.includes(normalized as (typeof BROADCAST_AUDIENCES)[number])) {
    return normalized
  }
  return "all"
}

function normalizeDuration(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase()
  if (BROADCAST_DURATIONS.includes(normalized as (typeof BROADCAST_DURATIONS)[number])) {
    return normalized
  }
  return "forever"
}

function normalizeBroadcastType(
  value: string | null
): "trade" | "investment" | "announcement" {
  const normalized = (value ?? "").trim().toLowerCase()
  if (BROADCAST_TYPES.includes(normalized as (typeof BROADCAST_TYPES)[number])) {
    return normalized as "trade" | "investment" | "announcement"
  }
  return "investment"
}

async function getCallerAccess() {
  const supabase = await createSupabaseServerClient()
  const routeAccess = await getCurrentUserAccess(supabase)
  const user = routeAccess.user

  if (!user) {
    return {
      supabase,
      callerRole: null as string | null,
      canAccessAdminPanel: false,
      isOwner: false,
      organizationId: null as string | null,
      userId: null as string | null,
    }
  }

  const { role } = await resolveCurrentUserIsAdmin(
    user.id,
    supabase as unknown as MinimalDbClient
  )
  const canAccessAdminPanel =
    routeAccess.isOwner ||
    routeAccess.organizationRole === "org_admin" ||
    isAdminRole(role)

  return {
    supabase,
    callerRole: role ?? null,
    canAccessAdminPanel,
    isOwner: routeAccess.isOwner,
    organizationId: routeAccess.organizationId,
    userId: user.id,
  }
}

function normalizeRole(value: string | null) {
  let normalized = (value ?? "").trim().toLowerCase()
  if (normalized === "user") {
    normalized = "customer"
  }
  if (
    !normalized ||
    normalized === "none" ||
    normalized === "null" ||
    normalized === "__current__"
  ) {
    return null
  }
  if (ROLES.includes(normalized as (typeof ROLES)[number])) {
    return normalized
  }
  if (normalized === "master_admin") {
    return normalized
  }
  return null
}

function normalizeStatus(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase()
  if (
    !normalized ||
    normalized === "none" ||
    normalized === "null" ||
    normalized === "__current__"
  ) {
    return null
  }
  if (STATUSES.includes(normalized as (typeof STATUSES)[number])) {
    return normalized
  }
  return null
}

function revalidateAdminRoutes() {
  ADMIN_ROUTES_TO_REVALIDATE.forEach((path) => revalidatePath(path))
}

function normalizeDateInput(value: string | null) {
  const normalized = (value ?? "").trim()
  if (!normalized) return null

  const parsed = new Date(`${normalized}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function normalizeMarketSymbol(value: string | null) {
  const normalized = (value ?? "").trim().toUpperCase()
  if (!normalized) return null
  if (normalized.length > 20) return null
  if (!/^[A-Za-z0-9^.\-=&]+$/.test(normalized)) return null
  return normalized
}

function normalizeSortOrder(value: string | null) {
  const parsed = Number((value ?? "").trim())
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.floor(parsed))
}

type ResolvedBroadcastInput = {
  title: string | null
  message: string
  audienceType: "announcement" | "trader" | "investor" | "users" | null
  targetUserIds: string[] | null
  audience: string
  broadcastType: "trade" | "investment" | "announcement"
  duration: string
  expiresAt: string | null
}

function resolveBroadcastInput(formData: FormData): ResolvedBroadcastInput | null {
  const title = (formData.get("title") as string | null)?.trim() ?? ""
  const message = (formData.get("message") as string | null)?.trim() ?? ""

  if (!message) {
    return null
  }

  const rawAudienceType = formData.get("audienceType") as string | null
  const hasNewTargetingFields =
    rawAudienceType !== null ||
    formData.has("expiryOption") ||
    formData.getAll("targetUserIds").length > 0

  if (hasNewTargetingFields) {
    const audienceType = normalizeBroadcastAudienceType(rawAudienceType)
    if (!audienceType) {
      return null
    }

    const legacyFields = resolveLegacyBroadcastFieldsFromAudienceType(audienceType)
    if (!legacyFields) {
      return null
    }

    const expiryOption =
      normalizeBroadcastExpiryOption(formData.get("expiryOption") as string | null) ?? "none"
    const targetUserIds =
      audienceType === "users"
        ? normalizeTargetUserIds(formData.getAll("targetUserIds"))
        : []

    if (audienceType === "users" && !targetUserIds.length) {
      return null
    }

    return {
      title: title || null,
      message,
      audienceType,
      targetUserIds: audienceType === "users" ? targetUserIds : null,
      audience: legacyFields.audience,
      broadcastType: legacyFields.broadcastType,
      duration: resolveLegacyDurationFromExpiryOption(expiryOption),
      expiresAt: calculateBroadcastExpiration(expiryOption)?.toISOString() ?? null,
    }
  }

  const audience = normalizeAudience(formData.get("audience") as string | null)
  const broadcastType = normalizeBroadcastType(
    ((formData.get("broadcastType") as string | null) ?? "investment")
  )
  const duration = normalizeDuration(formData.get("duration") as string | null)

  return {
    title: title || null,
    message,
    audienceType: null,
    targetUserIds: null,
    audience,
    broadcastType,
    duration,
    expiresAt: calculateBroadcastExpiration(
      duration === "week"
        ? "1w"
        : duration === "month"
          ? "1m"
          : duration === "year"
            ? "1y"
            : duration === "24h"
              ? "24h"
              : "none"
    )?.toISOString() ?? null,
  }
}

type UpdateUserAccessResult =
  | { ok: true }
  | {
      ok: false
      error: string
    }

type DeleteUserResult =
  | { ok: true }
  | {
      ok: false
      error: string
    }

async function updateUserAccessInternal(formData: FormData): Promise<UpdateUserAccessResult> {
  const userId = formData.get("userId") as string | null
  const targetRole = normalizeRole(formData.get("role") as string | null)
  const status = normalizeStatus(formData.get("status") as string | null)
  const subscriptionEndDateRaw = (
    (formData.get("subscriptionEndDate") as string | null) ?? ""
  ).trim()
  const subscriptionEndDate = normalizeDateInput(subscriptionEndDateRaw)

  const requestedPlanIdRaw = (
    ((formData.get("planId") as string | null) ??
      (formData.get("plan") as string | null) ??
      "")
  ).trim()
  const requestedPlanId =
    requestedPlanIdRaw && requestedPlanIdRaw !== "__current__"
      ? requestedPlanIdRaw
      : null

  if (!userId) {
    return { ok: false, error: "Missing user id." }
  }

  if (!status) {
    return { ok: false, error: "Missing subscription status." }
  }

  if (subscriptionEndDateRaw && !subscriptionEndDate) {
    return { ok: false, error: "Invalid subscription end date." }
  }

  const { supabase, canAccessAdminPanel, organizationId } = await getCallerAccess()

  if (!canAccessAdminPanel) {
    return { ok: false, error: "Only admins can update users." }
  }

  if (!organizationId) {
    return { ok: false, error: "No organization context." }
  }

  const db = supabase

  if (targetRole) {
    const { error: roleError } = await db
      .from("profiles")
      .update({ role: targetRole })
      .eq("id", userId)

    if (roleError) {
      console.error("Role update error:", roleError)
      return { ok: false, error: roleError.message ?? "Failed to update role." }
    }
  }

  const subscriptionPayload: Record<string, string | null> = {
    user_id: userId,
    status,
    organization_id: organizationId,
  }

  if (requestedPlanId) {
    subscriptionPayload.subscription_plan_id = requestedPlanId
  }

  if (subscriptionEndDate) {
    subscriptionPayload.ends_at = subscriptionEndDate
  }

  const subscriptionWrite = await db
    .from("user_subscriptions")
    .upsert(subscriptionPayload, { onConflict: "user_id,organization_id" })

  if (subscriptionWrite.error) {
    console.error("Subscription update error:", subscriptionWrite.error)
    return {
      ok: false,
      error: subscriptionWrite.error.message ?? "Failed to update subscription.",
    }
  }

  revalidateAdminRoutes()
  return { ok: true }
}

export async function updateUserAccess(formData: FormData): Promise<void> {
  await updateUserAccessInternal(formData)
}

export async function updateUserAccessWithResult(
  formData: FormData
): Promise<UpdateUserAccessResult> {
  return updateUserAccessInternal(formData)
}

function normalizeUserId(value: string | null | undefined) {
  return (value ?? "").trim()
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message.trim()) {
      return message
    }
  }
  return fallback
}

async function deletePaymentProofsViaStorageApi(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
): Promise<DeleteUserResult> {
  const bucket = supabase.storage.from(PAYMENT_PROOFS_BUCKET)
  const limit = 100
  let offset = 0
  const objectPaths: string[] = []

  while (offset <= 5000) {
    const { data, error } = await bucket.list(userId, {
      limit,
      offset,
    })

    if (error) {
      const message = getErrorMessage(error, "").toLowerCase()
      if (message.includes("not found") || message.includes("does not exist")) {
        return { ok: true }
      }
      return {
        ok: false,
        error: getErrorMessage(error, "Failed to load user payment proof files."),
      }
    }

    const rows = Array.isArray(data) ? data : []
    if (!rows.length) {
      break
    }

    rows.forEach((row) => {
      const name = typeof row.name === "string" ? row.name.trim() : ""
      if (!name) return
      objectPaths.push(`${userId}/${name}`)
    })

    if (rows.length < limit) {
      break
    }

    offset += limit
  }

  if (!objectPaths.length) {
    return { ok: true }
  }

  for (let index = 0; index < objectPaths.length; index += 100) {
    const batch = objectPaths.slice(index, index + 100)
    const { error } = await bucket.remove(batch)
    if (error) {
      return {
        ok: false,
        error: getErrorMessage(error, "Failed to delete user payment proof files."),
      }
    }
  }

  return { ok: true }
}

export async function deleteUserWithResult(userId: string): Promise<DeleteUserResult> {
  const targetUserId = normalizeUserId(userId)
  if (!targetUserId) {
    return { ok: false, error: "Missing user id." }
  }

  const { supabase, isOwner, userId: callerUserId } = await getCallerAccess()
  if (!isOwner) {
    return {
      ok: false,
      error: "Only the platform owner can permanently delete a user.",
    }
  }

  if (callerUserId && callerUserId === targetUserId) {
    return { ok: false, error: "You cannot remove your own account." }
  }

  const storageDeleteResult = await deletePaymentProofsViaStorageApi(supabase, targetUserId)
  if (!storageDeleteResult.ok) {
    return storageDeleteResult
  }

  const { error } = await supabase.rpc("erase_user_by_owner", {
    p_user_id: targetUserId,
  })

  if (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Failed to delete the user."),
    }
  }

  revalidateAdminRoutes()
  return { ok: true }
}

export async function publishBroadcast(formData: FormData): Promise<void> {
  const resolvedInput = resolveBroadcastInput(formData)
  if (!resolvedInput) return

  const { supabase, canAccessAdminPanel, organizationId, userId } = await getCallerAccess()

  if (!canAccessAdminPanel || !userId || !organizationId) return

  const db = supabase

  const insertPayload = {
    title: resolvedInput.title,
    message: resolvedInput.message,
    audience: resolvedInput.audience,
    audience_type: resolvedInput.audienceType,
    target_user_ids: resolvedInput.targetUserIds,
    broadcast_type: resolvedInput.broadcastType,
    duration: resolvedInput.duration,
    expires_at: resolvedInput.expiresAt,
    created_by: userId,
    organization_id: organizationId,
  }

  const { error } = await db.from("admin_broadcasts").insert(insertPayload)

  // Backward compatibility when created_by and/or broadcast_type are not present yet.
  if (error) {
    const { error: fallbackError } = await db.from("admin_broadcasts").insert({
      title: resolvedInput.title,
      message: resolvedInput.message,
      audience: resolvedInput.audience,
      audience_type: resolvedInput.audienceType,
      target_user_ids: resolvedInput.targetUserIds,
      broadcast_type: resolvedInput.broadcastType,
      duration: resolvedInput.duration,
      expires_at: resolvedInput.expiresAt,
      organization_id: organizationId,
    })

    if (fallbackError) {
      await db.from("admin_broadcasts").insert({
        title: resolvedInput.title,
        message: resolvedInput.message,
        audience: resolvedInput.audience,
        audience_type: resolvedInput.audienceType,
        target_user_ids: resolvedInput.targetUserIds,
        duration: resolvedInput.duration,
        expires_at: resolvedInput.expiresAt,
        organization_id: organizationId,
      })
    }
  }

  revalidateAdminRoutes()
}

export async function publishQuickUpdate(formData: FormData): Promise<void> {
  const proxyFormData = new FormData()

  proxyFormData.set("title", (formData.get("title") as string | null) ?? "")
  proxyFormData.set("message", (formData.get("message") as string | null) ?? "")
  proxyFormData.set("audienceType", (formData.get("audienceType") as string | null) ?? "")
  proxyFormData.set("expiryOption", (formData.get("expiryOption") as string | null) ?? "none")

  for (const userId of formData.getAll("targetUserIds")) {
    if (typeof userId !== "string") continue
    proxyFormData.append("targetUserIds", userId)
  }

  await publishBroadcast(proxyFormData)
}

export async function updateBroadcast(formData: FormData): Promise<void> {
  const broadcastId = (formData.get("broadcastId") as string | null)?.trim() ?? ""
  const resolvedInput = resolveBroadcastInput(formData)

  if (!broadcastId || !resolvedInput) return

  const { supabase, canAccessAdminPanel, organizationId } = await getCallerAccess()
  if (!canAccessAdminPanel || !organizationId) return

  const db = supabase

  const { error } = await db
    .from("admin_broadcasts")
    .update({
      title: resolvedInput.title,
      message: resolvedInput.message,
      audience: resolvedInput.audience,
      audience_type: resolvedInput.audienceType,
      target_user_ids: resolvedInput.targetUserIds,
      broadcast_type: resolvedInput.broadcastType,
      duration: resolvedInput.duration,
      expires_at: resolvedInput.expiresAt,
    })
    .eq("id", broadcastId)
    .eq("organization_id", organizationId)

  if (error) {
    const { error: fallbackError } = await db
      .from("admin_broadcasts")
      .update({
        title: resolvedInput.title,
        message: resolvedInput.message,
        audience: resolvedInput.audience,
        audience_type: resolvedInput.audienceType,
        target_user_ids: resolvedInput.targetUserIds,
        duration: resolvedInput.duration,
        expires_at: resolvedInput.expiresAt,
      })
      .eq("id", broadcastId)
      .eq("organization_id", organizationId)

    if (fallbackError) {
      await db
        .from("admin_broadcasts")
        .update({
          title: resolvedInput.title,
          message: resolvedInput.message,
          audience: resolvedInput.audience,
          audience_type: resolvedInput.audienceType,
          target_user_ids: resolvedInput.targetUserIds,
        })
        .eq("id", broadcastId)
        .eq("organization_id", organizationId)
    }
  }

  revalidateAdminRoutes()
}

export async function deleteBroadcast(formData: FormData): Promise<void> {
  const broadcastId = (formData.get("broadcastId") as string | null)?.trim() ?? ""
  if (!broadcastId) return

  const { supabase, canAccessAdminPanel, organizationId } = await getCallerAccess()
  if (!canAccessAdminPanel || !organizationId) return

  const db = supabase
  await db
    .from("admin_broadcasts")
    .delete()
    .eq("id", broadcastId)
    .eq("organization_id", organizationId)

  revalidateAdminRoutes()
}

export async function createMarketSymbol(formData: FormData): Promise<void> {
  const symbol = normalizeMarketSymbol(formData.get("symbol") as string | null)
  const displayName = ((formData.get("displayName") as string | null) ?? "").trim()
  const sortOrder = normalizeSortOrder(formData.get("sortOrder") as string | null)
  const isActive = normalizeBoolean(formData.get("isActive") as string | null)

  if (!symbol) return

  const { supabase, canAccessAdminPanel, organizationId, userId } = await getCallerAccess()
  if (!canAccessAdminPanel || !userId || !organizationId) return

  const db = supabase
  await db.from("market_symbols").insert({
    symbol,
    display_name: displayName || symbol,
    sort_order: sortOrder,
    is_active: isActive,
    organization_id: organizationId,
    created_by: userId,
    updated_by: userId,
  })

  revalidateAdminRoutes()
}

export async function updateMarketSymbol(formData: FormData): Promise<void> {
  const id = ((formData.get("id") as string | null) ?? "").trim()
  const symbol = normalizeMarketSymbol(formData.get("symbol") as string | null)
  const displayName = ((formData.get("displayName") as string | null) ?? "").trim()
  const sortOrder = normalizeSortOrder(formData.get("sortOrder") as string | null)
  const isActive = normalizeBoolean(formData.get("isActive") as string | null)

  if (!id || !symbol) return

  const { supabase, canAccessAdminPanel, organizationId, userId } = await getCallerAccess()
  if (!canAccessAdminPanel || !userId || !organizationId) return

  const db = supabase
  await db
    .from("market_symbols")
    .update({
      symbol,
      display_name: displayName || symbol,
      sort_order: sortOrder,
      is_active: isActive,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", organizationId)

  revalidateAdminRoutes()
}

export async function deleteMarketSymbol(formData: FormData): Promise<void> {
  const id = ((formData.get("id") as string | null) ?? "").trim()
  if (!id) return

  const { supabase, canAccessAdminPanel, organizationId } = await getCallerAccess()
  if (!canAccessAdminPanel || !organizationId) return

  const db = supabase
  await db
    .from("market_symbols")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId)

  revalidateAdminRoutes()
}

function normalizeBoolean(value: string | null) {
  return (value ?? "").toLowerCase() === "true"
}

function normalizeTradeLimit(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase()
  if (!normalized || normalized === "unlimited") return null

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.floor(parsed))
}

async function updatePlanPermissions(params: {
  planId: string
  allowTrade: boolean
  allowInvestment: boolean
  tradeLimitPerWeek: number | null
  description?: string | null
}) {
  const { supabase, canAccessAdminPanel } = await getCallerAccess()

  if (!canAccessAdminPanel) return

  const db = supabase
  const updatePayload: Record<string, unknown> = {
    allow_trade: params.allowTrade,
    allow_investment: params.allowInvestment,
    trade_limit_per_week: params.tradeLimitPerWeek,
  }

  if (typeof params.description === "string") {
    updatePayload.description = params.description || null
  }

  const { error } = await db
    .from("subscription_plans")
    .update(updatePayload)
    .eq("id", params.planId)

  if (error) {
    const { error: fallbackError } = await db
      .from("subscription_plans")
      .update({
        allow_trade: params.allowTrade,
        trade_limit_per_week: params.tradeLimitPerWeek,
      })
      .eq("id", params.planId)

    if (fallbackError) {
      console.error("Plan permission update error:", fallbackError)
    }
  }

  revalidateAdminRoutes()
}

export async function updateSubscriptionPlanPermissions(formData: FormData): Promise<void> {
  const planId = (formData.get("planId") as string | null)?.trim() ?? ""

  if (!planId) return

  const allowTrade = normalizeBoolean(formData.get("allowTrade") as string | null)
  const allowInvestment = normalizeBoolean(formData.get("allowInvestment") as string | null)
  const tradeLimitPerWeek = normalizeTradeLimit(formData.get("tradeLimitPerWeek") as string | null)

  await updatePlanPermissions({
    planId,
    allowTrade,
    allowInvestment,
    tradeLimitPerWeek,
  })
}

async function createPlan(params: {
  name: string
  description?: string | null
  planType: "trader" | "investor" | "both"
  allowTrade: boolean
  allowInvestment: boolean
  tradeLimitPerWeek: number
}) {
  const { supabase, canAccessAdminPanel, organizationId } = await getCallerAccess()

  if (!canAccessAdminPanel || !organizationId) return

  const name = params.name.trim()
  if (!name) return

  const insertPayload = {
    name,
    description: params.description || null,
    plan_type: params.planType,
    organization_id: organizationId,

    allow_trade: params.allowTrade,
    allow_investment: params.allowInvestment,
    trade_limit_per_week: params.tradeLimitPerWeek,

    is_public: true,
    // is_active: true,
  }

  const { error } = await supabase
    .from("subscription_plans")
    .insert(insertPayload)

  if (error) {
    console.error("Create plan error:", error)
  }

  revalidateAdminRoutes()
}

export async function addPlan(formData: FormData): Promise<void> {
  const name = (formData.get("name") as string | null)?.trim() ?? ""
  const description = (formData.get("description") as string | null) ?? null

  const allowTrade =
    (formData.get("allowTrade") as string | null) === "true"

  const allowInvestment =
    (formData.get("allowInvestment") as string | null) === "true"

  const tradeLimitRaw = formData.get("tradeLimit") as string | null
  const tradeLimitPerWeek = tradeLimitRaw ? Number(tradeLimitRaw) : 0

  if (!name) return

  // derive planType from switches
  let planType: "trader" | "investor" | "both" = "trader"

  if (allowTrade && allowInvestment) {
    planType = "both"
  } else if (allowInvestment) {
    planType = "investor"
  } else {
    planType = "trader"
  }

  await createPlan({
    name,
    description,
    planType,
    tradeLimitPerWeek,
    allowTrade,
    allowInvestment,
  })
}

export async function updatePlan(formData: FormData): Promise<void> {
  const planId = (formData.get("planId") as string | null)?.trim() ?? ""

  if (!planId) return

  const allowTrade = normalizeBoolean(formData.get("allowTrade") as string | null)
  const allowInvestment = normalizeBoolean(formData.get("allowInvestment") as string | null)
  const tradeLimitPerWeek = normalizeTradeLimit(
    (formData.get("tradeLimit") as string | null) ??
      (formData.get("tradeLimitPerWeek") as string | null)
  )
  const description = ((formData.get("description") as string | null) ?? "").trim()

  await updatePlanPermissions({
    planId,
    allowTrade,
    allowInvestment,
    tradeLimitPerWeek,
    description,
  })
}



