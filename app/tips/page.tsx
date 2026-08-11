import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUserAccessState } from "@/lib/subscription-access"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"

function normalizePlanName(plan: string | null) {
  const normalized = (plan ?? "").toLowerCase()
  if (normalized === "admin") return "admin"
  if (normalized === "premium" || normalized === "elite") return "premium"
  if (normalized === "pro" || normalized === "growth") return "pro"
  return "basic"
}

type OrganizationMembershipRow = {
  organizations?:
    | {
        id?: string | null
        name?: string | null
      }
    | {
        id?: string | null
        name?: string | null
      }[]
    | null
}

function getOrganizationNameFromMembershipRow(row: OrganizationMembershipRow | null) {
  if (!row?.organizations) return null
  const organizations = Array.isArray(row.organizations)
    ? row.organizations[0]
    : row.organizations
  const name = (organizations?.name ?? "").trim()
  return name || null
}

export default async function TipsPage() {
  const supabase = await createSupabaseServerClient()
  const routeAccess = await getCurrentUserAccess(supabase)
  const access = await getCurrentUserAccessState(supabase)
  const user = access.user

  if (!user) {
    return null
  }
  if (routeAccess.tenantNotFound) {
    redirect("/organization-not-found")
  }
  if (routeAccess.forbidden) {
    redirect("/forbidden")
  }
  if (!routeAccess.organizationId && !routeAccess.isOwner) {
    redirect("/waiting")
  }

  let organizationName = "All Organizations"
  if (routeAccess.organizationId) {
    const { data: organizationRow } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", routeAccess.organizationId)
      .maybeSingle()

    const directName = (organizationRow?.name ?? "").trim()
    if (directName) {
      organizationName = directName
    } else {
      const { data: membershipRow } = await supabase
        .from("organization_memberships")
        .select(
          `
            organization_id,
            organizations:organization_id (
              id,
              name
            )
          `
        )
        .eq("user_id", user.id)
        .eq("organization_id", routeAccess.organizationId)
        .maybeSingle()
      organizationName =
        getOrganizationNameFromMembershipRow(
          (membershipRow as OrganizationMembershipRow | null) ?? null
        ) ?? "Organization"

      if (organizationName === "Organization") {
        const serviceRoleClient = createSupabaseServiceRoleClient()
        if (serviceRoleClient) {
          const { data: serviceOrgRow } = await serviceRoleClient
            .from("organizations")
            .select("id,name")
            .eq("id", routeAccess.organizationId)
            .maybeSingle()
          const serviceName = (serviceOrgRow?.name ?? "").trim()
          if (serviceName) {
            organizationName = serviceName
          }
        }
      }
    }
  }

  const tier = normalizePlanName(access.planName ?? (access.isAdmin ? "admin" : null))
  const canSeePro = tier === "pro" || tier === "premium" || tier === "admin"
  const canSeePremium = tier === "premium" || tier === "admin"

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-20 px-6">
      <section className="max-w-5xl mx-auto space-y-4">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground/80">
          Member Tips
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold">
          Strategy tips aligned to your tier.
        </h1>
        <p className="inline-flex rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          Organization: {organizationName}
        </p>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
          You are currently on the{" "}
          <span className="font-medium text-foreground">
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </span>{" "}
          plan. These modules are a simple demo of how content and access can
          scale with membership.
        </p>
      </section>

      <section className="max-w-5xl mx-auto mt-10 grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Basic: Core Discipline
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>- Define a maximum portfolio drawdown you are willing to accept.</p>
            <p>- Separate long-term allocations from short-term experiments.</p>
            <p>- Review positions on a fixed schedule, not on headlines.</p>
          </CardContent>
        </Card>

        <Card className={!canSeePro ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="text-base">
              Pro: Playbook Structuring
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            {canSeePro ? (
              <>
                <p>- Map each strategy to clear regime conditions.</p>
                <p>- Use risk buckets (core / satellite / opportunistic).</p>
                <p>- Size entries by volatility, not comfort level.</p>
              </>
            ) : (
              <p>
                Upgrade to the <span className="font-medium">Pro</span> tier
                to unlock structured strategy templates and risk buckets.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className={!canSeePremium ? "opacity-60" : ""}>
          <CardHeader>
            <CardTitle className="text-base">
              Premium: Institutional Overlay
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            {canSeePremium ? (
              <>
                <p>- Align reporting with institutional-style risk committees.</p>
                <p>- Run scenario analysis for funding and liquidity shocks.</p>
                <p>- Maintain a live playbook for de-risking and re-risking.</p>
              </>
            ) : (
              <p>
                Premium content demonstrates how deeper strategy, oversight, and
                committee-ready reporting can be layered onto your portfolio.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}