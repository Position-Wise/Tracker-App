import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getCurrentUserAccessState } from "@/lib/subscription-access"
import { getProtectedRouteRedirectPath } from "@/lib/subscription-status"
import { getCachedCurrentUserAccess } from "@/lib/cached-access"
import { resolveRoute } from "@/lib/route-access"
import { resolveTenantRedirectUrl } from "@/lib/tenant-redirect"

interface TipsLayoutProps {
  children: ReactNode
}

export default async function TipsLayout({ children }: TipsLayoutProps) {
  const routeAccess = await getCachedCurrentUserAccess()
  const tenantRedirect = await resolveTenantRedirectUrl(routeAccess)
  if (tenantRedirect) {
    redirect(tenantRedirect)
  }
  const routeRedirect = resolveRoute(routeAccess)

  if (routeRedirect) {
    redirect(routeRedirect)
  }

  const access = await getCurrentUserAccessState()

  if (!access.user) {
    redirect("/sign-in")
  }

  const redirectPath = getProtectedRouteRedirectPath(access.status)

  if (redirectPath) {
    redirect(redirectPath)
  }

  return <>{children}</>
}

