import {
  deriveCurrentUserAccessState,
  fetchCurrentUserSubscription,
  resolveCurrentUserAdminState,
  type AccessQueryClient,
} from "@/lib/current-user-access"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { resolveRoute } from "@/lib/route-access"
import { getProtectedRouteRedirectPath } from "@/lib/subscription-status"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveTenantRedirectUrl } from "@/lib/tenant-redirect"
import { resolveTrackPlatformRedirectUrl } from "@/lib/resolve-track-platform-url"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

export async function resolvePostLoginRedirectHref(
  supabase: SupabaseServerClient
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return "/sign-in"
  }

  const routeAccess = await getCurrentUserAccess(supabase)
  const tenantRedirect = await resolveTenantRedirectUrl(routeAccess, {
    path: "/dashboard",
    supabase,
    // Org members who signed in on track (or other reserved hosts) still go to their tenant.
    allowFromReservedHost: true,
  })
  if (tenantRedirect) {
    return tenantRedirect
  }

  // No org membership → Track product host (or stay if already there).
  if (!routeAccess.organizationId && !routeAccess.isOwner) {
    return resolveTrackPlatformRedirectUrl("/app")
  }

  const routeRedirect = resolveRoute(routeAccess)
  if (routeRedirect) {
    return routeRedirect
  }

  const organizationId = routeAccess.organizationId
  const client = supabase as unknown as AccessQueryClient

  const [{ isAdmin, role, source }, subscription] = await Promise.all([
    resolveCurrentUserAdminState(client, user.id),
    fetchCurrentUserSubscription(client, user.id, organizationId),
  ])

  const derived = deriveCurrentUserAccessState({
    user,
    role,
    isAdmin,
    adminResolutionSource: source,
    subscription,
  })

  const subscriptionRedirect = getProtectedRouteRedirectPath(derived.status)
  if (subscriptionRedirect) {
    return subscriptionRedirect
  }

  return "/dashboard"
}
