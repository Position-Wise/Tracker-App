import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import {
  deriveCurrentUserAccessState,
  fetchCurrentUserSubscription,
  resolveCurrentUserAdminState,
  type AccessQueryClient,
} from "@/lib/current-user-access"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import type { MeAuthProfile } from "@/lib/me-auth-profile"

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ profile: null as MeAuthProfile }, { status: 401 })
  }

  const access = await getCurrentUserAccess(supabase)
  const client = supabase as unknown as AccessQueryClient

  const [{ isAdmin, role, source }, subscription] = await Promise.all([
    resolveCurrentUserAdminState(client, user.id),
    fetchCurrentUserSubscription(client, user.id, access.organizationId),
  ])

  const derived = deriveCurrentUserAccessState({
    user,
    role,
    isAdmin,
    adminResolutionSource: source,
    subscription,
  })

  const profile: NonNullable<MeAuthProfile> = {
    role: derived.role,
    plan: derived.planName ?? (derived.isAdmin ? "admin" : null),
    status: derived.status,
    accessState: derived.accessState,
    isAdmin: derived.isAdmin,
    isOwner: access.isOwner,
  }

  return NextResponse.json({ profile })
}
