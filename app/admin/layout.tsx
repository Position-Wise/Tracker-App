import type { Metadata } from "next"
import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { noIndexRobots } from "@/lib/seo"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCachedCurrentUserAccess } from "@/lib/cached-access"
import { resolveTenantRedirectUrl } from "@/lib/tenant-redirect"
import { resolveCurrentUserIsAdmin, type MinimalDbClient } from "./access"
import AdminNav from "./_components/admin-nav"

export const metadata: Metadata = {
  robots: noIndexRobots,
}

interface AdminLayoutProps {
  children: ReactNode
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createSupabaseServerClient()
  const routeAccess = await getCachedCurrentUserAccess()
  const tenantRedirect = await resolveTenantRedirectUrl(routeAccess)
  if (tenantRedirect) {
    redirect(tenantRedirect)
  }
  const userId = routeAccess.user?.id ?? null

  if (!routeAccess.user) {
    redirect("/sign-in")
  }

  if (routeAccess.isOwner && !routeAccess.organizationId) {
    redirect("/admin-select")
  }

  const adminState = userId
    ? await resolveCurrentUserIsAdmin(userId, supabase as unknown as MinimalDbClient)
    : { isAdmin: false }
  const canAccessAdmin =
    routeAccess.isOwner || routeAccess.organizationRole === "org_admin" || adminState.isAdmin

  if (!canAccessAdmin) {
    redirect("/")
  }

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-20 px-6">
      <section className="max-w-6xl mx-auto space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Admin
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold">
          Control Center
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Manage broadcasts, review members, and push quick updates that show up
          in user dashboards.
        </p>
        <AdminNav />
      </section>

      <section className="max-w-6xl mx-auto mt-8">
        {children}
      </section>
    </main>
  )
}

