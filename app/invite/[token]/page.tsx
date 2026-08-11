import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type InvitePageProps = {
  params: Promise<{
    token: string
  }>
}

export const dynamic = "force-dynamic"

export default async function InviteTokenPage({ params }: InvitePageProps) {
  const { token } = await params
  const inviteToken = token.trim()
  if (!inviteToken) {
    redirect("/dashboard")
  }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/sign-in?next=/invite/${encodeURIComponent(inviteToken)}`)
  }

  const { data: inviteRow } = await supabase
    .from("organization_invites")
    .select("organization_id,role,expires_at,used_at,email")
    .eq("token", inviteToken)
    .maybeSingle()

  const organizationId = (inviteRow?.organization_id ?? "").trim()
  const role = ((inviteRow?.role ?? "member") as string).trim().toLowerCase() || "member"

  if (!organizationId) {
    redirect("/dashboard")
  }

  const usedAt = (inviteRow?.used_at ?? "").trim()
  if (usedAt) {
    redirect("/dashboard")
  }

  const expiresAtRaw = (inviteRow?.expires_at ?? "").trim()
  if (expiresAtRaw) {
    const expiresAt = new Date(expiresAtRaw)
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
      redirect("/dashboard")
    }
  }

  const inviteEmail = (inviteRow?.email ?? "").trim().toLowerCase()
  const userEmail = (user.email ?? "").trim().toLowerCase()
  if (inviteEmail && userEmail && inviteEmail !== userEmail) {
    redirect("/dashboard")
  }

  await supabase.from("organization_memberships").upsert(
    {
      organization_id: organizationId,
      user_id: user.id,
      role,
    },
    { onConflict: "organization_id,user_id", ignoreDuplicates: true }
  )

  await supabase
    .from("organization_invites")
    .update({ used_at: new Date().toISOString() })
    .eq("token", inviteToken)

  redirect("/dashboard")
}
