import { NextResponse } from "next/server"
import { fetchBroadcastFeedbackSummary } from "@/app/admin/queries"
import { resolveCurrentUserIsAdmin, type MinimalDbClient } from "@/app/admin/access"
import {
  getCachedCurrentUserAccess,
  getCachedSupabaseServerClient,
} from "@/lib/cached-access"

export async function GET(request: Request) {
  const [access, supabase] = await Promise.all([
    getCachedCurrentUserAccess(),
    getCachedSupabaseServerClient(),
  ])

  if (!access.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminState = await resolveCurrentUserIsAdmin(
    access.user.id,
    supabase as unknown as MinimalDbClient
  )
  const canAccessAdmin =
    access.isOwner || access.organizationRole === "org_admin" || adminState.isAdmin

  if (!canAccessAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const idsParam = searchParams.get("ids") ?? ""
  const broadcastIds = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 100)

  const summary = await fetchBroadcastFeedbackSummary(broadcastIds)
  return NextResponse.json(summary)
}
