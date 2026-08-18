import type { Metadata } from "next"
import { ReactNode, Suspense } from "react"
import { redirect } from "next/navigation"
import { DashboardSkeleton } from "@advisory/components/loading/app-skeletons"
import { noIndexRobots } from "@/lib/seo"
import { getCurrentUserAccessState } from "@advisory/lib/subscription-access"
import { getProtectedRouteRedirectPath } from "@advisory/lib/subscription-status"
import { getCachedCurrentUserAccess } from "@/lib/cached-access"
import { resolveRoute } from "@/lib/route-access"
import { resolveTenantRedirectUrl } from "@/lib/tenant-redirect"

export const metadata: Metadata = {
  robots: noIndexRobots,
}

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardAccessGate>{children}</DashboardAccessGate>
    </Suspense>
  )
}

async function DashboardAccessGate({ children }: { children: ReactNode }) {
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
