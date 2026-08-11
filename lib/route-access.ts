import type { CurrentUserAccess } from "@/lib/current-user-access"

export function resolveRoute(access: CurrentUserAccess) {
  if (!access.user) return "/sign-in"
  if (access.tenantNotFound) return "/organization-not-found"
  if (access.forbidden) return "/forbidden"
  if (!access.organizationId && !access.isOwner) return "/waiting"
  return null
}
