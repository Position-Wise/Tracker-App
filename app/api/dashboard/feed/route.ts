import { NextResponse } from "next/server"
import {
  getCachedCurrentUserAccess,
  getCachedSupabaseServerClient,
} from "@/lib/cached-access"
import { loadDashboardBroadcastFeed } from "@/lib/dashboard-feed"
import { getCurrentUserAccessState } from "@/lib/subscription-access"

export async function GET() {
  const [routeAccess, access, supabase] = await Promise.all([
    getCachedCurrentUserAccess(),
    getCurrentUserAccessState(),
    getCachedSupabaseServerClient(),
  ])

  if (!access.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (routeAccess.forbidden) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (!routeAccess.organizationId && !routeAccess.isOwner) {
    return NextResponse.json({ error: "Organization not assigned." }, { status: 403 })
  }

  const feed = await loadDashboardBroadcastFeed({
    supabase,
    access,
    routeAccess,
  })

  return NextResponse.json(feed)
}
