import type { Metadata } from "next"
import { ReactNode, Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { AdvisoryProfileSkeleton } from "@advisory/components/loading/app-skeletons"
import { TrackProfileSkeleton } from "@track/components/track-skeletons"
import { noIndexRobots } from "@/lib/seo"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { getSubdomain } from "@/lib/get-subdomain"
import { TRACK_PLATFORM_SUBDOMAIN } from "@/lib/reserved-subdomains"
import { resolveRoute } from "@/lib/route-access"
import { resolveTenantRedirectUrl } from "@/lib/tenant-redirect"

export const metadata: Metadata = {
  robots: noIndexRobots,
}

interface ProfileLayoutProps {
  children: ReactNode
}

export default async function ProfileLayout({
  children,
}: ProfileLayoutProps) {
  const product = (await headers()).get("x-product")
  const fallback =
    product === "track" ? <TrackProfileSkeleton /> : <AdvisoryProfileSkeleton />

  return (
    <Suspense fallback={fallback}>
      <ProfileAccessGate>{children}</ProfileAccessGate>
    </Suspense>
  )
}

async function ProfileAccessGate({ children }: { children: ReactNode }) {
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
