import { redirect } from "next/navigation"
import { HomeLanding } from "@/components/marketing/home-landing"
import { TrackLanding } from "@/components/track/track-landing"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { getSubdomain } from "@/lib/get-subdomain"
import {
  OWNER_PLATFORM_SUBDOMAIN,
  TRACK_PLATFORM_SUBDOMAIN,
} from "@/lib/reserved-subdomains"
import { resolveTenantRedirectUrl } from "@/lib/tenant-redirect"

export default async function Home() {
  const [access, subdomain] = await Promise.all([getCurrentUserAccess(), getSubdomain()])

  if (!subdomain) {
    const tenantRedirect = await resolveTenantRedirectUrl(access, { path: "/dashboard" })
    if (tenantRedirect) {
      redirect(tenantRedirect)
    }
    if (access.user && access.isOwner) {
      redirect("/owner")
    }
    return <HomeLanding />
  }

  if (subdomain === OWNER_PLATFORM_SUBDOMAIN) {
    if (!access.user) redirect("/sign-in")
    if (!access.isOwner) redirect("/forbidden")
    redirect("/owner")
  }

  // Track is a product host, not a tenant — never org-not-found / waiting.
  if (subdomain === TRACK_PLATFORM_SUBDOMAIN) {
    if (access.user) redirect("/app")
    return <TrackLanding />
  }

  if (access.tenantNotFound) redirect("/organization-not-found")
  if (access.forbidden) redirect("/forbidden")
  if (!access.user) redirect("/sign-in")
  if (access.isOwner) redirect("/owner")
  if (!access.organizationId) redirect("/waiting")

  redirect("/dashboard")
}
