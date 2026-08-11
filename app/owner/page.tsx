import OwnerDashboard from "./owner-dashboard"
import { redirect } from "next/navigation"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { resolveRoute } from "@/lib/route-access"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type OrganizationRow = {
  id: string
  name: string
  slug: string
  subdomain: string
  created_at: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
}

type MembershipRow = {
  user_id: string
  organization_id: string
}

export default async function OwnerPage() {
  const supabase = await createSupabaseServerClient()
  const access = await getCurrentUserAccess(supabase)

  const routeRedirect = resolveRoute(access)
  if (routeRedirect) {
    redirect(routeRedirect)
  }
  if (!access.isOwner) {
    redirect("/forbidden")
  }

  const [{ data: organizationsData }, { data: profilesData }, { data: membershipsData }] =
    await Promise.all([
      supabase
        .from("organizations")
        .select("id,name,slug,subdomain,created_at")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,avatar_url,role"),
      supabase.from("organization_memberships").select("user_id,organization_id"),
    ])

  const organizations = (organizationsData ?? []) as OrganizationRow[]
  const profiles = (profilesData ?? []) as ProfileRow[]
  const memberships = (membershipsData ?? []) as MembershipRow[]
  const membershipByUserId = new Map(
    memberships.map((row) => [row.user_id, row.organization_id] as const)
  )
  const organizationNameById = new Map(
    organizations.map((organization) => [organization.id, organization.name] as const)
  )

  const users = profiles
    .filter((profile) => {
      const role = (profile.role ?? "").trim().toLowerCase()
      if (role === "owner") return false
      return true
    })
    .map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      organization_id: membershipByUserId.get(profile.id) ?? null,
      organization_name: organizationNameById.get(membershipByUserId.get(profile.id) ?? "") ?? null,
    }))

  return <OwnerDashboard organizations={organizations} users={users} />
}
