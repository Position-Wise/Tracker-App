import {
  deriveCurrentUserAccessState,
  fetchCurrentUserSubscription,
  resolveCurrentUserAdminState,
  type AccessQueryClient,
} from "@/lib/current-user-access"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { getSubdomain } from "@/lib/get-subdomain"
import {
  readAuthIntent,
  sanitizeAuthNext,
  type AuthIntent,
} from "@/lib/auth-intent"
import {
  OWNER_PLATFORM_SUBDOMAIN,
  TRACK_PLATFORM_SUBDOMAIN,
} from "@/lib/reserved-subdomains"
import { resolveRoute } from "@/lib/route-access"
import { getProtectedRouteRedirectPath } from "@advisory/lib/subscription-status"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { resolveTenantRedirectUrl } from "@/lib/tenant-redirect"
import { resolveTrackPlatformRedirectUrl } from "@track/lib/resolve-track-platform-url"

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>

type PostLoginOptions = {
  next?: string | null
  intent?: string | null
}

export async function resolvePostLoginRedirectHref(
  supabase: SupabaseServerClient,
  options?: PostLoginOptions
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return "/sign-in"
  }

  const [routeAccess, subdomain] = await Promise.all([
    getCurrentUserAccess(supabase),
    getSubdomain(),
  ])
  const next = sanitizeAuthNext(options?.next)
  const intent: AuthIntent | null = readAuthIntent(options?.intent)
  const wantsTrack =
    subdomain === TRACK_PLATFORM_SUBDOMAIN ||
    next === "/app" ||
    intent === "track"

  // Track is its own product. Signing in there (or with next=/app) must stay on track,
  // even if the user also has an advisory organisation membership.
  if (wantsTrack) {
    return resolveTrackPlatformRedirectUrl("/app")
  }

  if (subdomain === OWNER_PLATFORM_SUBDOMAIN || (routeAccess.isOwner && !routeAccess.organizationId)) {
    return "/owner"
  }

  const tenantRedirect = await resolveTenantRedirectUrl(routeAccess, {
    path: "/dashboard",
    supabase,
  })
  if (tenantRedirect) {
    return tenantRedirect
  }

  if (routeAccess.isOwner) {
    return "/owner"
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

  if (next === "/subscribe" || next === "/waiting" || next === "/owner") {
    return next
  }

  const subscriptionRedirect = getProtectedRouteRedirectPath(derived.status)
  if (subscriptionRedirect) {
    return subscriptionRedirect
  }

  return "/dashboard"
}
