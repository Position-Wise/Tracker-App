import { headers } from "next/headers"
import { createOrganizationInvite } from "../plans/actions"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"

export const dynamic = "force-dynamic"

type InviteRow = {
  id: string
  email: string | null
  role: string | null
  token: string
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default async function AdminInvitesPage() {
  const supabase = await createSupabaseServerClient()
  const access = await getCurrentUserAccess(supabase)
  const canManage = access.isOwner || access.organizationRole === "org_admin"

  if (!canManage || !access.organizationId) {
    return (
      <section className="rounded-md border border-border p-4 text-sm text-muted-foreground">
        Invite management is available for organization admins.
      </section>
    )
  }

  const { data } = await supabase
    .from("organization_invites")
    .select("id,email,role,token,created_at")
    .eq("organization_id", access.organizationId)
    .order("created_at", { ascending: false })
    .limit(50)

  const h = await headers()
  const origin = h.get("origin") ?? `https://${h.get("host") ?? ""}`
  const invites = ((data as InviteRow[] | null) ?? []).filter((invite) => invite.token?.trim())
  const createInviteAction = async (formData: FormData) => {
    "use server"
    await createOrganizationInvite(formData)
  }

  return (
    <section className="space-y-6">
      <article className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-semibold">Create Invite</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          New members receive a unique link and are added as members.
        </p>
        <form action={createInviteAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder="member@company.com"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Create invite
          </button>
        </form>
      </article>

      <article className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-base font-semibold">Recent Invites</h2>
        {!invites.length ? (
          <p className="mt-3 text-sm text-muted-foreground">No invites yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {invites.map((invite) => {
              const url = `${origin}/invite/${invite.token}`
              return (
                <div key={invite.id} className="rounded-md border border-border/70 p-3 text-sm">
                  <p className="font-medium">{invite.email ?? "Unknown email"}</p>
                  <p className="text-xs text-muted-foreground">Role: {invite.role ?? "member"}</p>
                  <p className="text-xs text-muted-foreground">Created: {formatDate(invite.created_at)}</p>
                  <p className="mt-2 break-all text-xs">{url}</p>
                </div>
              )
            })}
          </div>
        )}
      </article>
    </section>
  )
}
