import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCachedCurrentUserAccess } from "@/lib/cached-access"

type TradeUsagePayload = {
  broadcastIds?: unknown
}

type TradeUsageRow = {
  broadcast_id?: string | null
}

function getStartOfWeekIso() {
  const date = new Date()
  const currentDay = date.getUTCDay()
  const daysSinceMonday = (currentDay + 6) % 7
  date.setUTCDate(date.getUTCDate() - daysSinceMonday)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

function normalizeBroadcastIds(value: unknown) {
  if (!Array.isArray(value)) return []

  const deduped = new Set<string>()
  for (const item of value) {
    if (typeof item !== "string") continue
    const normalized = item.trim()
    if (!normalized) continue
    if (normalized.length > 100) continue
    deduped.add(normalized)
    if (deduped.size >= 50) break
  }

  return Array.from(deduped)
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const access = await getCachedCurrentUserAccess()
  const user = access.user

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (access.forbidden) {
    return NextResponse.json({ error: "Forbidden for this organization." }, { status: 403 })
  }
  if (!access.organizationId && !access.isOwner) {
    return NextResponse.json({ error: "Organization not assigned." }, { status: 403 })
  }
  const organizationId = access.organizationId

  let payload: TradeUsagePayload = {}
  try {
    payload = (await request.json()) as TradeUsagePayload
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }

  const broadcastIds = normalizeBroadcastIds(payload.broadcastIds)
  if (!broadcastIds.length) {
    return NextResponse.json({ ok: true, inserted: 0 })
  }

  const db = supabase
  const weekStartIso = getStartOfWeekIso()
  let broadcastsQuery = db
    .from("admin_broadcasts")
    .select("id,organization_id")
    .in("id", broadcastIds)
  if (!access.isOwner) {
    broadcastsQuery = broadcastsQuery.eq("organization_id", organizationId as string)
  }
  const { data: allowedBroadcastRows } = await broadcastsQuery
  const allowedById = new Map<string, string | null>()
  for (const row of
    ((allowedBroadcastRows as { id?: string | null; organization_id?: string | null }[] | null) ??
      [])) {
    const id = (row.id ?? "").trim()
    if (!id) continue
    allowedById.set(id, row.organization_id ?? null)
  }
  const allowedBroadcastIds = broadcastIds.filter((id) => allowedById.has(id))
  if (!allowedBroadcastIds.length) {
    return NextResponse.json({ ok: true, inserted: 0 })
  }

  let existingUsageQuery = db
    .from("trade_usage")
    .select("broadcast_id")
    .eq("user_id", user.id)
    .gte("created_at", weekStartIso)
    .in("broadcast_id", allowedBroadcastIds)
  if (!access.isOwner) {
    existingUsageQuery = existingUsageQuery.eq("organization_id", organizationId as string)
  }
  const { data: existingRows, error: existingError } = await existingUsageQuery

  if (existingError) {
    return NextResponse.json({ error: "Unable to check trade usage." }, { status: 500 })
  }

  const existingSet = new Set<string>()
  for (const row of (existingRows as TradeUsageRow[] | null) ?? []) {
    const broadcastId = (row.broadcast_id ?? "").trim()
    if (!broadcastId) continue
    existingSet.add(broadcastId)
  }

  const rowsToInsert = allowedBroadcastIds
    .filter((broadcastId) => !existingSet.has(broadcastId))
    .map((broadcastId) => ({
      user_id: user.id,
      broadcast_id: broadcastId,
      organization_id: allowedById.get(broadcastId) ?? access.organizationId,
    }))

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await db.from("trade_usage").insert(rowsToInsert)
    if (insertError) {
      return NextResponse.json({ error: "Unable to update trade usage." }, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    inserted: rowsToInsert.length,
  })
}
