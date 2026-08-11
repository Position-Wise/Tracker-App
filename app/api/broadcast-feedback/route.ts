import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCachedCurrentUserAccess } from "@/lib/cached-access"

type FeedbackPayload = {
  broadcastId?: unknown
  outcome?: unknown
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

  let payload: FeedbackPayload = {}

  try {
    payload = (await request.json()) as FeedbackPayload
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
  }

  const broadcastId = String(payload.broadcastId ?? "").trim()
  const outcome = String(payload.outcome ?? "")
    .trim()
    .toLowerCase()

  if (!broadcastId) {
    return NextResponse.json({ error: "Missing broadcast id." }, { status: 400 })
  }

  if (outcome !== "profit" && outcome !== "loss") {
    return NextResponse.json({ error: "Invalid outcome." }, { status: 400 })
  }

  const db = supabase
  let broadcastQuery = db
    .from("admin_broadcasts")
    .select("id,organization_id")
    .eq("id", broadcastId)
  if (!access.isOwner) {
    broadcastQuery = broadcastQuery.eq("organization_id", organizationId as string)
  }
  const { data: broadcastRow } = await broadcastQuery.maybeSingle()
  if (!broadcastRow) {
    return NextResponse.json({ error: "Broadcast not found." }, { status: 404 })
  }

  const upsertPayload = {
    broadcast_id: broadcastId,
    user_id: user.id,
    organization_id:
      (broadcastRow as { organization_id?: string | null }).organization_id ?? access.organizationId,
    outcome,
  }

  const { error: upsertError } = await db
    .from("broadcast_feedback")
    .upsert(upsertPayload, { onConflict: "broadcast_id,user_id" })

  if (upsertError) {
    return NextResponse.json(
      {
        error: getErrorMessage(upsertError, "Unable to save feedback."),
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    broadcast_id: broadcastId,
    outcome,
  })
}
