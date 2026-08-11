import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { mergeAuthCookieWriteOptions } from "@/lib/auth-cookie-options"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"

export const dynamic = "force-dynamic"

type OrganizationRow = {
  id: string
  name: string | null
  subdomain: string | null
}

async function selectOwnerAdminOrg(formData: FormData) {
  "use server"

  const organizationId = String(formData.get("organizationId") ?? "").trim()
  if (!organizationId) {
    redirect("/admin-select")
  }

  const supabase = await createSupabaseServerClient()
  const access = await getCurrentUserAccess(supabase)
  if (!access.user || !access.isOwner) {
    redirect("/")
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .maybeSingle()

  if (!organization?.id) {
    redirect("/admin-select")
  }

  const cookieStore = await cookies()
  cookieStore.set(
    "owner_admin_org_id",
    organizationId,
    mergeAuthCookieWriteOptions({
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    })
  )

  redirect("/admin")
}

type AdminSelectPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminSelectPage({ searchParams }: AdminSelectPageProps) {
  const supabase = await createSupabaseServerClient()
  const access = await getCurrentUserAccess(supabase)
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const orgRaw = resolvedSearchParams.org
  const orgFromQuery = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw

  if (!access.user) {
    redirect("/sign-in")
  }

  if (!access.isOwner) {
    redirect("/admin")
  }

  const { data } = await supabase
    .from("organizations")
    .select("id,name,subdomain")
    .order("name", { ascending: true })

  const organizations = ((data as OrganizationRow[] | null) ?? []).filter(
    (org) => (org.id ?? "").trim().length > 0
  )
  const initialOrganizationId = (orgFromQuery ?? access.organizationId ?? "").trim()

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-20 px-6">
      <section className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
        <h1 className="mt-2 text-2xl font-semibold">Select Organization</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick the organization you want to manage in the admin control panel.
        </p>
        <form action={selectOwnerAdminOrg} className="mt-5 space-y-3">
          <select
            name="organizationId"
            required
            defaultValue={initialOrganizationId}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select organization
            </option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {(organization.name ?? "Organization").trim()}{" "}
                {organization.subdomain ? `(${organization.subdomain})` : ""}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Open admin control panel
          </button>
        </form>
      </section>
    </main>
  )
}
