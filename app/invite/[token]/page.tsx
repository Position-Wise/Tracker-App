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

  const { error } = await supabase.rpc("accept_organization_invite", {
    p_token: inviteToken,
  })

  if (error) {
    console.error("Invite accept failed:", error)
    redirect("/dashboard")
  }

  redirect("/dashboard")
}
