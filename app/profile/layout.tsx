import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { getSubdomain } from "@/lib/get-subdomain"
import { TRACK_PLATFORM_SUBDOMAIN } from "@/lib/reserved-subdomains"
import { resolveRoute } from "@/lib/route-access"
import { resolveTenantRedirectUrl } from "@/lib/tenant-redirect"

interface ProfileLayoutProps {
  children: ReactNode
}

export default async function ProfileLayout({
  children,
}: ProfileLayoutProps) {
  const supabase = await createSupabaseServerClient()
  const [routeAccess, subdomain] = await Promise.all([
    getCurrentUserAccess(supabase),
    getSubdomain(),
  ])

  if (!routeAccess.user) {
    redirect("/sign-in")
  }

  // Track host: auth only — no org / subscription gate.
  if (subdomain === TRACK_PLATFORM_SUBDOMAIN) {
    return <>{children}</>
  }

  const tenantRedirect = await resolveTenantRedirectUrl(routeAccess)
  if (tenantRedirect) {
    redirect(tenantRedirect)
  }
  const routeRedirect = resolveRoute(routeAccess)
  if (routeRedirect) {
    redirect(routeRedirect)
  }

  return <>{children}</>
}
