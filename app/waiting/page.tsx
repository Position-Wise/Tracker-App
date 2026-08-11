import { redirect } from "next/navigation"
import { getCurrentUserAccess } from "@/lib/current-user-route-access"
import { getCurrentUserAccessState } from "@/lib/subscription-access"
import { WaitingClient } from "@/app/waiting/waiting-client"
import { getMemberHomePathForState } from "@/lib/subscription-status"

export default async function WaitingPage() {
  const [access, state] = await Promise.all([
    getCurrentUserAccess(),
    getCurrentUserAccessState(),
  ])

  if (!access.user) redirect("/sign-in")
  if (access.tenantNotFound) redirect("/organization-not-found")
  if (access.forbidden) redirect("/forbidden")
  if (access.isOwner) redirect("/owner")
  if (access.organizationId) redirect(getMemberHomePathForState(state.accessState))
  if (state.accessState === "approved") redirect("/dashboard")

  const metadata = access.user.user_metadata as
    | { full_name?: string; name?: string; avatar_url?: string; picture?: string }
    | undefined
  const displayName = metadata?.full_name ?? metadata?.name ?? access.user.email ?? "there"
  const avatarUrl = metadata?.avatar_url ?? metadata?.picture ?? null

  return (
    <WaitingClient
      displayName={displayName}
      avatarUrl={avatarUrl}
      isAssigned={false}
    />
  )
}