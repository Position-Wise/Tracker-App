import {
  getCachedCurrentUserAccessState,
  getCachedSupabaseServerClient,
} from "@/lib/cached-access"
import {
  deriveCurrentUserAccessState,
  fetchCurrentUserSubscription,
  getEmptyCurrentUserAccessState,
  resolveCurrentUserAdminState,
  type AccessQueryClient,
  type CurrentUserAccessState,
} from "@/lib/current-user-access"
import { getCurrentUserAccess as resolveCurrentUserAccess } from "@/lib/current-user-route-access"
import { createPaymentProofSignedUrl } from "@/lib/payment-proof-storage"

type SupabaseServerClient = Awaited<ReturnType<typeof getCachedSupabaseServerClient>>

export async function getCurrentUserAccessState(
  providedSupabase?: SupabaseServerClient,
  orgId?: string | null
): Promise<CurrentUserAccessState> {
  if (!providedSupabase) {
    return getCachedCurrentUserAccessState(orgId ?? null)
  }

  const access = await resolveCurrentUserAccess(
    providedSupabase,
    orgId ? { orgId } : undefined
  )

  if (!access.user) {
    return getEmptyCurrentUserAccessState(null)
  }

  const organizationId = access.organizationId
  const [{ isAdmin, role, source }, subscriptionRaw] = await Promise.all([
    resolveCurrentUserAdminState(providedSupabase as unknown as AccessQueryClient, access.user.id),
    fetchCurrentUserSubscription(
      providedSupabase as unknown as AccessQueryClient,
      access.user.id,
      organizationId
    ),
  ])

  let subscription = subscriptionRaw
  if (subscription?.payment_proof) {
    const signedUrl = await createPaymentProofSignedUrl(subscription.payment_proof)
    subscription = {
      ...subscription,
      payment_proof: signedUrl ?? subscription.payment_proof,
    }
  }

  return deriveCurrentUserAccessState({
    user: access.user,
    role,
    isAdmin,
    adminResolutionSource: source,
    subscription,
  })
}
